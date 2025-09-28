<?php
// index.php (wersja AJAX)
require_once 'functions.php';

// --- WCZYTAJ USTAWIENIA PRZED RENDEROWANIEM STRONY ---
$settings_from_db = $conn->query("SELECT setting_key, setting_value FROM settings");
$settings = [];
if ($settings_from_db) {
    while ($row = $settings_from_db->fetch_assoc()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
}

$price_items_from_db = get_price_items();

// --- Obsługa żądań POST (teraz wszystkie zwracają JSON) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $action = $_POST['action'] ?? '';
    $response = ['success' => false, 'message' => 'Nieznana akcja.'];

    try {
        switch ($action) {
            case 'save_wedding_date':
                update_setting('wedding_date', $_POST['wedding_date'] ?? '');
                update_setting('price_adult', $_POST['price_adult'] ?? '0');
                update_setting('price_child_older', $_POST['price_child_older'] ?? '0');
                update_setting('price_child_younger', $_POST['price_child_younger'] ?? '0');
                update_setting('price_accommodation', $_POST['price_accommodation'] ?? '0');
                $response = ['success' => true, 'message' => 'Ustawienia zapisane.'];
                break;
            case 'add_task':
                if (!empty($_POST['taskName']) && !empty($_POST['taskDate'])) {
                    add_task($_POST['taskName'], $_POST['taskDate'], $_POST['taskOwner']);
                    $response = ['success' => true, 'message' => 'Zadanie dodane.'];
                } else {
                    $response['message'] = 'Nazwa i data zadania są wymagane.';
                }
                break;
            case 'toggle_task_completion':
                $completed = isset($_POST['completed']) && $_POST['completed'] === 'true' ? 1 : 0;
                update_task_completion((int)$_POST['task_id'], $completed);
                $response = ['success' => true, 'message' => 'Status zadania zaktualizowany.'];
                break;
            case 'delete_task':
                delete_task((int)$_POST['task_id']);
                $response = ['success' => true, 'message' => 'Zadanie usunięte.'];
                break;
            case 'add_guest':
                $children_data = [];
                if (isset($_POST['addChildName'])) {
                    for ($i = 0; $i < count($_POST['addChildName']); $i++) {
                        if (!empty($_POST['addChildName'][$i])) {
                            $children_data[] = ['name' => $_POST['addChildName'][$i], 'age' => (int)($_POST['addChildAge'][$i] ?? 0)];
                        }
                    }
                }
                add_guest($_POST['guest1Name'], $_POST['guest2Name'], $children_data);
                $response = ['success' => true, 'message' => 'Goście dodani.'];
                break;
            case 'edit_guest':
                $children_data = [];
                if (isset($_POST['editChildName'])) {
                    for ($i = 0; $i < count($_POST['editChildName']); $i++) {
                        if (!empty($_POST['editChildName'][$i])) {
                            $children_data[] = ['name' => $_POST['editChildName'][$i], 'age' => (int)($_POST['editChildAge'][$i] ?? 0)];
                        }
                    }
                }
                edit_guest((int)$_POST['editGuestId'], $_POST['editGuest1Name'], $_POST['editGuest2Name'], $children_data);
                $response = ['success' => true, 'message' => 'Dane gości zaktualizowane.'];
                break;
            case 'update_guest_status':
                 $key = $_POST['key'];
                 $value = ($key === 'confirmed') ? (($_POST['value'] === 'true') ? 1 : 0) : (int)$_POST['value'];
                 update_guest_status((int)$_POST['guest_id'], $key, $value);
                 $response = ['success' => true, 'message' => 'Status gościa zaktualizowany.'];
                 break;
            case 'delete_guest':
                delete_guest((int)$_POST['guest_id']);
                $response = ['success' => true, 'message' => 'Grupa gości usunięta.'];
                break;
            case 'add_vendor':
                $paid_full = isset($_POST['vendorPaidFull']) ? 1 : 0;
                $payment_date = $_POST['vendorPaymentDate'] ?? null;
                $vendor_name = $_POST['vendorName'];

                // Funkcja add_vendor zwraca teraz ID nowego dostawcy lub false
                $new_vendor_id = add_vendor($vendor_name, (float)$_POST['vendorCost'], (float)$_POST['vendorDeposit'], $paid_full, $payment_date);

                if ($new_vendor_id) {
                    // Jeśli podano datę płatności, utwórz powiązane zadanie
                    if (!empty($payment_date)) {
                        add_task(
                            "Zapłać dla: " . $vendor_name,
                            $payment_date,
                            'Para Młoda',  // Domyślny właściciel zadania
                            true,          // Oznacz jako zadanie płatności
                            $new_vendor_id // Powiąż z ID dostawcy
                        );
                    }
                    $response = ['success' => true, 'message' => 'Koszt dodany.'];
                } else {
                    $response = ['success' => false, 'message' => 'Nie udało się dodać kosztu.'];
                }
                break;
            case 'add_price_item':
                add_price_item(
                    $_POST['priceItemName'] ?? '',
                    $_POST['priceItemAmount'] ?? '0',
                    $_POST['priceItemScope'] ?? 'all'
                );
                $response = ['success' => true, 'message' => 'Pozycja cenowa dodana.'];
                break;
            case 'update_price_item':
                update_price_item(
                    (int)($_POST['priceItemId'] ?? 0),
                    $_POST['priceItemName'] ?? '',
                    $_POST['priceItemAmount'] ?? '0',
                    $_POST['priceItemScope'] ?? 'all'
                );
                $response = ['success' => true, 'message' => 'Pozycja cenowa zaktualizowana.'];
                break;
            case 'delete_price_item':
                delete_price_item((int)($_POST['priceItemId'] ?? 0));
                $response = ['success' => true, 'message' => 'Pozycja cenowa usunięta.'];
                break;

            case 'edit_vendor':
                $vendor_id = (int)$_POST['editVendorId'];
                $paid_full = isset($_POST['editVendorPaidFull']) ? 1 : 0;
                $payment_date = !empty($_POST['editVendorPaymentDate']) ? $_POST['editVendorPaymentDate'] : null;
                $vendor_name = $_POST['editVendorName'];

                if (update_vendor($vendor_id, $vendor_name, (float)$_POST['editVendorCost'], (float)$_POST['editVendorDeposit'], $paid_full, $payment_date)) {
                    // Znajdź istniejące zadanie płatności dla tego dostawcy
                    $existing_task_stmt = $conn->prepare("SELECT id FROM tasks WHERE vendor_id = ? AND is_payment_task = 1");
                    $existing_task_stmt->bind_param("i", $vendor_id);
                    $existing_task_stmt->execute();
                    $existing_task_result = $existing_task_stmt->get_result();
                    $existing_task = $existing_task_result->fetch_assoc();

                    if ($payment_date && $existing_task) {
                        // SCENARIUSZ 1: Data istnieje i zadanie istnieje -> Zaktualizuj zadanie
                        $update_task_stmt = $conn->prepare("UPDATE tasks SET date = ?, name = ? WHERE id = ?");
                        $new_name = "Zapłać dla: " . $vendor_name;
                        $update_task_stmt->bind_param("ssi", $payment_date, $new_name, $existing_task['id']);
                        $update_task_stmt->execute();
                    } elseif ($payment_date && !$existing_task) {
                        // SCENARIUSZ 2: Data istnieje, ale zadania nie ma -> Utwórz nowe zadanie
                        add_task("Zapłać dla: " . $vendor_name, $payment_date, 'Para Młoda', true, $vendor_id);
                    } elseif (!$payment_date && $existing_task) {
                        // SCENARIUSZ 3: Daty nie ma, ale zadanie istnieje -> Usuń zadanie
                        delete_task($existing_task['id']);
                    }
                    
                    $response = ['success' => true, 'message' => 'Koszt zaktualizowany.'];
                } else {
                    $response = ['success' => false, 'message' => 'Błąd podczas aktualizacji kosztu.'];
                }
                break;
            case 'delete_vendor':
                delete_vendor((int)$_POST['vendor_id']);
                $response = ['success' => true, 'message' => 'Koszt usunięty.'];
                break;
            case 'add_table':
                add_table($_POST['tableName'], (int)$_POST['tableCapacity'], $_POST['tableShape']);
                $response = ['success' => true, 'message' => 'Stół dodany.'];
                break;
            case 'delete_table':
                delete_table((int)$_POST['table_id']);
                $response = ['success' => true, 'message' => 'Stół usunięty.'];
                break;
            case 'assign_person':
            case 'unassign_person':
                $conn->begin_transaction();
                if ($action === 'assign_person') {
                    $target_seat_id = (int)($_POST['seat_id'] ?? 0);
                    $dragged_person_str = $_POST['dragged_person_id'] ?? '';
                    $source_seat_id = (int)($_POST['old_seat_id'] ?? 0);
                    $parts = explode('-', $dragged_person_str);
                    if (count($parts) !== 3) throw new Exception("Nieprawidłowy identyfikator osoby.");
                    $person_type = $parts[1]; $person_id = (int)$parts[2];
                    $final_type = ($person_type === 'guest1' || $person_type === 'guest2') ? $person_type : 'child';
                    $final_id = $person_id;
                    $person_on_target_seat = get_seat_assignment($target_seat_id);
                    if ($source_seat_id) unassign_person_from_seat($source_seat_id);
                    assign_person_to_seat($target_seat_id, $final_type, $final_id);
                    if ($person_on_target_seat && $person_on_target_seat['person_id']) {
                        if ($source_seat_id) assign_person_to_seat($source_seat_id, $person_on_target_seat['person_type'], $person_on_target_seat['person_id']);
                    }
                } else {
                    unassign_person_from_seat((int)($_POST['seat_id'] ?? 0));
                }
                $conn->commit();
                $response = ['success' => true];
                break;
        }
    } catch (Exception $e) {
        if ($conn->in_transaction) $conn->rollback();
        $response = ['success' => false, 'message' => $e->getMessage()];
    }
    
    echo json_encode($response);
    exit; // Zakończ skrypt po obsłudze POST
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organizer Ślubny PRO+</title>
    <link rel="stylesheet" href="css/style.css">
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
</head>
<body>
    <!-- MODAL DO EDYCJI GOŚCI -->
    <div id="edit-guest-modal" class="modal-overlay">
        <div class="modal-content">
            <!-- Dodajemy klasę .ajax-form -->
            <form class="ajax-form">
                <h2>Edytuj Dane Gości</h2>
                <input type="hidden" name="action" value="edit_guest">
                <input type="hidden" id="editGuestId" name="editGuestId">
                <label>Gość 1 (mężczyzna)</label><input type="text" id="editGuest1Name" name="editGuest1Name" placeholder="Imię i nazwisko">
                <label>Gość 2 (kobieta)</label><input type="text" id="editGuest2Name" name="editGuest2Name" placeholder="Imię i nazwisko">
                <label>Dzieci:</label><div id="edit-children-inputs"></div>
                <button type="button" onclick="addChildInput('edit')">+ Dodaj dziecko</button>
                <div class="modal-actions">
                    <button type="submit">Zapisz Zmiany</button>
                    <button type="button" class="secondary" onclick="closeModal('edit-guest-modal')">Anuluj</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL DO EDYCJI KOSZTÓW -->
    <div id="edit-vendor-modal" class="modal-overlay">
        <div class="modal-content">
            <!-- Dodajemy klasę .ajax-form -->
            <form class="ajax-form">
                <h2>Edytuj Koszt Usługodawcy</h2>
                <input type="hidden" name="action" value="edit_vendor">
                <input type="hidden" id="editVendorId" name="editVendorId">
                <label>Nazwa usługi</label><input type="text" id="editVendorName" name="editVendorName">
                <label>Całkowity koszt</label><input type="number" id="editVendorCost" name="editVendorCost" min="0" step="0.01">
                <label>Zapłacona zaliczka</label><input type="number" id="editVendorDeposit" name="editVendorDeposit" min="0" step="0.01">
                <label>Data płatności</label><input type="date" id="editVendorPaymentDate" name="editVendorPaymentDate">
                <label class="checkbox-label"><input type="checkbox" id="editVendorPaidFull" name="editVendorPaidFull"> Opłacone w całości</label>
                <div class="modal-actions">
                    <button type="submit">Zapisz Zmiany</button>
                    <button type="button" class="secondary" onclick="closeModal('edit-vendor-modal')">Anuluj</button>
                </div>
            </form>
        </div>
    </div>

    <header>
        <h1>Mój Organizer Ślubny</h1>
        <nav id="main-nav">
            <button class="nav-button active" data-page="dashboard">Pulpit</button>
            <button class="nav-button" data-page="tasks">Zadania i Kalendarz</button>
            <button class="nav-button" data-page="guests">Lista Gości</button>
            <button class="nav-button" data-page="budget">Budżet</button>
            <button class="nav-button" data-page="seating">Plan Stołów</button>
            <button class="nav-button" data-page="export">Eksport</button>
        </nav>
    </header>

    <main>
        <!-- Strona 1: Pulpit -->
        <div id="dashboard" class="page active">
            <section class="dashboard-hero">
                <div class="dashboard-content">
                    <h2>Nasza Data Ślubu</h2>
                    <!-- Dodajemy klasę .ajax-form -->
                    <form class="date-setter ajax-form">
                        <input type="hidden" name="action" value="save_wedding_date">
                        <input type="date" id="weddingDate" name="wedding_date" title="Ustaw datę ślubu" value="<?php echo htmlspecialchars($settings['wedding_date'] ?? ''); ?>">
                        <button type="submit">Zapisz Datę</button>
                    </form>
                    <div id="countdown-container">
                        <div id="countdown">Ustaw datę, aby rozpocząć odliczanie.</div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Strona 2: Zadania -->
        <div id="tasks" class="page">
             <section id="tasks-section">
                <h2>Zarządzanie Zadaniami</h2>
                <!-- Dodajemy klasę .ajax-form -->
                <form class="task-input ajax-form">
                    <input type="hidden" name="action" value="add_task">
                    <input type="text" id="taskName" name="taskName" placeholder="Nazwa zadania" required>
                    <input type="date" id="taskDate" name="taskDate" required>
                    <input type="text" id="taskOwner" name="taskOwner" placeholder="Odpowiedzialny">
                    <button type="submit">Dodaj zadanie</button>
                </form>
                <h3>Lista Zadań (chronologicznie)</h3>
                <ul id="taskList"></ul>
                <h3>Widok Kalendarza</h3>
                <div id="calendar-controls">
                    <button type="button" onclick="previousMonth()">‹ Poprzedni</button>
                    <h3 id="calendar-month-year"></h3>
                    <button type="button" onclick="nextMonth()">Następny ›</button>
                </div>
                <div id="calendar-view"></div>
            </section>
        </div>

        <!-- Strona 3: Goście -->
        <div id="guests" class="page">
             <section id="guests-section">
                <h2>Zarządzanie Listą Gości</h2>
                <!-- Dodajemy klasę .ajax-form -->
                <form class="guest-form ajax-form">
                    <input type="hidden" name="action" value="add_guest">
                    <input type="text" id="guest1Name" name="guest1Name" placeholder="Gość 1 (mężczyzna)">
                    <input type="text" id="guest2Name" name="guest2Name" placeholder="Gość 2 (kobieta)">
                    <p>Dodaj dzieci (imię i wiek):</p>
                    <div id="children-inputs">
                        <div>
                            <input type="text" placeholder="Imię dziecka" name="addChildName[]">
                            <input type="number" placeholder="Wiek" min="0" name="addChildAge[]">
                        </div>
                    </div>
                    <button type="button" onclick="addChildInput('add')">+ Dodaj kolejne dziecko</button>
                    <button type="submit">Dodaj Gości / Rodzinę</button>
                </form>
                <div class="guest-filters">
                    <span>Filtruj:</span>
                    <button type="button" class="filter-btn active" onclick="filterGuests('all')">Wszyscy</button>
                    <button type="button" class="filter-btn" onclick="filterGuests('confirmed')">Potwierdzeni</button>
                    <button type="button" class="filter-btn" onclick="filterGuests('unconfirmed')">Niepotwierdzeni</button>
                </div>
                <table id="guestTable">
                    <thead><tr><th>Goście</th><th>Potwierdzona obecność</th><th>Nocleg (ile osób)</th><th>Akcje</th></tr></thead>
                    <tbody></tbody>
                    <tfoot></tfoot>
                </table>
            </section>
        </div>
        
        <!-- Strona 4: Budżet -->
        <div id="budget" class="page">
             <section id="budget-section">
                <h2>Budżet i Koszty</h2>
                <!-- Dodajemy klasę .ajax-form -->
                <form class="ajax-form">
                    <input type="hidden" name="action" value="save_wedding_date">
                    <div class="budget-setup">
                        <h3>Cennik</h3>
                        <div class="price-item">
                            <label for="priceAdult">Cena za osobę dorosłą ("talerzyk"):</label>
                            <input type="number" id="priceAdult" name="price_adult" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_adult'] ?? '0'); ?>" min="0" step="0.01">
                        </div>
                        <div class="price-item">
                            <label for="priceChildOlder">Cena za dziecko 4-12 lat:</label>
                            <input type="number" id="priceChildOlder" name="price_child_older" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_child_older'] ?? '0'); ?>" min="0" step="0.01">
                        </div>
                        <div class="price-item">
                            <label for="priceChildYounger">Cena za dziecko 0-3 lat:</label>
                            <input type="number" id="priceChildYounger" name="price_child_younger" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_child_younger'] ?? '0'); ?>" min="0" step="0.01">
                        </div>
                        <div class="price-item">
                            <label for="priceAccommodation">Koszt noclegu za osobę/noc:</label>
                            <input type="number" id="priceAccommodation" name="price_accommodation" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_accommodation'] ?? '0'); ?>" min="0" step="0.01">
                        </div>
                        <input type="hidden" name="wedding_date" id="hidden_wedding_date" value="<?php echo htmlspecialchars($settings['wedding_date'] ?? ''); ?>">
                        <button type="submit" style="margin-top: 10px;">Zapisz Cennik</button>
                    </div>
                </form>
                
                <div class="vendor-costs">
                    <h3>Koszty Usługodawców</h3>
                    <!-- Dodajemy klasę .ajax-form -->
                    <form class="vendor-form ajax-form">
                        <input type="hidden" name="action" value="add_vendor">
                        <input type="text" id="vendorName" name="vendorName" placeholder="Usługa (np. DJ, Fotograf)" required>
                        <input type="number" id="vendorCost" name="vendorCost" placeholder="Całkowity koszt" min="0" step="0.01" required>
                        <input type="number" id="vendorDeposit" name="vendorDeposit" placeholder="Zapłacona zaliczka" min="0" step="0.01">
                        <input type="date" id="vendorPaymentDate" name="vendorPaymentDate" title="Data płatności">
                        <label class="checkbox-label"><input type="checkbox" id="vendorPaidFull" name="vendorPaidFull"> Opłacone w całości</label>
                        <button type="submit">Dodaj Koszt</button>
                    </form>
                    <ul id="vendorList"></ul>
                </div>
                <div class="additional-price-items">
                    <h3>Dodatkowe pozycje cenowe</h3>
                    <form class="price-item-form ajax-form">
                        <input type="hidden" name="action" value="add_price_item">
                        <input type="text" id="priceItemName" name="priceItemName" placeholder="Nazwa pozycji" required>
                        <input type="number" id="priceItemAmount" name="priceItemAmount" placeholder="Kwota" min="0" step="0.01" required>
                        <select id="priceItemScope" name="priceItemScope">
                            <option value="all">Wszyscy goście</option>
                            <option value="adults">Tylko dorośli</option>
                        </select>
                        <button type="submit">Dodaj pozycję</button>
                    </form>
                    <ul id="priceItemsList">
                        <?php if (!empty($price_items_from_db)): ?>
                            <?php foreach ($price_items_from_db as $price_item): ?>
                                <?php
                                    $item_id = (int)($price_item['id'] ?? 0);
                                    $item_label = $price_item['label'] ?? '';
                                    $item_amount = isset($price_item['amount']) ? (float)$price_item['amount'] : 0.0;
                                    $item_scope = $price_item['scope'] ?? 'all';
                                    $scope_label = $item_scope === 'adults' ? 'tylko dorośli' : 'wszyscy goście';
                                ?>
                                <li class="price-item-row" data-item-id="<?php echo $item_id; ?>">
                                    <div class="price-item-details">
                                        <strong><?php echo htmlspecialchars($item_label, ENT_QUOTES, 'UTF-8'); ?></strong>
                                        <span class="price-item-meta">
                                            <?php echo number_format($item_amount, 2, ',', ' '); ?> PLN · <?php echo htmlspecialchars($scope_label, ENT_QUOTES, 'UTF-8'); ?>
                                        </span>
                                    </div>
                                    <div class="price-item-actions">
                                        <button type="button" onclick="openPriceItemEdit(<?php echo $item_id; ?>)">Edytuj</button>
                                        <button type="button" class="secondary" onclick="confirmRemovePriceItem(<?php echo $item_id; ?>, <?php echo json_encode($item_label, JSON_HEX_APOS | JSON_HEX_QUOT); ?>)">Usuń</button>
                                    </div>
                                </li>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <li class="empty">Brak dodatkowych pozycji.</li>
                        <?php endif; ?>
                    </ul>
                </div>
                <div class="budget-summary">
                    <h3>Podsumowanie Kosztów</h3>
                    <p>Koszt "talerzyka" dla gości: <span id="guestMealCost">0.00</span> PLN</p>
                    <p>Koszt noclegów dla gości: <span id="guestAccommCost">0.00</span> PLN</p>
                    <p>Koszt usługodawców: <span id="vendorTotalCost">0.00</span> PLN</p><hr>
                    <p>Dodatkowe koszty na osoby: <span id="additionalPerGuestCost">0.00</span> PLN</p>
                    <p><strong>Całkowity koszt wesela: <span id="totalWeddingCost">0.00</span> PLN</strong></p>
                    <p><strong>Suma wpłat (zaliczki + opłacone): <span id="totalPaid">0.00</span> PLN</strong></p>
                    <p><strong>Pozostało do zapłaty: <span id="totalRemaining">0.00</span> PLN</strong></p>
                </div>
            </section>
        </div>

        <!-- Strona 5: Plan Stołów -->
        <div id="seating" class="page">
            <section id="seating-section">
                <h2>Graficzny Plan Stołów</h2>
                <!-- Dodajemy klasę .ajax-form -->
                <form class="table-controls ajax-form">
                    <input type="hidden" name="action" value="add_table">
                    <input type="text" id="tableName" name="tableName" placeholder="Nazwa stołu (np. Stół Wiejski)">
                    <input type="number" id="tableCapacity" name="tableCapacity" placeholder="Liczba miejsc" min="1" required>
                    <select id="tableShape" name="tableShape">
                        <option value="rect">Prostokątny</option>
                        <option value="round">Okrągły</option>
                    </select>
                    <button type="submit">Dodaj Stół</button>
                </form>
                <div class="seating-area">
                    <div id="unassigned-guests" class="guest-pool" ondragover="allowDrop(event)" ondrop="dropOnPool(event)"></div>
                    <div id="tables-container"></div>
                </div>
            </section>
        </div>

        <!-- Strona 6: Eksport -->
        <div id="export" class="page">
            <section id="export-section">
                <h2>Raporty</h2>
                <p>Wygeneruj raporty z listą gości, budżetem i planem stołów do formatu PDF lub Excel.</p>
                <div class="export-buttons">
                    <button type="button" onclick="exportToPDF()">Eksportuj do PDF</button>
                    <button type="button" onclick="exportToExcel()">Eksportuj do Excel</button>
                </div>
            </section>
            
            <section id="data-transfer-section">
                <h2>Przenoszenie Danych (Import/Eksport)</h2>
                <p>Zapisz wszystkie dane z organizera do jednego pliku, aby przenieść je na inny komputer, lub wczytaj dane z pliku.</p>
                <div class="export-buttons">
                    <button type="button" onclick="exportDataToFile()">Eksportuj dane do pliku</button>
                    <label class="import-label"><input type="file" id="importFileInput" onchange="importDataFromFile(event)" accept=".json"> Importuj dane z pliku</label>
                </div>
            </section>
        </div>
    </main>
    <script src="js/script.js"></script>
</body>
</html>