<?php
// api_import.php
require_once 'auth.php'; // Ładujemy, aby pobrać $organizer_id (i autoryzację)
require_once 'functions.php'; // Zawiera funkcje do interakcji z BD

header('Content-Type: application/json');

// Sprawdzenie autoryzacji
if (!can_edit($permission_level)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Brak uprawnień do importu danych.']);
    exit;
}
if (!$organizer_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Brak przypisanego organizera do importu.']);
    exit;
}

// Odczytaj surowe dane POST
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data['data'])) {
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format pliku JSON (oczekiwano klucza "data").']);
    exit;
}

$imported_data = $data['data']; 
global $conn;
$conn->begin_transaction();

// Używamy tablic do mapowania starych ID na nowe (gdyby import miał być cross-aplikacyjny)
// Dla bezpieczeństwa, w tej wersji po prostu ignorujemy stare ID i tworzymy nowe, ale musimy
// je przechwycić, by powiązać dzieci/płatności/miejsca.
$guest_id_map = []; // Stare ID Gościa (z pliku) => Nowe ID Gościa (z BD)
$vendor_id_map = []; // Stare ID Dostawcy (z pliku) => Nowe ID Dostawcy (z BD)
$child_id_map = []; // Stare ID Dziecka (z pliku) => Nowe ID Dziecka (z BD)

try {
    // Krok 1: Wyczyść WSZYSTKIE dane powiązane z organizerem (bezpieczna kolejność)
    $conn->query("DELETE FROM table_seats WHERE table_id IN (SELECT id FROM tables WHERE organizer_id = $organizer_id)");
    $conn->query("DELETE FROM tables WHERE organizer_id = $organizer_id");
    $conn->query("DELETE FROM vendor_payments WHERE vendor_id IN (SELECT id FROM vendors WHERE organizer_id = $organizer_id)");
    $conn->query("DELETE FROM vendors WHERE organizer_id = $organizer_id");
    $conn->query("DELETE FROM children WHERE guest_group_id IN (SELECT id FROM guests WHERE organizer_id = $organizer_id)");
    $conn->query("DELETE FROM guests WHERE organizer_id = $organizer_id");
    $conn->query("DELETE FROM tasks WHERE organizer_id = $organizer_id");
    $conn->query("DELETE FROM settings WHERE organizer_id = $organizer_id");

    // Krok 2: Zaimportuj ustawienia (w tym RODO i Zdjęcia)
    if (isset($imported_data['settings'])) {
        foreach ($imported_data['settings'] as $key => $value) {
            update_setting($organizer_id, $key, $value); // Używamy prawidłowej funkcji z functions.php
        }
    }

    // Krok 3: Zaimportuj gości i dzieci (z pełnym zestawem nowych pól)
    if (isset($imported_data['guests'])) {
        foreach ($imported_data['guests'] as $guest_group) {
            
            $old_guest_id = $guest_group['id']; // Stare ID z pliku
            
            $stmt_guest = $conn->prepare("
                INSERT INTO guests (
                    organizer_id, guest1_name, guest2_name, accommodation, rsvp_status, rsvp_token, rsvp_date, notes, after_party, confirmed_adults, confirmed_children
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            // Przygotowanie danych z pliku (z nowymi/zmienionymi kolumnami)
            $accommodation = (int)($guest_group['accommodation'] ?? 0);
            $rsvp_status = $guest_group['rsvp_status'] ?? 'unconfirmed'; 
            $rsvp_token = $guest_group['rsvp_token'] ?? null;
            $rsvp_date = $guest_group['rsvp_date'] ?? null;
            $notes = $guest_group['notes'] ?? null;
            $after_party = (int)($guest_group['after_party'] ?? 0);
            $confirmed_adults = (int)($guest_group['confirmed_adults'] ?? 0);
            $confirmed_children = (int)($guest_group['confirmed_children'] ?? 0);
            
            $stmt_guest->bind_param("ississsiiii", 
                $organizer_id, 
                $guest_group['guest1_name'], 
                $guest_group['guest2_name'], 
                $accommodation,
                $rsvp_status,
                $rsvp_token,
                $rsvp_date,
                $notes,
                $after_party,
                $confirmed_adults,
                $confirmed_children
            );
            $stmt_guest->execute();
            $new_guest_id = $conn->insert_id; 
            $guest_id_map[$old_guest_id] = $new_guest_id; // Mapowanie ID

            if (isset($guest_group['children'])) {
                foreach ($guest_group['children'] as $child) {
                    $old_child_id = $child['id'];
                    $stmt_child = $conn->prepare("INSERT INTO children (guest_group_id, child_name, age) VALUES (?, ?, ?)");
                    $stmt_child->bind_param("isi", $new_guest_id, $child['child_name'], $child['age']);
                    $stmt_child->execute();
                    $new_child_id = $conn->insert_id;
                    $child_id_map[$old_child_id] = $new_child_id; // Mapowanie ID Dziecka
                }
            }
        }
    }

    // Krok 4: Import dostawców (vendors) i płatności (vendor_payments)
    if (isset($imported_data['vendors'])) {
        foreach ($imported_data['vendors'] as $vendor) {
             $old_vendor_id = $vendor['id'];
             
             // Używamy nowego schematu
             $stmt_vendor = $conn->prepare("INSERT INTO vendors (organizer_id, name, cost, payment_date) VALUES (?, ?, ?, ?)");
             $stmt_vendor->bind_param("isds", $organizer_id, $vendor['name'], $vendor['cost'], $vendor['payment_date']);
             $stmt_vendor->execute();
             $new_vendor_id = $conn->insert_id;
             $vendor_id_map[$old_vendor_id] = $new_vendor_id; // Mapowanie ID Dostawcy
             
             // Import Płatności (jeśli są dostępne w strukturze danych eksportu - musi być total_paid / payments w JSON)
             // Zakładamy, że płatności nie są dostępne w tym uproszczonym eksportcie, więc ich nie importujemy.
             // W pełnej wersji byłby tu kod do importu zagnieżdżonej tablicy vendor_payments.
        }
    }
    
    // Krok 5: Import zadań (tasks)
    if (isset($imported_data['tasks'])) {
        foreach ($imported_data['tasks'] as $task) {
            $stmt_task = $conn->prepare("INSERT INTO tasks (organizer_id, name, date, owner, completed, completion_date, is_payment_task, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            $vendor_id = null;
            if ($task['vendor_id'] && isset($vendor_id_map[$task['vendor_id']])) {
                $vendor_id = $vendor_id_map[$task['vendor_id']]; // Mapowanie ID
            }
            
            $completed = (int)($task['completed'] ?? 0);
            $is_payment_task = (int)($task['is_payment_task'] ?? 0);
            
            $stmt_task->bind_param("isssisii", 
                $organizer_id, 
                $task['name'], 
                $task['date'], 
                $task['owner'], 
                $completed,
                $task['completion_date'] ?? null,
                $is_payment_task,
                $vendor_id
            );
            $stmt_task->execute();
        }
    }
    
    // Krok 6: Import stołów (tables) i usadzenia (table_seats)
    if (isset($imported_data['tables'])) {
        foreach ($imported_data['tables'] as $table) {
            $old_table_id = $table['id'];
            
            $stmt_table = $conn->prepare("INSERT INTO tables (organizer_id, name, capacity, shape) VALUES (?, ?, ?, ?)");
            $stmt_table->bind_param("isis", $organizer_id, $table['name'], $table['capacity'], $table['shape']);
            $stmt_table->execute();
            $new_table_id = $conn->insert_id;

            if (isset($table['seats'])) {
                foreach ($table['seats'] as $seat) {
                    $person_id = null;
                    if ($seat['person_type'] === 'guest1' || $seat['person_type'] === 'guest2') {
                        // Mapowanie gościa (używa ID grupy)
                        $person_id = $guest_id_map[$seat['person_id']] ?? null;
                    } elseif ($seat['person_type'] === 'child') {
                        // Mapowanie dziecka (używa ID dziecka)
                        $person_id = $child_id_map[$seat['person_id']] ?? null; 
                    }
                    
                    $stmt_seat = $conn->prepare("INSERT INTO table_seats (table_id, seat_index, person_type, person_id) VALUES (?, ?, ?, ?)");
                    $stmt_seat->bind_param("iisi", $new_table_id, $seat['seat_index'], $seat['person_type'], $person_id);
                    $stmt_seat->execute();
                }
            }
        }
    }


    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Dane pomyślnie zaimportowane. Wymaga odświeżenia strony.']);

} catch (Exception $e) {
    $conn->rollback();
    // Zabezpieczenie przed potencjalnymi błędami kodowania
    $error_msg = preg_replace('/[[:^print:]]/', '', $e->getMessage()); 
    echo json_encode(['success' => false, 'message' => 'Błąd transakcji w bazie danych: ' . $error_msg]);
}

?>