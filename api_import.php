<?php
// api_import.php
require_once 'functions.php'; // Zakładając, że masz tam funkcje add_...
header('Content-Type: application/json');

// Odczytaj surowe dane POST
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowe dane JSON.']);
    exit;
}

global $conn;
$conn->begin_transaction();

try {
    // Krok 1: Wyczyść istniejące dane w odpowiedniej kolejności
    $conn->query("DELETE FROM table_seats");
    $conn->query("DELETE FROM tables");
    $conn->query("DELETE FROM children");
    $conn->query("DELETE FROM guests");
    $conn->query("DELETE FROM tasks");
    $conn->query("DELETE FROM vendors");
    
    // Krok 2: Zaimportuj ustawienia (jeśli istnieją w pliku)
    if (isset($data['settings'])) {
        foreach ($data['settings'] as $key => $value) {
            update_setting($key, $value);
        }
    }

    // Krok 3: Zaimportuj gości i dzieci
    if (isset($data['guests'])) {
        foreach ($data['guests'] as $guest_group) {
            $stmt_guest = $conn->prepare("INSERT INTO guests (id, guest1_name, guest2_name, confirmed, accommodation) VALUES (?, ?, ?, ?, ?)");
            $stmt_guest->bind_param("issii", $guest_group['id'], $guest_group['guest1_name'], $guest_group['guest2_name'], $guest_group['confirmed'], $guest_group['accommodation']);
            $stmt_guest->execute();
            $guest_id = $guest_group['id']; // Używamy starego ID

            if (isset($guest_group['children'])) {
                foreach ($guest_group['children'] as $child) {
                    $stmt_child = $conn->prepare("INSERT INTO children (id, guest_group_id, child_name, age) VALUES (?, ?, ?, ?)");
                    $stmt_child->bind_param("iisi", $child['id'], $guest_id, $child['child_name'], $child['age']);
                    $stmt_child->execute();
                }
            }
        }
    }

    // Krok 4: Zaimportuj zadania, koszty, stoły (analogicznie)
    // ... (tutaj powinna znaleźć się logika importu dla tasks, vendors, tables, table_seats)
    // To jest skomplikowane, ponieważ trzeba zachować stare ID, aby powiązania (np. zadanie->koszt) działały.
    // Poniżej uproszczony przykład dla kosztów:
    if (isset($data['vendors'])) {
        foreach ($data['vendors'] as $vendor) {
             $stmt_vendor = $conn->prepare("INSERT INTO vendors (id, name, cost, deposit, paid_full, payment_date) VALUES (?, ?, ?, ?, ?, ?)");
             $stmt_vendor->bind_param("isddis", $vendor['id'], $vendor['name'], $vendor['cost'], $vendor['deposit'], $vendor['paid_full'], $vendor['payment_date']);
             $stmt_vendor->execute();
        }
    }
    // ... i tak dalej dla pozostałych tabel ...


    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Dane pomyślnie zaimportowane.']);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Błąd transakcji w bazie danych: ' . $e->getMessage()]);
}

?>