<?php
// views/dashboard.php (WIDOK)

// Ten plik zakłada, że zmienne $organizer_id, $settings, $is_admin, $permission_level 
// zostały zdefiniowane w pliku index.php, który go załadował.
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organizer Ślubny PRO+</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- MODAL DO EDYCJI GOŚCI (bez zmian) -->
    <div id="edit-guest-modal" class="modal-overlay">
        <div class="modal-content">
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

<div id="edit-vendor-modal" class="modal-overlay">
        <div class="modal-content">
            <form class="ajax-form">
                <h2>Edytuj Koszt Usługodawcy</h2>
                <input type="hidden" name="action" value="edit_vendor">
                <input type="hidden" id="editVendorId" name="editVendorId"> 
                
                <label for="editVendorCategory">Kategoria:</label> <!-- NOWE POLE -->
                <select id="editVendorCategory" name="editVendorCategory" required>
                    <option value="0">Wybierz kategorię...</option>
                    <!-- Opcje będą renderowane dynamicznie przez JS -->
                </select>

                <label>Nazwa usługi</label><input type="text" id="editVendorName" name="editVendorName"> 
                <label>Całkowity koszt</label><input type="number" id="editVendorCost" name="editVendorCost" min="0" step="0.01"> 
                <label>Data płatności</label><input type="date" id="editVendorPaymentDate" name="editVendorPaymentDate"> 
                <div class="modal-actions">
                    <button type="submit">Zapisz Zmiany</button>
                    <button type="button" class="secondary" onclick="closeModal('edit-vendor-modal')">Anuluj</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- NOWY MODAL DO DODAWANIA PŁATNOŚCI -->
    <div id="add-payment-modal" class="modal-overlay">
        <div class="modal-content">
            <form class="ajax-form">
                <h2 id="paymentModalTitle">Rejestracja Płatności</h2>
                <input type="hidden" name="action" value="add_vendor_payment">
                <input type="hidden" id="paymentVendorId" name="vendorId">
                <label for="paymentAmount">Kwota płatności:</label><input type="number" id="paymentAmount" name="paymentAmount" min="0.01" step="0.01" required>
                <label for="paymentDate">Data płatności:</label><input type="date" id="paymentDate" name="paymentDate" value="<?php echo date('Y-m-d'); ?>" required>
                <label for="paymentDescription">Opis (np. Ostatnia rata):</label><input type="text" id="paymentDescription" name="paymentDescription">
                <div class="modal-actions">
                    <button type="submit">Zarejestruj Wpłatę</button>
                    <button type="button" class="secondary" onclick="closeModal('add-payment-modal')">Anuluj</button>
                </div>
            </form>
        </div>
    </div>
	
	
	 <div id="rsvp-link-modal" class="modal-overlay">
        <div class="modal-content">
            <h2>Link do Potwierdzenia Obecności</h2>
            <p id="rsvpModalGuestName"></p>
            <label>Unikalny link:</label>
            <input type="text" id="rsvpLinkInput" readonly style="cursor: pointer;" onclick="this.select(); document.execCommand('copy'); alert('Link skopiowany do schowka!');">
            <div id="qrCodeContainer" style="margin-top: 20px; text-align: center;">
                <p>Kod QR (do wydruku na zaproszeniu):</p>
                <img id="qrCodeImage" alt="Kod QR" style="width: 150px; height: 150px; border: 1px solid #ddd;">
            </div>
            <div class="modal-actions">
                <button type="button" class="secondary" onclick="closeModal('rsvp-link-modal')">Zamknij</button>
            </div>
        </div>
    </div>
    
    <header>
        <h1>Mój Organizer Ślubny</h1>
         <div style="position: absolute; top: 10px; right: 20px;">
             <a href="logout.php" style="color: white; text-decoration: none; background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 4px;">Wyloguj</a>
        </div>
        <nav id="main-nav">
            <?php if ($organizer_id): ?>
                <button class="nav-button active" data-page="dashboard">Pulpit</button>
                <button class="nav-button" data-page="tasks">Zadania i Kalendarz</button>
                <button class="nav-button" data-page="guests">Lista Gości</button>
                <button class="nav-button" data-page="budget">Budżet</button>
                <button class="nav-button" data-page="seating">Plan Stołów</button>
            <?php endif; ?>
            
            <?php if ($is_admin || $permission_level === 'owner'): ?>
                <button class="nav-button <?php if (!$organizer_id) echo 'active'; ?>" data-page="users">Użytkownicy</button>
            <?php endif; ?>

             <?php if ($organizer_id): ?>
                <button class="nav-button" data-page="export">Eksport</button>
                <button class="nav-button" data-page="guest_info">Info dla Gości</button>
             <?php endif; ?>
        </nav>
        </nav>
    </header>

    <main>
        <?php if ($organizer_id): ?>
            <!-- Strona 1: Pulpit (bez zmian) -->
            <div id="dashboard" class="page active">
    <section class="dashboard-hero">
        <div class="dashboard-content">
            <h2>Nasza Data Ślubu</h2>
            <form class="date-setter ajax-form">
                <input type="hidden" name="action" value="save_wedding_date">
                
                <!-- ZMIANA 1: DATA ŚLUBU Z GODZINĄ -->
                <input type="date" id="weddingDate" name="wedding_date" title="Ustaw datę ślubu" value="<?php echo htmlspecialchars($settings['wedding_date'] ?? ''); ?>">
                <input type="time" id="weddingTime" name="wedding_time" title="Ustaw godzinę ślubu" value="<?php echo htmlspecialchars($settings['wedding_time'] ?? '16:00'); ?>">
                
                <button type="submit">Zapisz Datę</button>
            </form>
            <div id="countdown-container">
                <div id="countdown">Ustaw datę, aby rozpocząć odliczanie.</div>
            </div>
            
            <!-- NOWA SEKCJA: TERMIN RSVP -->
            <h3 style="color: white; margin-top: 25px;">Termin RSVP</h3>
            <form class="date-setter ajax-form">
                <input type="hidden" name="action" value="save_rsvp_date"> <!-- NOWA AKCJA -->
                <input type="date" id="rsvpDeadlineDate" name="rsvp_deadline_date" title="Ustaw datę odpowiedzi" value="<?php echo htmlspecialchars($settings['rsvp_deadline_date'] ?? ''); ?>">
                <button type="submit">Zapisz Termin</button>
            </form>
            <div id="rsvp-countdown-container" style="margin-top: 10px;">
                <div id="rsvpCountdown" style="font-size: 1.5em; font-weight: bold;">Ustaw datę odpowiedzi.</div>
            </div>
        </div>
    </section>
</div>

            <!-- Strona 2: Zadania (bez zmian) -->
            <div id="tasks" class="page">
                 <section id="tasks-section">
                    <h2>Zarządzanie Zadaniami</h2>
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
			
			<div id="day-details-modal" class="modal-overlay">
    <div class="modal-content" style="max-width: 500px;">
        <h2 id="dayDetailsDate">Zadania na dzień: [Data]</h2>
        <ul id="dayDetailsList" style="list-style: none; padding: 0;">
            <!-- SZCZEGÓŁY ZADAŃ BĘDĄ RENDEROWANE TUTAJ -->
        </ul>
        <div class="modal-actions">
            <button type="button" class="secondary" onclick="closeModal('day-details-modal')">Zamknij</button>
            <button type="button" onclick="openAddTaskModal()">+ Dodaj Zadanie</button> <!-- NOWY PRZYCISK -->
        </div>
    </div>
</div>

            <!-- Strona 3: Goście (bez zmian) -->
            <div id="guests" class="page">
                 <section id="guests-section">
                    <h2>Zarządzanie Listą Gości</h2>
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
                        <button type="button" class="filter-btn" onclick="filterGuests('confirmed')">Zatwierdzeni</button>
                        <button type="button" class="filter-btn" onclick="filterGuests('unconfirmed')">Niepotwierdzeni</button>
                        <!-- NOWE PRZYCISKI -->
                        <button type="button" class="filter-btn" onclick="filterGuests('pending')">Oczekujący RSVP</button>
                        <button type="button" class="filter-btn" onclick="filterGuests('after_party')">Poprawiny</button>
                        <!-- /NOWE PRZYCISKI -->
                    </div>
                    <table id="guestTable">
                        <thead><tr><th>Goście</th><th>Status RSVP</th><th>Potw. Dorosłych</th><th>Potw. Dzieci</th><th>Poprawiny (osób)</th><th>Nocleg (osób)</th><th>Akcje</th></tr></thead>
                        <tbody></tbody>
                        <tfoot></tfoot>
                    </table>
                </section>
            </div>
            
            <!-- Strona 4: Budżet (ZMIANA) -->

<div id="budget" class="page">
    <section id="budget-section">
        <h2>Budżet i Koszty</h2>
        
        <!-- NOWA SEKCJA: Zarządzanie Kategoriami -->
        <div class="category-manager" style="margin-bottom: 25px; padding: 15px; border: 1px solid var(--accent-color); border-radius: 5px;">
            <h3>Zarządzanie Kategoriami Usługodawców</h3>
            <form class="category-form ajax-form" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <input type="hidden" name="action" value="add_vendor_category">
                <input type="text" id="categoryName" name="categoryName" placeholder="Nowa kategoria (np. Sala, Fotograf)" required style="flex-grow: 1;">
                <button type="submit">Dodaj Kategorię</button>
            </form>
            <ul id="categoryList" style="list-style: none; margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px;">
                <!-- KATEGORIE BĘDĄ RENDEROWANE TUTAJ PRZEZ JS -->
            </ul>
        </div>
        
        <form class="ajax-form">
            <input type="hidden" name="action" value="save_wedding_date">
            <div class="budget-setup">
                <h3>Cennik i Widełki Wiekowe</h3> <!-- ZMIANA NAGŁÓWKA -->
                
                <!-- CENNIK BEZ ZMIAN -->
                <div class="price-item">
                    <label for="priceAdult">Cena za osobę dorosłą ("talerzyk") + tort 12zł:</label>
                    <input type="number" id="priceAdult" name="price_adult" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_adult'] ?? '0'); ?>" min="0" step="0.01">
                </div>
                <div class="price-item">
                    <label for="priceChildOlder">Cena za dziecko starsze: <span id="ageOlderRange"></span> lat:</label>
                    <input type="number" id="priceChildOlder" name="price_child_older" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_child_older'] ?? '0'); ?>" min="0" step="0.01">
                </div>
                <div class="price-item">
                    <label for="priceChildYounger">Cena za dziecko młodsze: <span id="ageYoungerMax"></span> lat:</label>
                    <input type="number" id="priceChildYounger" name="price_child_younger" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_child_younger'] ?? '0'); ?>" min="0" step="0.01">
                </div>
                <div class="price-item">
                    <label for="priceAccommodation">Koszt noclegu za osobę/noc:</label>
                    <input type="number" id="priceAccommodation" name="price_accommodation" oninput="updateBudget()" value="<?php echo htmlspecialchars($settings['price_accommodation'] ?? '0'); ?>" min="0" step="0.01">
                </div>

                <!-- NOWE POLA EDYCJI WIDEŁEK -->
                <div class="price-item" style="border-top: 1px dashed var(--border-color); margin-top: 15px;">
                    <label for="age_older_min">Wiek minimalny dla dziecka starszego (np. 4):</label>
                    <input type="number" id="age_older_min" name="age_older_min" oninput="updateBudgetDisplay()" value="<?php echo htmlspecialchars($settings['age_older_min'] ?? '4'); ?>" min="0">
                </div>
                <div class="price-item">
                    <label for="age_older_max">Wiek maksymalny dla dziecka starszego (np. 10):</label>
                    <input type="number" id="age_older_max" name="age_older_max" oninput="updateBudgetDisplay()" value="<?php echo htmlspecialchars($settings['age_older_max'] ?? '10'); ?>" min="0">
                </div>
                <div class="price-item">
                    <label for="age_adult_min">Wiek minimalny dla dorosłego / pełna cena (np. 11):</label>
                    <input type="number" id="age_adult_min" name="age_adult_min" oninput="updateBudgetDisplay()" value="<?php echo htmlspecialchars($settings['age_adult_min'] ?? '11'); ?>" min="0">
                </div>
                <input type="hidden" name="wedding_date" id="hidden_wedding_date" value="<?php echo htmlspecialchars($settings['wedding_date'] ?? ''); ?>">
                <button type="submit" style="margin-top: 10px;">Zapisz Cennik</button>
            </div>
        </form>

        <div class="vendor-costs">
            <h3>Koszty Usługodawców</h3>
            <form class="vendor-form ajax-form">
                <input type="hidden" name="action" value="add_vendor">
                
                <label for="vendorCategory">Kategoria:</label> <!-- NOWE POLE -->
                <select id="vendorCategory" name="vendorCategory" required>
                    <option value="0">Wybierz kategorię...</option>
                    <!-- Opcje będą renderowane dynamicznie przez JS -->
                </select>
                
                <input type="text" id="vendorName" name="vendorName" placeholder="Usługa (np. DJ, Fotograf)" required>
                <input type="number" id="vendorCost" name="vendorCost" placeholder="Całkowity koszt" min="0" step="0.01" required>
                <input type="number" id="vendorDeposit" name="vendorDeposit" placeholder="Pierwsza płatność (opcjonalnie)" min="0" step="0.01">
                <input type="date" id="vendorPaymentDate" name="vendorPaymentDate" title="Data końcowej płatności (zadanie)">
                <button type="submit">Dodaj Koszt</button>
            </form>

            
			<!-- TABELA KOSZTÓW -->
            <table id="vendorTable" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr>
                        <th style="width: 25%;">Usługa / Kategoria</th>
                        <th style="width: 10%;">Koszt</th>
                        <th style="width: 10%;">Zapłacono</th>
                        <th style="width: 10%;">Pozostało</th>
                        <th style="width: 15%;">Termin</th>
                        <th style="width: 20%;">Postęp/raty po kliknięciu</th>
                        <th style="width: 10%;">Akcje</th> <!-- NOWA KOLUMNA DLA AKCJI -->
                    </tr>
                </thead>
                <tbody id="vendorTableBody">
                    <!-- POZYCJE BĘDĄ RENDEROWANE TUTAJ PRZEZ JS -->
                </tbody>
            </table>
     
<div class="budget-summary">
			<!-- USUNIĘTO " PLN" Z KAŻDEJ LINII -->
			<p>Koszt "talerzyka" dla gości: <span id="guestMealCost">0.00</span></p>
			<p>Koszt noclegów dla gości: <span id="guestAccommCost">0.00</span></p>
			<p>Koszt usługodawców: <span id="vendorTotalCost">0.00</span></p><hr>
			<p><strong>Całkowity koszt wesela: <span id="totalWeddingCost">0.00</span></strong></p>
			<p><strong>Suma wpłat: <span id="totalPaid">0.00</span></strong></p>
			<p><strong>Pozostało do zapłaty: <span id="totalRemaining">0.00</span></strong></p>
		</div>

    </section>
</div>


<!-- DODATKOWY MODAL DLA SZCZEGÓŁÓW PŁATNOŚCI (MODAL MUSI BYĆ NA GŁÓWNYM POZIOMIE BODY, ZA MODALAMI) -->
<div id="vendor-payments-modal" class="modal-overlay">
    <div class="modal-content" style="max-width: 600px;">
        <h2 id="paymentsModalVendorName">Płatności dla: [Nazwa Dostawcy]</h2>
        <div id="paymentsDetails" style="max-height: 400px; overflow-y: auto;">
            <!-- SZCZEGÓŁY RAT BĘDĄ RENDEROWANE TUTAJ -->
        </div>
        <div class="modal-actions">
            <button type="button" class="secondary" onclick="closeModal('vendor-payments-modal')">Zamknij</button>
        </div>
    </div>
</div>	
		
		
            <!-- Strona 5: Plan Stołów (bez zmian) -->
            <div id="seating" class="page">
                <section id="seating-section">
                    <h2>Graficzny Plan Stołów</h2>
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
            
            <!-- Strona 6: Eksport (bez zmian) -->
            <div id="export" class="page">
        <section id="export-section">
            <h2>Raporty</h2>
            <div class="export-buttons">
                <button type="button" onclick="exportToPDF()">Eksportuj do PDF</button>
                <button type="button" onclick="exportToExcel()">Eksportuj do Excel</button>
                <button type="button" onclick="exportAllQRCodes()" style="background-color: #4CAF50;">Pobierz wszystkie QR Kody (ZIP)</button>
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
			        
       <!-- Strona 7: Info dla Gości (CMS) -->
        <div id="guest_info" class="page">
            <section id="guest-info-section">
                <h2>Zarządzanie Informacjami dla Gości (RSVP)</h2>
                <form class="ajax-form">
                    <input type="hidden" name="action" value="save_guest_info">
                    
                    <h3>Mapy i Adresy (Wklej kod HTML Google Maps Embed)</h3>
                    <p>Aby uzyskać kod, znajdź miejsce w Google Maps, kliknij "Udostępnij", a następnie "Umieść mapę" i skopiuj cały kod `iframe`.</p>
                    
                    <label for="church_map_embed">Mapa do Kościoła/Urzędu</label>
                    <textarea id="church_map_embed" name="church_map_embed" rows="3"><?php echo htmlspecialchars($settings['church_map_embed'] ?? ''); ?></textarea>
                    
                    <label for="venue_map_embed">Mapa do Sali Weselnej</label>
                    <textarea id="venue_map_embed" name="venue_map_embed" rows="3"><?php echo htmlspecialchars($settings['venue_map_embed'] ?? ''); ?></textarea>

                    <h3>Kluczowe Informacje (Tekst / HTML)</h3>
                    
                    <label for="wedding_schedule">Plan Dnia (Harmonogram)</label>
                    <textarea id="wedding_schedule" name="wedding_schedule" rows="5"><?php echo htmlspecialchars($settings['wedding_schedule'] ?? ''); ?></textarea>
                    
                    <label for="wedding_menu">Menu (Wypunktowanie)</label>
                    <textarea id="wedding_menu" name="wedding_menu" rows="5"><?php echo htmlspecialchars($settings['wedding_menu'] ?? ''); ?></textarea>
                    
                    <label for="key_info">Dodatkowe Ważne Info (np. Dress Code, Prezenty)</label>
                    <textarea id="key_info" name="key_info" rows="5"><?php echo htmlspecialchars($settings['key_info'] ?? ''); ?></textarea>

                    <!-- START: NOWE POLA DLA ZDJĘĆ I RODO -->

                    <h3>Informacja o Zdjęciach i Wideo</h3>
                    <label for="photos_info">Tekst wyświetlany po weselu w sekcji "Zdjęcia i Wideo":</label>
                    <textarea id="photos_info" name="photos_info" rows="3"><?php echo htmlspecialchars($settings['photos_info'] ?? 'Materiały z uroczystości (zdjęcia i wideo) będą udostępnione Gościom po ich otrzymaniu i obróbce przez parę młodą. Spodziewany termin to **[WPISZ TERMIN]**. O ich dostępności zostaną Państwo poinformowani osobną wiadomością.'); ?></textarea>

                    <h3>Klauzula RODO</h3>
                    <label for="rodo_info">Treść RODO wyświetlana małą czcionką na dole strony:</label>
                    <textarea id="rodo_info" name="rodo_info" rows="5"><?php echo htmlspecialchars($settings['rodo_info'] ?? 'Administratorem Państwa danych osobowych (imię, nazwisko, adres e-mail, status obecności, uwagi) podanych w celu organizacji wesela są Państwo Młodzi. Dane są przetwarzane wyłącznie w celu organizacji i zarządzania listą gości weselnych, potwierdzania obecności, organizacji noclegów i poprawin oraz komunikacji związanej z uroczystością, na podstawie prawnie uzasadnionego interesu (art. 6 ust. 1 lit. f RODO). Podanie danych jest dobrowolne, lecz niezbędne do uczestnictwa w uroczystości. Mają Państwo prawo dostępu do treści swoich danych oraz ich poprawiania, usunięcia lub ograniczenia przetwarzania. Dane będą przechowywane do czasu zakończenia organizacji wesela i rozliczeń związanych z uroczystością.'); ?></textarea>

                    <!-- END: NOWE POLA -->

                    <h3>Kontakty</h3>
                    <label for="contact_bride_phone">Kontakt do Panny Młodej (np. Anna: 500 111 222)</label>
                    <input type="text" id="contact_bride_phone" name="contact_bride_phone" value="<?php echo htmlspecialchars($settings['contact_bride_phone'] ?? ''); ?>">
                    
                    <label for="contact_groom_phone">Kontakt do Pana Młodego (np. Piotr: 500 333 444)</label>
                    <input type="text" id="contact_groom_phone" name="contact_groom_phone" value="<?php echo htmlspecialchars($settings['contact_groom_phone'] ?? ''); ?>">
                    
                    <button type="submit" style="margin-top: 20px;">Zapisz Informacje dla Gości</button>
                </form>
            </section>
        </div>
			
        <?php else: ?>
            <!-- Widok dla admina, który nie ma jeszcze swojego organizera (bez zmian) -->
            <div id="dashboard" class="page active">
                <section>
                    <h2>Witaj, Administratorze!</h2>
                    <p>Nie masz przypisanego żadnego organizera. Przejdź do zakładki "Użytkownicy", aby utworzyć nowe konta i zapraszać ich do organizerów.</p>
                </section>
            </div>
        <?php endif; ?>

        <!-- Strona Użytkownicy (bez zmian) -->
        <?php if ($is_admin || $permission_level === 'owner'): ?>
        <div id="users" class="page <?php if (!$organizer_id) echo 'active'; ?>">
            <section id="users-section">
                <h2>Zarządzaj Użytkownikami</h2>
                
                <?php if ($organizer_id && ($is_admin || $permission_level === 'owner')): ?>
                <div id="organizer-user-management">
                    <h3>Dodaj lub zaproś użytkownika do tego organizera</h3>
                    <form class="ajax-form" id="add-invite-user-form">
                        <input type="hidden" name="action" value="add_or_invite_user">
                        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                            <input type="email" name="email" placeholder="Adres e-mail użytkownika" required style="flex-grow: 1;" autocomplete="email">
                            <?php if ($is_admin): ?>
                                <input type="password" name="password" placeholder="Hasło (jeśli nowy)" style="flex-grow: 1;" autocomplete="new-password">
                            <?php endif; ?>
                            <select name="permission_level">
                                <option value="viewer">Tylko podgląd</option>
                                <option value="editor">Możliwość edycji</option>
                                <?php if ($is_admin): ?>
                                <option value="owner">Właściciel</option>
                                <?php endif; ?>
                            </select>
                            <button type="submit">Dodaj / Zaproś</button>
                        </div>
                        <?php if ($is_admin): ?>
                            <small style="display: block; margin-top: 5px;">Jeśli użytkownik nie istnieje, zostanie utworzony z podanym hasłem. Jeśli istnieje, hasło zostanie zignorowane.</small>
                        <?php else: ?>
                             <small style="display: block; margin-top: 5px;">Użytkownik musi już posiadać konto w systemie, aby można go było zaprosić.</small>
                        <?php endif; ?>
                    </form>
                    <h3 style="margin-top: 30px;">Użytkownicy z dostępem do tego organizera</h3>
                    <ul id="userList" style="list-style: none; margin-top: 10px;"></ul>
                </div>
                <?php elseif ($is_admin): ?>
                    <p>Nie masz przypisanego żadnego organizera. Nie możesz zarządzać dostępem, dopóki ktoś nie zaprosi Cię do współpracy lub nie utworzysz własnego organizera (funkcja do dodania w przyszłości).</p>
                <?php endif; ?>
            </section>
        </div>
        <?php endif; ?>
    </main>

    <!-- SEKCJA ŁADOWANIA SKRYPTÓW -->
   <script src="lib/jspdf.umd.min.js"></script>
    <script src="lib/jspdf.plugin.autotable.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" defer></script>
    
    <!-- 1. Zmienne globalne i funkcje pomocnicze -->
    <script src="js/globals.js"></script> 
    <script src="js/utils.js"></script>

    <!-- 2. Modale i Autoryzacja -->
    <script src="js/modals.js"></script>
    <script src="js/users.js"></script>

    <!-- 3. Główne sekcje aplikacji -->
    <script src="js/tasks_calendar.js"></script>
    <script src="js/guests.js"></script>
    <script src="js/budget.js"></script>
    <script src="js/seating.js"></script>
    <script src="js/export.js"></script>

    <!-- 4. Główna pętla i AJAX (musi być OSTATNI) -->
    <script src="js/main.js" defer></script> 

</body>
</html>