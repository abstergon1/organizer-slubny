<?php
// index.php (KONTROLER)

// Pliki pomocnicze
require_once 'auth.php';
require_once 'functions.php';

// Wstępna walidacja dostępu
if (!$is_admin && !$organizer_id) {
    die("Nie masz jeszcze dostępu do żadnego organizera. Skontaktuj się z administratorem, aby Cię zaprosił.");
}

// Pobieranie ustawień dla widoku
$settings = $organizer_id ? get_settings($organizer_id) : [];

// --- LOGIKA OBSŁUGI ŻĄDAŃ POST (AJAX) ---

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $action = $_POST['action'] ?? '';
    $response = ['success' => false, 'message' => 'Nieznana akcja lub brak uprawnień.'];

    // LOGIKA ZARZĄDZANIA UŻYTKOWNIKAMI (ADMIN/OWNER)
    if ($action === 'add_or_invite_user') {
        if (!$is_admin && $permission_level !== 'owner') {
            echo json_encode($response);
            exit;
        }
        try {
            $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
            $password = $_POST['password'] ?? '';
            $perm_level = in_array($_POST['permission_level'], ['editor', 'viewer', 'owner']) ? $_POST['permission_level'] : 'viewer';

            if (!$email) throw new Exception("Podaj prawidłowy adres e-mail.");

            $conn->begin_transaction();
            
            $stmt_check = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $stmt_check->bind_param("s", $email);
            $stmt_check->execute();
            $user = $stmt_check->get_result()->fetch_assoc();
            $user_id_to_invite = null;

            if ($user) {
                $user_id_to_invite = $user['id'];
            } else {
                if (!$is_admin) throw new Exception("Tylko administrator może tworzyć nowe konta w systemie. Ten użytkownik nie istnieje.");
                if (empty($password) || strlen($password) < 6) throw new Exception("Nowy użytkownik musi mieć hasło o długości co najmniej 6 znaków.");
                
                $password_hash = password_hash($password, PASSWORD_DEFAULT);
                $stmt_insert = $conn->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
                $stmt_insert->bind_param("ss", $email, $password_hash);
                $stmt_insert->execute();
                $user_id_to_invite = $conn->insert_id;
            }

            if ($user_id_to_invite == $_SESSION['user_id']) throw new Exception("Nie możesz zaprosić samego siebie.");

            $stmt_add = $conn->prepare("INSERT INTO organizer_users (organizer_id, user_id, permission_level) VALUES (?, ?, ?)");
            $stmt_add->bind_param("iis", $organizer_id, $user_id_to_invite, $perm_level);
            $stmt_add->execute();

            $conn->commit();
            $response = ['success' => true, 'message' => 'Użytkownik został pomyślnie dodany do organizera.'];
        } catch (Exception $e) {
            $conn->rollback();
            if ($conn->errno == 1062) { $response = ['success' => false, 'message' => 'Ten użytkownik już ma dostęp do tego organizera.'];
            } else { $response = ['success' => false, 'message' => $e->getMessage()]; }
        }
        echo json_encode($response);
        exit;
    }

    if ($action === 'update_user_permission' || $action === 'remove_user_access') {
        if ($permission_level !== 'owner') { echo json_encode($response); exit; }
        try {
            switch ($action) {
                case 'update_user_permission':
                    $user_id_to_update = (int)($_POST['user_id'] ?? 0);
                    $new_perm_level = in_array($_POST['permission_level'], ['editor', 'viewer']) ? $_POST['permission_level'] : 'viewer';
                    $stmt = $conn->prepare("UPDATE organizer_users SET permission_level = ? WHERE user_id = ? AND organizer_id = ? AND permission_level != 'owner'");
                    $stmt->bind_param("sii", $new_perm_level, $user_id_to_update, $organizer_id);
                    $stmt->execute();
                    $response = ['success' => true];
                    break;
                case 'remove_user_access':
                    $user_id_to_remove = (int)($_POST['user_id'] ?? 0);
                    $stmt = $conn->prepare("DELETE FROM organizer_users WHERE user_id = ? AND organizer_id = ? AND permission_level != 'owner'");
                    $stmt->bind_param("ii", $user_id_to_remove, $organizer_id);
                    $stmt->execute();
                    if ($stmt->affected_rows > 0) { $response = ['success' => true];
                    } else { throw new Exception("Nie można usunąć właściciela lub użytkownik nie istnieje."); }
                    break;
            }
        } catch (Exception $e) { $response = ['success' => false, 'message' => $e->getMessage()]; }
        echo json_encode($response);
        exit;
    }
    
    // LOGIKA OBSŁUGI DANYCH (EDITOR/OWNER)
    if (can_edit($permission_level)) {
        try {
            switch ($action) {
                case 'save_wedding_date': 
                    update_setting($organizer_id, 'wedding_date', $_POST['wedding_date'] ?? ''); 
                    update_setting($organizer_id, 'price_adult', $_POST['price_adult'] ?? '0'); 
                    update_setting($organizer_id, 'price_child_older', $_POST['price_child_older'] ?? '0'); 
                    update_setting($organizer_id, 'price_child_younger', $_POST['price_child_younger'] ?? '0'); 
                    update_setting($organizer_id, 'price_accommodation', $_POST['price_accommodation'] ?? '0'); 
                    update_setting($organizer_id, 'age_older_min', $_POST['age_older_min'] ?? '4'); 
                    update_setting($organizer_id, 'age_older_max', $_POST['age_older_max'] ?? '10'); 
                    update_setting($organizer_id, 'age_adult_min', $_POST['age_adult_min'] ?? '11'); 
                    
                    $response = ['success' => true, 'message' => 'Ustawienia zapisane.']; 
                    break;
					
                case 'save_rsvp_date':
                    update_setting($organizer_id, 'rsvp_deadline_date', $_POST['rsvp_deadline_date'] ?? '');
                    $response = ['success' => true, 'message' => 'Termin RSVP zapisany.']; 
                    break;
                case 'add_task': if (!empty($_POST['taskName']) && !empty($_POST['taskDate'])) { add_task($organizer_id, $_POST['taskName'], $_POST['taskDate'], $_POST['taskOwner']); $response = ['success' => true]; } else { $response['message'] = 'Nazwa i data zadania są wymagane.'; } break;
                case 'toggle_task_completion': update_task_completion($organizer_id, (int)$_POST['task_id'], isset($_POST['completed']) && $_POST['completed'] === 'true' ? 1 : 0); $response = ['success' => true]; break;
                case 'delete_task': delete_task($organizer_id, (int)$_POST['task_id']); $response = ['success' => true]; break;
                case 'add_guest': $children_data = []; if (isset($_POST['addChildName'])) { for ($i = 0; $i < count($_POST['addChildName']); $i++) { if (!empty($_POST['addChildName'][$i])) { $children_data[] = ['name' => $_POST['addChildName'][$i], 'age' => (int)($_POST['addChildAge'][$i] ?? 0)]; } } } add_guest($organizer_id, $_POST['guest1Name'], $_POST['guest2Name'], $children_data); $response = ['success' => true]; break;
                case 'edit_guest': $children_data = []; if (isset($_POST['editChildName'])) { for ($i = 0; $i < count($_POST['editChildName']); $i++) { if (!empty($_POST['editChildName'][$i])) { $children_data[] = ['name' => $_POST['editChildName'][$i], 'age' => (int)($_POST['editChildAge'][$i] ?? 0)]; } } } edit_guest($organizer_id, (int)$_POST['editGuestId'], $_POST['editGuest1Name'], $_POST['editGuest2Name'], $children_data); $response = ['success' => true]; break;
                 case 'update_guest_status': 
                    // Stare klucze: 'confirmed', 'accommodation'
                    // rsvp_status jest teraz obsługiwany przez nową akcję lub poniższą
                    $guest_id = (int)$_POST['guest_id'];
                    $key = $_POST['key'];
                    $value = $_POST['value'];
                    
                    if ($key === 'accommodation') {
                        update_guest_status($organizer_id, $guest_id, 'accommodation', (int)$value);
                    } elseif ($key === 'rsvp_status') {
                        // ... (bez zmian)
                        if (!update_guest_rsvp_status($organizer_id, $guest_id, $value)) {
                             throw new Exception("Nieprawidłowy status RSVP.");
                        }
                    } elseif ($key === 'after_party') { 
                        // ... (bez zmian)
                        $value_int = (int)$value;
                        if (!update_guest_after_party($organizer_id, $guest_id, $value_int)) {
                             throw new Exception("Nie udało się zaktualizować liczby osób na poprawinach.");
                        }
                    } elseif ($key === 'confirmed_adults') { // NOWA LOGIKA
                        $value_int = (int)$value;
                        if (!update_confirmed_adults($organizer_id, $guest_id, $value_int)) {
                            throw new Exception("Nie udało się zaktualizować liczby dorosłych.");
                        }
                    } elseif ($key === 'confirmed_children') { // NOWA LOGIKA
                         $value_int = (int)$value;
                         if (!update_confirmed_children($organizer_id, $guest_id, $value_int)) {
                            throw new Exception("Nie udało się zaktualizować liczby dzieci.");
                         }
                    } else {
                        // W oryginalnym kodzie była jeszcze 'confirmed', której już nie używamy
                        update_guest_status($organizer_id, $guest_id, $key, $value); 
                    }
                    
                    $response = ['success' => true]; 
                    break;
                case 'delete_guest': delete_guest($organizer_id, (int)$_POST['guest_id']); $response = ['success' => true]; break;
                
                // NOWA AKCJA: Generowanie Tokena
                case 'generate_token':
                    $guest_id = (int)$_POST['guest_id'];
                    $token = generate_rsvp_token($guest_id);
                    if ($token) {
                        $response = ['success' => true, 'token' => $token, 'message' => 'Token pomyślnie wygenerowany.'];
                    } else {
                        throw new Exception("Błąd generowania tokenu (możliwe, że już istnieje).");
                    }
                    break;
					
				case 'add_vendor_category':
                    $category_name = trim($_POST['categoryName'] ?? '');
                    if (empty($category_name)) throw new Exception("Nazwa kategorii jest wymagana.");
                    if (!add_vendor_category($organizer_id, $category_name)) {
                        throw new Exception("Błąd dodawania kategorii (możliwe, że już istnieje).");
                    }
                    $response = ['success' => true, 'message' => 'Kategoria dodana.'];
                    break;
                case 'delete_vendor_category':
                    $category_id = (int)($_POST['category_id'] ?? 0);
                    if (!delete_vendor_category($organizer_id, $category_id)) {
                         throw new Exception("Błąd usuwania kategorii.");
                    }
                    $response = ['success' => true, 'message' => 'Kategoria usunięta, powiązani dostawcy zaktualizowani.'];
                    break;
			
                // MODYFIKACJA: add_vendor - usunięto deposit, paid_full
                case 'add_vendor': 
                    $payment_date = $_POST['vendorPaymentDate'] ?? null;
                    $category_id = (int)($_POST['vendorCategory'] ?? 0); // NOWY PARAMETR
                    // Zmodyfikuj funckcję add_vendor w functions.php, aby przyjmowała $category_id
                    $new_vendor_id = add_vendor($organizer_id, $_POST['vendorName'], (float)$_POST['vendorCost'], $payment_date, $category_id); 
                    // ... (reszta logiki)
                    $response = ['success' => true]; 
                    break;
                    
                // MODYFIKACJA: edit_vendor (DODAJEMY category_id)
                case 'edit_vendor': 
                    $vendor_id = (int)$_POST['editVendorId']; 
                    $vendor_name = $_POST['editVendorName']; 
                    $payment_date = !empty($_POST['editVendorPaymentDate']) ? $_POST['editVendorPaymentDate'] : null; 
                    $category_id = (int)($_POST['editVendorCategory'] ?? 0);

                    if (update_vendor($organizer_id, $vendor_id, $vendor_name, (float)$_POST['editVendorCost'], $payment_date, $category_id)) { 
                        $task_stmt = $conn->prepare("SELECT id FROM tasks WHERE vendor_id = ? AND organizer_id = ? AND is_payment_task = 1"); 
                        $task_stmt->bind_param("ii", $vendor_id, $organizer_id); 
                        $task_stmt->execute(); 
                        $existing_task = $task_stmt->get_result()->fetch_assoc(); 
                        if ($payment_date && $existing_task) { 
                            $update_task_stmt = $conn->prepare("UPDATE tasks SET date = ?, name = ? WHERE id = ?"); 
                            $update_task_stmt->bind_param("ssi", $payment_date, "Zapłać dla: " . $vendor_name, $existing_task['id']); 
                            $update_task_stmt->execute(); 
                        } elseif ($payment_date && !$existing_task) { 
                            add_task($organizer_id, "Zapłać dla: " . $vendor_name, $payment_date, 'Para Młoda', true, $vendor_id); 
                        } elseif (!$payment_date && $existing_task) { 
                            delete_task($organizer_id, $existing_task['id']); 
                        } 
                        $response = ['success' => true]; 
                    } 
                    break;
                    
                case 'delete_vendor': delete_vendor($organizer_id, (int)$_POST['vendor_id']); $response = ['success' => true]; break;
				 case 'save_guest_info':
                    $info_keys = [
                        'church_map_embed', 'venue_map_embed', 
                        'wedding_schedule', 'wedding_menu', 'key_info',
                        'contact_bride_phone', 'contact_groom_phone',
                        'photos_info', 
                        'rodo_info'    
                    ];
                    
                    foreach ($info_keys as $key) {
                        // Używamy pustego ciągu, jeśli pole nie jest ustawione (ale lepiej użyć trim)
                        $value = trim($_POST[$key] ?? '');
                        update_setting($organizer_id, $key, $value);
                    }
                    $response = ['success' => true, 'message' => 'Informacje dla Gości zapisane.'];
                    break;
                                    
                case 'add_vendor_payment':
                    $vendor_id = (int)$_POST['vendorId'];
                    $amount = (float)$_POST['paymentAmount'];
                    $date = $_POST['paymentDate'];
                    $description = trim($_POST['paymentDescription'] ?? '');
                    
                    if (!$vendor_id || !$amount || !$date) throw new Exception("Wszystkie pola płatności są wymagane.");
                    
                    if (add_vendor_payment($vendor_id, $amount, $date, $description)) {
                        $vendor_name = get_vendor_name_by_id($vendor_id);
                        $task_name = "Zarejestrowano wpłatę: " . $vendor_name . " (" . number_format($amount, 2) . " PLN)"; // NOWY: Wymuszenie formatu 
                                                
                        if (add_task($organizer_id, $task_name, $date, 'Rejestr', 0, $vendor_id)) {
                             update_task_completion($organizer_id, $conn->insert_id, 1);
                        }
                     
                        $response = ['success' => true, 'message' => 'Płatność zarejestrowana i dodano zadanie do Kalendarza.'];
                    } else {
                        throw new Exception("Błąd podczas rejestracji płatności.");
                    }
                    break;
                    
                case 'add_table': add_table($organizer_id, $_POST['tableName'], (int)$_POST['tableCapacity'], $_POST['tableShape']); $response = ['success' => true]; break;
                case 'delete_table': delete_table($organizer_id, (int)$_POST['table_id']); $response = ['success' => true]; break;
				case 'delete_vendor_payment':
                    $payment_id = (int)($_POST['payment_id'] ?? 0);
                    if (!delete_vendor_payment($payment_id, $organizer_id)) { 
                         throw new Exception("Błąd usuwania płatności i powiązanego zadania.");
                    }
                    $response = ['success' => true, 'message' => 'Płatność i zadanie usunięte.'];
                    break;
                
                // NOWA AKCJA: Wyczyść usadzenie stołu
                case 'clear_table_seating':
                    $table_id = (int)($_POST['table_id'] ?? 0);
                    if (!$table_id) throw new Exception("Nieprawidłowy identyfikator stołu.");
                    
                    $stmt = $conn->prepare("UPDATE table_seats ts JOIN tables t ON ts.table_id = t.id SET ts.person_type = NULL, ts.person_id = NULL WHERE t.id = ? AND t.organizer_id = ?");
                    $stmt->bind_param("ii", $table_id, $organizer_id);
                    $stmt->execute();
                    $response = ['success' => true, 'message' => 'Usadzenie stołu zostało pomyślnie wyczyszczone.'];
                    break;
                    
                case 'assign_person': case 'unassign_person': 
                case 'assign_person': case 'unassign_person': $conn->begin_transaction(); if ($action === 'assign_person') { $target_seat_id = (int)($_POST['seat_id'] ?? 0); $dragged_person_str = $_POST['dragged_person_id'] ?? ''; $source_seat_id = (int)($_POST['old_seat_id'] ?? 0); $parts = explode('-', $dragged_person_str); if (count($parts) !== 3) throw new Exception("Nieprawidłowy identyfikator osoby."); $person_type = $parts[1]; $person_id = (int)$parts[2]; $final_type = ($person_type === 'guest1' || $person_type === 'guest2') ? $person_type : 'child'; $final_id = $person_id; $person_on_target_seat = get_seat_assignment($organizer_id, $target_seat_id); if ($source_seat_id) unassign_person_from_seat($source_seat_id); assign_person_to_seat($target_seat_id, $final_type, $final_id); if ($person_on_target_seat && $person_on_target_seat['person_id']) { if ($source_seat_id) assign_person_to_seat($source_seat_id, $person_on_target_seat['person_type'], $person_on_target_seat['person_id']); } } else { unassign_person_from_seat((int)($_POST['seat_id'] ?? 0)); } $conn->commit(); $response = ['success' => true]; break;
            }
        } catch (Exception $e) {
            if ($conn->in_transaction) $conn->rollback();
            $response = ['success' => false, 'message' => $e->getMessage()];
        }
    }
    
    echo json_encode($response);
    exit;
}

// --- ŁADOWANIE WIDOKU ---
require 'views/dashboard.php';