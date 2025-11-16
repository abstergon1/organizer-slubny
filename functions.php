<?php
// functions.php
require_once 'db_connect.php';

function get_person_name($person_type, $person_id) {
    global $conn;
    if ($person_type === 'guest1' || $person_type === 'guest2') {
        $stmt = $conn->prepare("SELECT guest1_name, guest2_name FROM guests WHERE id = ?");
        $stmt->bind_param("i", $person_id);
    } elseif ($person_type === 'child') {
        // ZMIANA: Pobieramy również wiek
        $stmt = $conn->prepare("SELECT child_name, age FROM children WHERE id = ?");
        $stmt->bind_param("i", $person_id);
    } else { return "Nieznany Gość"; }
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        if ($person_type === 'child') {
            // ZMIANA: Zwracamy Imię i Wiek
            return $row['child_name'] . ' (' . $row['age'] . 'l)';
        }
        // Dla dorosłych (guest1/guest2) bez zmian
        return ($person_type === 'guest1') ? $row['guest1_name'] : $row['guest2_name']; 
    }
    return "Błąd Gościa";
}
// --- USTAWIENIA ---
function get_settings($organizer_id) {
    global $conn;
    $settings = [];
    $stmt = $conn->prepare("SELECT setting_key, setting_value FROM settings WHERE organizer_id = ?");
    $stmt->bind_param("i", $organizer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        // Nowe klucze: 'photos_info', 'rodo_info' zostaną pobrane
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    return $settings;
}

function update_setting($organizer_id, $key, $value) {
    global $conn;
    // Nowe klucze: 'photos_info', 'rodo_info' zostaną zapisane
    $stmt = $conn->prepare("INSERT INTO settings (organizer_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->bind_param("isss", $organizer_id, $key, $value, $value);
    return $stmt->execute();
}

// --- ZADANIA ---
function get_tasks($organizer_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM tasks WHERE organizer_id = ? ORDER BY date ASC");
    $stmt->bind_param("i", $organizer_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}
function add_task($organizer_id, $name, $date, $owner = null, $is_payment_task = false, $vendor_id = null) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO tasks (organizer_id, name, date, owner, is_payment_task, vendor_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssis", $organizer_id, $name, $date, $owner, $is_payment_task, $vendor_id);
    return $stmt->execute();
}
function update_task_completion($organizer_id, $task_id, $completed) {
    global $conn;
    $completion_date = $completed ? date('Y-m-d') : null;
    $stmt = $conn->prepare("UPDATE tasks SET completed = ?, completion_date = ? WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("isii", $completed, $completion_date, $task_id, $organizer_id);
    return $stmt->execute();
}
function delete_task($organizer_id, $task_id) {
    global $conn;
    $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("ii", $task_id, $organizer_id);
    return $stmt->execute();
}

// --- GOŚCIE ---
// MODYFIKACJA: get_guests - upewnienie się, że pobieramy nowe kolumny
function get_guests($organizer_id) {
    global $conn;
    // Zmieniono SELECT * w oryginalnym kodzie to obejmie nowe kolumny
    $stmt = $conn->prepare("SELECT * FROM guests WHERE organizer_id = ?");
    $stmt->bind_param("i", $organizer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $guests = [];
    while ($guest_row = $result->fetch_assoc()) {
        $child_stmt = $conn->prepare("SELECT * FROM children WHERE guest_group_id = ?");
        $child_stmt->bind_param("i", $guest_row['id']);
        $child_stmt->execute();
        $guest_row['children'] = $child_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $guests[] = $guest_row;
    }
    return $guests;
}

// NOWA FUNKCJA: Generuje unikalny token (jeśli nie istnieje)
function generate_rsvp_token($guest_id) {
    global $conn;
    $token = bin2hex(random_bytes(16)); // 32 znaki
    
    // Upewniamy się, że gość należy do organizera
    $stmt = $conn->prepare("UPDATE guests SET rsvp_token = ? WHERE id = ? AND rsvp_token IS NULL");
    $stmt->bind_param("si", $token, $guest_id);
    if ($stmt->execute() && $stmt->affected_rows > 0) {
        return $token;
    }
    
    // Jeśli token już istnieje, pobierz go
    $stmt_fetch = $conn->prepare("SELECT rsvp_token FROM guests WHERE id = ?");
    $stmt_fetch->bind_param("i", $guest_id);
    $stmt_fetch->execute();
    $result = $stmt_fetch->get_result()->fetch_assoc();
    return $result['rsvp_token'] ?? false;
}

// NOWA FUNKCJA: Aktualizuje liczbę potwierdzonych dorosłych (dla index.php)
function update_confirmed_adults($organizer_id, $guest_id, $count) {
    global $conn;
    $count_int = (int)$count;
    $stmt = $conn->prepare("UPDATE guests SET confirmed_adults = ? WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("iii", $count_int, $guest_id, $organizer_id);
    return $stmt->execute();
}

// NOWA FUNKCJA: Aktualizuje liczbę potwierdzonych dzieci (dla index.php)
function update_confirmed_children($organizer_id, $guest_id, $count) {
    global $conn;
    $count_int = (int)$count;
    $stmt = $conn->prepare("UPDATE guests SET confirmed_children = ? WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("iii", $count_int, $guest_id, $organizer_id);
    return $stmt->execute();
}

// UWAGA: Trzeba też zmodyfikować update_rsvp_response, aby na starcie wypełniał te pola
function update_rsvp_response($guest_id, $confirmed, $accommodation = 0, $notes = null, $after_party = 0) { 
    global $conn;
    
    // Pobierz liczbę dorosłych i dzieci w grupie (oryginalnie zaproszonych)
    $stmt_count = $conn->prepare("
        SELECT 
            (guest1_name IS NOT NULL) + (guest2_name IS NOT NULL) AS max_adults,
            (SELECT COUNT(id) FROM children WHERE guest_group_id = ?) AS max_children
        FROM guests WHERE id = ?
    ");
    $stmt_count->bind_param("ii", $guest_id, $guest_id);
    $stmt_count->execute();
    $counts = $stmt_count->get_result()->fetch_assoc();
    
    $max_adults = $counts['max_adults'];
    $max_children = $counts['max_children'];

    if ($confirmed) {
        $status = 'pending';
        // ZMIANA: Na starcie ustawiamy max, jeśli potwierdzone
        $c_adults = $max_adults;
        $c_children = $max_children;
    } else {
        $status = 'rejected';
        // ZMIANA: Na starcie ustawiamy 0, jeśli rezygnacja
        $c_adults = 0;
        $c_children = 0;
    }
    
    $stmt = $conn->prepare("UPDATE guests SET rsvp_status = ?, accommodation = ?, notes = ?, after_party = ?, confirmed_adults = ?, confirmed_children = ?, rsvp_date = NOW() WHERE id = ?");
    // ZMIANA STRING TYPÓW: s (status), i (acc), s (notes), i (ap), i (c_adults), i (c_children), i (guest_id)
    $stmt->bind_param("sisiiii", $status, $accommodation, $notes, $after_party, $c_adults, $c_children, $guest_id);
    return $stmt->execute();
}

// NOWA FUNKCJA: Aktualizacja statusu AFTER_PARTY (dla index.php)
function update_guest_after_party($organizer_id, $guest_id, $value) {
    global $conn;
    $value_int = (int)$value; // TERAZ JEST TO LICZBA OSÓB
    $stmt = $conn->prepare("UPDATE guests SET after_party = ? WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("iii", $value_int, $guest_id, $organizer_id);
    return $stmt->execute();
}

function update_guest_rsvp_status($organizer_id, $guest_id, $new_status) {
    global $conn;
    $allowed_statuses = ['unconfirmed', 'pending', 'confirmed', 'rejected']; // DODANO 'rejected'
    if (!in_array($new_status, $allowed_statuses)) return false;
    
    $stmt = $conn->prepare("UPDATE guests SET rsvp_status = ? WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("sii", $new_status, $guest_id, $organizer_id);
    return $stmt->execute();
}

// NOWA FUNKCJA: Pobiera gościa na podstawie tokena RSVP (dla rsvp.php)
function get_guest_by_token($token) {
    global $conn;    
    // Krok 1: Pobierz podstawowe dane gościa
    $stmt_guest = $conn->prepare("SELECT * FROM guests WHERE rsvp_token = ?");
    $stmt_guest->bind_param("s", $token);
    $stmt_guest->execute();
    $guest = $stmt_guest->get_result()->fetch_assoc();
    
    if (!$guest) {
        return null;
    }
    
    // Krok 2: Pobierz dzieci gościa
    $child_stmt = $conn->prepare("SELECT * FROM children WHERE guest_group_id = ?");
    $child_stmt->bind_param("i", $guest['id']);
    $child_stmt->execute();
    $guest['children'] = $child_stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Krok 3: Pobierz nazwę stołu (szukaj przypisanego miejsca dla gościa 1, gościa 2 lub dowolnego dziecka)
    $guest_id = $guest['id'];
    
    // Szukamy przypisanego miejsca dla dorosłego
    $stmt_table = $conn->prepare("
        SELECT 
            t.name AS table_name 
        FROM table_seats ts
        JOIN tables t ON ts.table_id = t.id
        WHERE 
            (ts.person_type IN ('guest1', 'guest2') AND ts.person_id = ?) 
            OR (ts.person_type = 'child' AND ts.person_id IN (SELECT id FROM children WHERE guest_group_id = ?))
        LIMIT 1
    ");
    $stmt_table->bind_param("ii", $guest_id, $guest_id);
    $stmt_table->execute();
    $table_result = $stmt_table->get_result()->fetch_assoc();
    
    $guest['table_name'] = $table_result['table_name'] ?? null;

    return $guest;
}

function add_guest($organizer_id, $guest1_name, $guest2_name, $children_data) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO guests (organizer_id, guest1_name, guest2_name) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $organizer_id, $guest1_name, $guest2_name);
    if ($stmt->execute()) {
        $guest_id = $conn->insert_id;
        foreach ($children_data as $child) {
            $stmt_child = $conn->prepare("INSERT INTO children (guest_group_id, child_name, age) VALUES (?, ?, ?)");
            $stmt_child->bind_param("isi", $guest_id, $child['name'], $child['age']);
            $stmt_child->execute();
        }
        return true;
    }
    return false;
}
function edit_guest($organizer_id, $guest_id, $guest1_name, $guest2_name, $children_data) {
    global $conn;
    $conn->begin_transaction();
    try {
        $stmt_guest = $conn->prepare("UPDATE guests SET guest1_name = ?, guest2_name = ? WHERE id = ? AND organizer_id = ?");
        $stmt_guest->bind_param("ssii", $guest1_name, $guest2_name, $guest_id, $organizer_id);
        $stmt_guest->execute();

        $stmt_delete_children = $conn->prepare("DELETE FROM children WHERE guest_group_id = ?");
        $stmt_delete_children->bind_param("i", $guest_id);
        $stmt_delete_children->execute();

        foreach ($children_data as $child) {
            $stmt_child = $conn->prepare("INSERT INTO children (guest_group_id, child_name, age) VALUES (?, ?, ?)");
            $stmt_child->bind_param("isi", $guest_id, $child['name'], $child['age']);
            $stmt_child->execute();
        }
        $conn->commit();
        return true;
    } catch (Exception $e) { $conn->rollback(); return false; }
}
function update_guest_status($organizer_id, $guest_id, $key, $value) {
    global $conn;
    $allowed_keys = ['confirmed', 'accommodation'];
    if (!in_array($key, $allowed_keys)) return false;
    $stmt = $conn->prepare("UPDATE guests SET $key = ? WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("iii", $value, $guest_id, $organizer_id);
    return $stmt->execute();
}
function delete_guest($organizer_id, $guest_id) {
    global $conn;
    $stmt = $conn->prepare("DELETE FROM guests WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("ii", $guest_id, $organizer_id);
    return $stmt->execute();
}

// --- USŁUGODAWCY / KOSZTY ---

// NOWA FUNKCJA: Pobiera płatności dla dostawcy
function get_vendor_payments($vendor_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM vendor_payments WHERE vendor_id = ? ORDER BY payment_date ASC");
    $stmt->bind_param("i", $vendor_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

// NOWA FUNKCJA: Dodaje nową płatność
function add_vendor_payment($vendor_id, $amount, $date, $description) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO vendor_payments (vendor_id, amount, payment_date, description) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("idss", $vendor_id, $amount, $date, $description);
    return $stmt->execute();
}

function delete_vendor_payment($payment_id, $organizer_id) {
    global $conn;
    $conn->begin_transaction();
    
    try {
        // Krok 1: Pobierz ID dostawcy i datę płatności (potrzebne do zlokalizowania zadania)
        $stmt_fetch = $conn->prepare("SELECT vendor_id, payment_date, amount FROM vendor_payments WHERE id = ?");
        $stmt_fetch->bind_param("i", $payment_id);
        $stmt_fetch->execute();
        $payment_details = $stmt_fetch->get_result()->fetch_assoc();

        if (!$payment_details) {
            throw new Exception("Płatność o ID $payment_id nie istnieje.");
        }
        
        $vendor_id = $payment_details['vendor_id'];
        $payment_date = $payment_details['payment_date'];
        $amount = $payment_details['amount'];

        // Krok 2: Usuń powiązane zadanie rejestracyjne
        $vendor_name = get_vendor_name_by_id($vendor_id);
        
        // NOWY WZORZEC: Szukamy zadania, które zawiera 'Zarejestrowano wpłatę: [Nazwa Dostawcy]'
        // To jest najbezpieczniejszy wzorzec, bo nie polega na formacie liczby.
        $task_name_pattern_safe = "Zarejestrowano wpłatę: " . $vendor_name . "%"; 
        
        // Ograniczamy do daty, organizera i dostawcy
        $stmt_task = $conn->prepare("
            DELETE FROM tasks 
            WHERE 
                organizer_id = ? AND 
                vendor_id = ? AND 
                date = ? AND 
                completed = 1 AND 
                name LIKE ?
        ");
        
        $stmt_task->bind_param("iiss", $organizer_id, $vendor_id, $payment_date, $task_name_pattern_safe);
        $stmt_task->execute();
        
        // Krok 3: Usuń samą płatność
        $stmt_delete = $conn->prepare("DELETE FROM vendor_payments WHERE id = ?");
        $stmt_delete->bind_param("i", $payment_id);
        $stmt_delete->execute();
        
        $conn->commit();
        return true;
        
    } catch (Exception $e) {
        $conn->rollback();
        // Propagacja błędu, jeśli nie udało się znaleźć płatności
        if (strpos($e->getMessage(), "Płatność o ID") !== false) {
             throw $e;
        }
        // W przeciwnym razie, zwróć błąd generyczny
        return false;
    }
}

/**
 * Pobiera listę kategorii dla organizera.
 */
function get_vendor_categories($organizer_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT id, name FROM vendor_categories WHERE organizer_id = ? ORDER BY name ASC");
    $stmt->bind_param("i", $organizer_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

/**
 * Dodaje nową kategorię.
 */
function add_vendor_category($organizer_id, $name) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO vendor_categories (organizer_id, name) VALUES (?, ?)");
    $stmt->bind_param("is", $organizer_id, $name);
    return $stmt->execute();
}

/**
 * Usuwa kategorię i ustawia category_id na NULL dla powiązanych dostawców.
 */
function delete_vendor_category($organizer_id, $category_id) {
    global $conn;
    $conn->begin_transaction();
    try {
        // 1. Zmień category_id na NULL u wszystkich dostawców
        $stmt_update = $conn->prepare("UPDATE vendors SET category_id = NULL WHERE category_id = ? AND organizer_id = ?");
        $stmt_update->bind_param("ii", $category_id, $organizer_id);
        $stmt_update->execute();
        
        // 2. Usuń kategorię
        $stmt_delete = $conn->prepare("DELETE FROM vendor_categories WHERE id = ? AND organizer_id = ?");
        $stmt_delete->bind_param("ii", $category_id, $organizer_id);
        $stmt_delete->execute();
        
        $conn->commit();
        return true;
    } catch (Exception $e) {
        $conn->rollback();
        return false;
    }
}

function get_vendors($organizer_id) {
    global $conn;
    $stmt = $conn->prepare("
        SELECT 
            v.*, 
            vc.name AS category_name,  /* DODANO NAZWĘ KATEGORII */
            COALESCE(SUM(vp.amount), 0.00) AS total_paid,
            v.cost <= COALESCE(SUM(vp.amount), 0.00) AS paid_full_status
        FROM vendors v
        LEFT JOIN vendor_payments vp ON v.id = vp.vendor_id
        LEFT JOIN vendor_categories vc ON v.category_id = vc.id /* DODANO ŁĄCZENIE Z KATEGORIĄ */
        WHERE v.organizer_id = ?
        GROUP BY v.id, vc.name
        ORDER BY vc.name ASC, v.name ASC /* GRUPUJEMY WYNIKI PO KATEGORII */
    ");
    $stmt->bind_param("i", $organizer_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
}

function add_vendor($organizer_id, $name, $cost, $payment_date, $category_id) {
    global $conn;
    // Sprawdź, czy category_id to 0 (wybór "Brak/Wybierz"), jeśli tak, ustaw NULL
    $final_category_id = $category_id > 0 ? $category_id : null;
    $stmt = $conn->prepare("INSERT INTO vendors (organizer_id, name, cost, payment_date, category_id) VALUES (?, ?, ?, ?, ?)");
    $payment_date_or_null = !empty($payment_date) ? $payment_date : null;
    // ZMIANA: Dodano category_id do binda: isdsi
    $stmt->bind_param("isdsi", $organizer_id, $name, $cost, $payment_date_or_null, $final_category_id); 
    if ($stmt->execute()) return $conn->insert_id;
    return false;
}

function update_vendor($organizer_id, $id, $name, $cost, $payment_date, $category_id) {
    global $conn;
    $final_category_id = $category_id > 0 ? $category_id : null;
    $stmt = $conn->prepare("UPDATE vendors SET name = ?, cost = ?, payment_date = ?, category_id = ? WHERE id = ? AND organizer_id = ?");
    $payment_date_or_null = !empty($payment_date) ? $payment_date : null;
    // ZMIANA: Dodano category_id do binda: sdsiii
    $stmt->bind_param("sdsiii", $name, $cost, $payment_date_or_null, $final_category_id, $id, $organizer_id); 
    return $stmt->execute();
}

// MODYFIKACJA: delete_vendor - usunięcie powiązanych płatności
function delete_vendor($organizer_id, $vendor_id) {
    global $conn;
    $conn->begin_transaction();
    try {
        // Dodano: Usuwanie płatności powiązanych z dostawcą
        $stmt_payments = $conn->prepare("DELETE FROM vendor_payments WHERE vendor_id = ?");
        $stmt_payments->bind_param("i", $vendor_id);
        $stmt_payments->execute();

        $stmt_task = $conn->prepare("DELETE FROM tasks WHERE vendor_id = ? AND organizer_id = ?");
        $stmt_task->bind_param("ii", $vendor_id, $organizer_id);
        $stmt_task->execute();

        $stmt_vendor = $conn->prepare("DELETE FROM vendors WHERE id = ? AND organizer_id = ?");
        $stmt_vendor->bind_param("ii", $vendor_id, $organizer_id);
        $stmt_vendor->execute();
        $conn->commit();
        return true;
    } catch (Exception $e) { $conn->rollback(); return false; }
}

/**
 * Pobiera nazwę dostawcy po ID.
 */
function get_vendor_name_by_id($vendor_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT name FROM vendors WHERE id = ?");
    $stmt->bind_param("i", $vendor_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    return $result['name'] ?? 'Nieznany Dostawca';
}

// --- STOŁY I MIEJSCA ---
function get_tables($organizer_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT * FROM tables WHERE organizer_id = ?");
    $stmt->bind_param("i", $organizer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $tables = [];
    while ($table_row = $result->fetch_assoc()) {
        $seat_stmt = $conn->prepare("SELECT * FROM table_seats WHERE table_id = ? ORDER BY seat_index ASC");
        $seat_stmt->bind_param("i", $table_row['id']);
        $seat_stmt->execute();
        $seats_result = $seat_stmt->get_result();
        $table_row['seats'] = [];
        while ($seat_row = $seats_result->fetch_assoc()){
             if ($seat_row['person_type'] && $seat_row['person_id']) {
                $seat_row['person_name'] = get_person_name($seat_row['person_type'], $seat_row['person_id']);
            }
            $table_row['seats'][] = $seat_row;
        }
        $tables[] = $table_row;
    }
    return $tables;
}
function add_table($organizer_id, $name, $capacity, $shape) {
    global $conn;
    $conn->begin_transaction();
    try {
        $stmt_table = $conn->prepare("INSERT INTO tables (organizer_id, name, capacity, shape) VALUES (?, ?, ?, ?)");
        $stmt_table->bind_param("isis", $organizer_id, $name, $capacity, $shape);
        $stmt_table->execute();
        $table_id = $conn->insert_id;
        for ($i = 0; $i < $capacity; $i++) {
            $stmt_seat = $conn->prepare("INSERT INTO table_seats (table_id, seat_index) VALUES (?, ?)");
            $stmt_seat->bind_param("ii", $table_id, $i);
            $stmt_seat->execute();
        }
        $conn->commit();
        return true;
    } catch (Exception $e) { $conn->rollback(); return false; }
}
function delete_table($organizer_id, $table_id) {
    global $conn;
    $stmt = $conn->prepare("DELETE FROM tables WHERE id = ? AND organizer_id = ?");
    $stmt->bind_param("ii", $table_id, $organizer_id);
    return $stmt->execute();
}
function get_seat_assignment($table_id, $seat_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT ts.person_type, ts.person_id FROM table_seats ts JOIN tables t ON ts.table_id = t.id WHERE ts.id = ? AND t.id = ?");
    $stmt->bind_param("ii", $seat_id, $table_id);
    $stmt->execute();
    return $stmt->get_result()->fetch_assoc();
}
function assign_person_to_seat($seat_id, $person_type, $person_id) {
    global $conn;
    $stmt = $conn->prepare("UPDATE table_seats SET person_type = ?, person_id = ? WHERE id = ?");
    $stmt->bind_param("sii", $person_type, $person_id, $seat_id);
    return $stmt->execute();
}
function unassign_person_from_seat($seat_id) {
    global $conn;
    $stmt = $conn->prepare("UPDATE table_seats SET person_type = NULL, person_id = NULL WHERE id = ?");
    $stmt->bind_param("i", $seat_id);
    return $stmt->execute();
}
/**
 * Pobiera listę użytkowników przypisanych do danego organizera.
 * @param int $organizer_id - ID organizera.
 * @return array - Tablica z danymi użytkowników.
 */
function get_organizer_users($organizer_id) {
    global $conn;
    
    // Zabezpieczenie na wypadek, gdyby $organizer_id był null (np. dla admina bez organizera)
    if (is_null($organizer_id)) {
        return []; // Zwróć pustą tablicę, a nie powoduj błędu
    }
    
    // Poprawione zapytanie SQL
    $stmt = $conn->prepare("
        SELECT 
            u.id, 
            u.email, 
            ou.permission_level 
        FROM 
            organizer_users AS ou
        JOIN 
            users AS u ON ou.user_id = u.id
        WHERE 
            ou.organizer_id = ?
        ORDER BY 
            FIELD(ou.permission_level, 'owner', 'editor', 'viewer'), u.email
    ");
    
    if ($stmt === false) {
        // Zabezpieczenie na wypadek błędu w przygotowaniu zapytania
        error_log("Błąd SQL w get_organizer_users: " . $conn->error);
        return [];
    }
    
    $stmt->bind_param("i", $organizer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    return $result->fetch_all(MYSQLI_ASSOC);
}