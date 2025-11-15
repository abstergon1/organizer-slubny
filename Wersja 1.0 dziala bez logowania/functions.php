<?php
// functions.php
require_once 'db_connect.php';

// --- Globalne funkcje stanu i ustawień ---
function get_setting($key) {
    global $conn;
    $stmt = $conn->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->bind_param("s", $key);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        return $row['setting_value'];
    }
    return null;
}

function update_setting($key, $value) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->bind_param("sss", $key, $value, $value);
    return $stmt->execute();
}

// --- Funkcje dla zadań ---
function get_tasks() {
    global $conn;
    $result = $conn->query("SELECT * FROM tasks ORDER BY date ASC");
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }
    return $tasks;
}

function add_task($name, $date, $owner = null, $is_payment_task = false, $vendor_id = null) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO tasks (name, date, owner, is_payment_task, vendor_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssis", $name, $date, $owner, $is_payment_task, $vendor_id);
    return $stmt->execute();
}

function update_task_completion($task_id, $completed) {
    global $conn;
    $completion_date = $completed ? date('Y-m-d') : null;
    $stmt = $conn->prepare("UPDATE tasks SET completed = ?, completion_date = ? WHERE id = ?");
    $stmt->bind_param("isi", $completed, $completion_date, $task_id);
    return $stmt->execute();
}

function delete_task($task_id) {
    global $conn;
    // Sprawdź, czy to zadanie płatności (aby uniemożliwić ręczne usunięcie z zadań)
    $stmt_check = $conn->prepare("SELECT is_payment_task FROM tasks WHERE id = ?");
    $stmt_check->bind_param("i", $task_id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    if ($row = $result_check->fetch_assoc() && $row['is_payment_task']) {
        return false; // Nie usuwaj zadania płatności ręcznie
    }

    $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->bind_param("i", $task_id);
    return $stmt->execute();
}

// --- Funkcje dla gości ---
function get_guests() {
    global $conn;
    $result = $conn->query("SELECT * FROM guests");
    $guests = [];
    while ($guest_row = $result->fetch_assoc()) {
        $guest_id = $guest_row['id'];
        $children_result = $conn->query("SELECT * FROM children WHERE guest_group_id = $guest_id");
        $guest_row['children'] = [];
        while ($child_row = $children_result->fetch_assoc()) {
            $guest_row['children'][] = $child_row;
        }
        $guests[] = $guest_row;
    }
    return $guests;
}

function add_guest($guest1_name, $guest2_name, $children_data) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO guests (guest1_name, guest2_name) VALUES (?, ?)");
    $stmt->bind_param("ss", $guest1_name, $guest2_name);
    if ($stmt->execute()) {
        $guest_id = $conn->insert_id;
        foreach ($children_data as $child) {
            $child_name = $child['name'];
            $child_age = $child['age'];
            $stmt_child = $conn->prepare("INSERT INTO children (guest_group_id, child_name, age) VALUES (?, ?, ?)");
            $stmt_child->bind_param("isi", $guest_id, $child_name, $child_age);
            $stmt_child->execute();
        }
        return true;
    }
    return false;
}

function update_guest_status($guest_id, $key, $value) {
    global $conn;
    $stmt = $conn->prepare("UPDATE guests SET $key = ? WHERE id = ?");
    if ($key === 'confirmed' || $key === 'accommodation') {
        $type = ($key === 'confirmed') ? 'i' : 'i'; // true/false dla confirmed, int dla accommodation
        $stmt->bind_param($type . 'i', $value, $guest_id);
    } else {
        return false; // Nieprawidłowy klucz
    }
    return $stmt->execute();
}

function edit_guest($guest_id, $guest1_name, $guest2_name, $children_data) {
    global $conn;
    $conn->begin_transaction();
    try {
        // Aktualizuj głównych gości
        $stmt_guest = $conn->prepare("UPDATE guests SET guest1_name = ?, guest2_name = ? WHERE id = ?");
        $stmt_guest->bind_param("ssi", $guest1_name, $guest2_name, $guest_id);
        $stmt_guest->execute();

        // Usuń istniejące dzieci
        $stmt_delete_children = $conn->prepare("DELETE FROM children WHERE guest_group_id = ?");
        $stmt_delete_children->bind_param("i", $guest_id);
        $stmt_delete_children->execute();

        // Dodaj nowe dzieci
        foreach ($children_data as $child) {
            $child_name = $child['name'];
            $child_age = $child['age'];
            $stmt_child = $conn->prepare("INSERT INTO children (guest_group_id, child_name, age) VALUES (?, ?, ?)");
            $stmt_child->bind_param("isi", $guest_id, $child_name, $child_age);
            $stmt_child->execute();
        }
        $conn->commit();
        return true;
    } catch (mysqli_sql_exception $exception) {
        $conn->rollback();
        return false;
    }
}


function delete_guest($guest_id) {
    global $conn;
    // Klauzula ON DELETE CASCADE w bazie danych zajmie się dziećmi
    $stmt = $conn->prepare("DELETE FROM guests WHERE id = ?");
    $stmt->bind_param("i", $guest_id);
    return $stmt->execute();
}


// --- Funkcje dla dostawców/kosztów (szkielet) ---
function get_vendors() {
    global $conn;
    $result = $conn->query("SELECT * FROM vendors");
    $vendors = [];
    while ($row = $result->fetch_assoc()) {
        $vendors[] = $row;
    }
    return $vendors;
}

function add_vendor($name, $cost, $deposit, $paid_full, $payment_date) {
    global $conn;
    $stmt = $conn->prepare("INSERT INTO vendors (name, cost, deposit, paid_full, payment_date) VALUES (?, ?, ?, ?, ?)");
    // Upewnij się, że pusta data jest zapisywana jako NULL, a nie pusty string
    $payment_date_or_null = !empty($payment_date) ? $payment_date : null;
    $stmt->bind_param("sddis", $name, $cost, $deposit, $paid_full, $payment_date_or_null);
    if ($stmt->execute()) {
        return $conn->insert_id; // ZWRÓĆ ID NOWEGO WPISU
    }
    return false; // Zwróć false w przypadku błędu
}

function update_vendor($id, $name, $cost, $deposit, $paid_full, $payment_date) {
    global $conn;
    $stmt = $conn->prepare("UPDATE vendors SET name = ?, cost = ?, deposit = ?, paid_full = ?, payment_date = ? WHERE id = ?");
    $stmt->bind_param("sddisi", $name, $cost, $deposit, $paid_full, $payment_date, $id);
    return $stmt->execute();
}

function delete_vendor($id) {
    global $conn;
    // Usuń powiązane zadanie płatności
    $stmt_task = $conn->prepare("DELETE FROM tasks WHERE vendor_id = ? AND is_payment_task = TRUE");
    $stmt_task->bind_param("i", $id);
    $stmt_task->execute();

    $stmt_vendor = $conn->prepare("DELETE FROM vendors WHERE id = ?");
    $stmt_vendor->bind_param("i", $id);
    return $stmt_vendor->execute();
}

// --- Funkcje dla stołów i miejsc (szkielet) ---
function get_tables() {
    global $conn;
    $result = $conn->query("SELECT * FROM tables");
    $tables = [];
    while ($table_row = $result->fetch_assoc()) {
        $table_id = $table_row['id'];
        $seats_result = $conn->query("SELECT * FROM table_seats WHERE table_id = $table_id ORDER BY seat_index ASC");
        $table_row['seats'] = [];
        while ($seat_row = $seats_result->fetch_assoc()) {
            $table_row['seats'][] = $seat_row;
        }
        $tables[] = $table_row;
    }
    return $tables;
}

function add_table($name, $capacity, $shape) {
    global $conn;
    $conn->begin_transaction();
    try {
        $stmt_table = $conn->prepare("INSERT INTO tables (name, capacity, shape) VALUES (?, ?, ?)");
        $stmt_table->bind_param("sis", $name, $capacity, $shape);
        $stmt_table->execute();
        $table_id = $conn->insert_id;

        for ($i = 0; $i < $capacity; $i++) {
            $stmt_seat = $conn->prepare("INSERT INTO table_seats (table_id, seat_index) VALUES (?, ?)");
            $stmt_seat->bind_param("ii", $table_id, $i);
            $stmt_seat->execute();
        }
        $conn->commit();
        return true;
    } catch (mysqli_sql_exception $exception) {
        $conn->rollback();
        return false;
    }
}

function delete_table($table_id) {
    global $conn;
    // ON DELETE CASCADE w bazie danych zajmie się miejscami
    $stmt = $conn->prepare("DELETE FROM tables WHERE id = ?");
    $stmt->bind_param("i", $table_id);
    return $stmt->execute();
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

function get_seat_assignment($seat_id) {
    global $conn;
    $stmt = $conn->prepare("SELECT person_type, person_id FROM table_seats WHERE id = ?");
    $stmt->bind_param("i", $seat_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        return ['person_type' => $row['person_type'], 'person_id' => $row['person_id']];
    }
    return null;
}

// Funkcja do pobierania nazwy osoby na podstawie person_type i person_id
function get_person_name($person_type, $person_id) {
    global $conn;
    if ($person_type === 'guest1' || $person_type === 'guest2') {
        $stmt = $conn->prepare("SELECT guest1_name, guest2_name FROM guests WHERE id = ?");
        $stmt->bind_param("i", $person_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            return ($person_type === 'guest1') ? $row['guest1_name'] : $row['guest2_name'];
        }
    } elseif ($person_type === 'child') {
        $stmt = $conn->prepare("SELECT child_name FROM children WHERE id = ?");
        $stmt->bind_param("i", $person_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            return $row['child_name'];
        }
    }
    return "Nieznany Gość";
}
?>