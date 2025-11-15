<<<<<<< Updated upstream
=======
// js/script.js (WERSJA OSTATECZNA Z ZABEZPIECZENIAMI)

>>>>>>> Stashed changes
// --- GLOBALNE ZMIENNE ---
let tasks = [], guests = [], vendors = [], tables = [], users = [];
let currentDate = new Date();
let guestFilterState = 'all';
let countdownInterval;
let budgetItems = [];

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
// --- INICJALIZACJA ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    
    // Bezpieczne ustawienie aktywnej strony
    const activeButton = document.querySelector('.nav-button.active');
    if (activeButton) {
        showPage(activeButton.dataset.page);
    }
    
    renderAll();

    document.querySelectorAll('.ajax-form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
});

/**
 * Centralna funkcja do obsługi wszystkich formularzy AJAX.
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (!cb.checked && formData.has(cb.name)) {
            formData.delete(cb.name);
        }
    });

    try {
        const response = await fetch('index.php', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Wystąpił nieznany błąd serwera.');

<<<<<<< Updated upstream
        // ZMIANA: Resetowanie formularza dodawania płatności
        if (form.classList.contains('task-input') || form.classList.contains('guest-form') || form.classList.contains('vendor-form') || form.classList.contains('table-controls') || form.id === 'add-invite-user-form' || form.id === 'create-user-form') {
=======
        if (form.classList.contains('task-input') || form.classList.contains('guest-form') || form.classList.contains('vendor-form') || form.classList.contains('table-controls') || form.id === 'invite-user-form' || form.id === 'create-user-form') {
>>>>>>> Stashed changes
            form.reset();
            if (form.classList.contains('guest-form')) {
                document.getElementById('children-inputs').innerHTML = `<div><input type="text" placeholder="Imię dziecka" name="addChildName[]"><input type="number" placeholder="Wiek" min="0" name="addChildAge[]"></div>`;
            }
        }
        
        if (form.closest('.modal-overlay')) {
            closeModal(form.closest('.modal-overlay').id);
        }
        
        await renderAll();

        if (result.message) {
            alert(result.message);
        }
        
    } catch (error) {
        console.error('Błąd podczas przetwarzania formularza:', error);
        alert(`Wystąpił błąd: ${error.message}`);
    }
}

/**
 * Pobiera dane z serwera.
 */
async function fetchData(dataType) {
    try {
        const response = await fetch(`api_data.php?dataType=${dataType}`);
        if (!response.ok) {
            if (response.status === 401) window.location.href = 'login.php';
            throw new Error(`Błąd sieci: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Błąd podczas pobierania danych (${dataType}):`, error);
        return [];
    }
}

/**
 * Główna funkcja do pobierania wszystkich danych i odświeżania interfejsu.
 */
async function renderAll() {
<<<<<<< Updated upstream
    const dataToFetch = ['settings', 'tasks', 'guests', 'vendors', 'tables', 'organizer_users'];
    const [settingsData, tasksData, guestsData, vendorsData, tablesData, usersData] = await Promise.all(
        dataToFetch.map(type => fetchData(type))
    );

     if (settingsData && typeof settingsData === 'object' && !Array.isArray(settingsData)) {
        // Sprawdzamy, czy elementy istnieją, zanim cokolwiek zrobimy
        const weddingDateEl = document.getElementById('weddingDate');
        if (weddingDateEl) {
            // ... (ustawienia daty/ceny bez zmian)
=======
    const dataToFetch = ['settings', 'tasks', 'guests', 'vendors', 'tables', 'organizer_users', 'budget_items'];
    const [settingsData, tasksData, guestsData, vendorsData, tablesData, usersData, budgetItemsData] = await Promise.all(
        dataToFetch.map(type => fetchData(type))
    );

    if (settingsData && typeof settingsData === 'object' && !Array.isArray(settingsData)) {
        // Sprawdzamy, czy elementy istnieją, zanim cokolwiek zrobimy
        const weddingDateEl = document.getElementById('weddingDate');
        if (weddingDateEl) {
>>>>>>> Stashed changes
            weddingDateEl.value = settingsData.wedding_date || '';
            document.getElementById('hidden_wedding_date').value = settingsData.wedding_date || '';
            document.getElementById('priceAdult').value = settingsData.price_adult || '0';
            document.getElementById('priceChildOlder').value = settingsData.price_child_older || '0';
            document.getElementById('priceChildYounger').value = settingsData.price_child_younger || '0';
            document.getElementById('priceAccommodation').value = settingsData.price_accommodation || '0';
<<<<<<< Updated upstream
            
            // NOWE: Ustawienia widełek wiekowych
            const ageOlderMinEl = document.getElementById('age_older_min');
            if (ageOlderMinEl) ageOlderMinEl.value = settingsData.age_older_min || '4';
            const ageOlderMaxEl = document.getElementById('age_older_max');
            if (ageOlderMaxEl) ageOlderMaxEl.value = settingsData.age_older_max || '10';
            const ageAdultMinEl = document.getElementById('age_adult_min');
            if (ageAdultMinEl) ageAdultMinEl.value = settingsData.age_adult_min || '11';

            setupCountdown();
            updateBudgetDisplay(); // NOWE: Aktualizacja wyświetlanych widełek
=======
            setupCountdown();
>>>>>>> Stashed changes
        }
    }

    tasks = Array.isArray(tasksData) ? tasksData : [];
    guests = Array.isArray(guestsData) ? guestsData : [];
    vendors = Array.isArray(vendorsData) ? vendorsData : [];
    tables = Array.isArray(tablesData) ? tablesData : [];
    users = Array.isArray(usersData) ? usersData : [];

    // Funkcje renderujące teraz mają zabezpieczenia wewnątrz
    renderTasks(); renderCalendar();
    renderGuests();
    renderVendors();
    renderTables(); renderUnassignedGuests();
    renderUsers();
    updateBudget();
}

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
/**
 * Podpina zdarzenia do przycisków nawigacji.
 */
function setupNavigation() {
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => { showPage(button.dataset.page); });
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) pageToShow.classList.add('active');

    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });
}
function confirmAction(message, onConfirm, onCancel) {
    if (confirm(message)) onConfirm();
    else if (onCancel) onCancel();
}

function setupCountdown() {
    const weddingDateInput = document.getElementById('weddingDate');
    // Guard Clause: Jeśli element nie istnieje, nic nie rób
    if (!weddingDateInput) return;
    if (weddingDateInput.value) startCountdown(weddingDateInput.value);
}

function startCountdown(date) {
    if (countdownInterval) clearInterval(countdownInterval);
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    if (!date) {
        countdownElement.innerHTML = "Ustaw datę, aby rozpocząć odliczanie.";
        return;
    }
    const weddingDateTime = new Date(date).getTime();
    countdownInterval = setInterval(() => {
        const distance = weddingDateTime - new Date().getTime();
        if (distance < 0) { clearInterval(countdownInterval); countdownElement.innerHTML = "Wszystkiego najlepszego!"; return; }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

function confirmToggleTask(id, checkbox) {
    const task = tasks.find(t => t.id == id);
    confirmAction(`Oznaczyć zadanie "${task.name}" jako ${checkbox.checked ? 'ukończone' : 'nieukończone'}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'toggle_task_completion');
        formData.append('task_id', id);
        if (checkbox.checked) { formData.append('completed', 'true'); }
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
    }, () => { checkbox.checked = !checkbox.checked; });
}

function confirmRemoveTask(id) {
    const task = tasks.find(t => t.id == id);
    if (parseInt(task.is_payment_task) === 1) { alert("Tego zadania nie można usunąć ręcznie. Usuń lub zmień datę płatności w zakładce Budżet."); return; }
    
    confirmAction(`Usunąć zadanie "${task.name}"?`, async () => {
        const formData = new FormData();
        formData.append('action', 'delete_task');
        formData.append('task_id', id);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
    });
}

function renderTasks() {
    const list = document.getElementById('taskList');
    // Guard Clause:
    if (!list) return;
    list.innerHTML = '';
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(task => {
        const li = document.createElement('li');
        const isCompleted = parseInt(task.completed) === 1;
        li.className = isCompleted ? 'completed' : '';
        const paymentIcon = parseInt(task.is_payment_task) === 1 ? '💰 ' : '';
        li.innerHTML = `<input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="confirmToggleTask(${task.id}, this)"><span>${paymentIcon}<strong>${task.name}</strong> (do ${task.date}) - Odp: ${task.owner || 'brak'}${isCompleted ? ` | Zrealizowano: ${task.completion_date}` : ''}</span><button type="button" onclick="confirmRemoveTask(${task.id})">Usuń</button>`;
        list.appendChild(li);
    });
}

function renderCalendar() {
    const view = document.getElementById('calendar-view');
    // Guard Clause:
    if (!view) return;
    view.innerHTML = '';
    const month = currentDate.getMonth(), year = currentDate.getFullYear();
    document.getElementById('calendar-month-year').textContent = `${currentDate.toLocaleString('pl', { month: 'long' })} ${year}`;
    const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) { view.innerHTML += `<div class="calendar-day empty"></div>`; }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div'); dayDiv.className = 'calendar-day';
        const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const eventsForDay = tasks.filter(t => t.date === dayString);
        let eventsHTML = eventsForDay.map(event => {
            const isCompleted = parseInt(event.completed) === 1;
            const isPayment = parseInt(event.is_payment_task) === 1;
            return `<div class="task-on-calendar ${isPayment ? 'payment' : 'task'} ${isCompleted ? 'completed' : ''}" title="${event.name}">${isPayment ? '💰 ' : ''}${event.name}</div>`;
        }).join('');
        dayDiv.innerHTML = `<div class="day-number">${day}</div>${eventsHTML}`;
        view.appendChild(dayDiv);
    }
}

function nextMonth() { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); }
function previousMonth() { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); }

function addChildInput(mode = 'add') {
    const container = document.getElementById(mode === "add" ? "children-inputs" : "edit-children-inputs");
    const div = document.createElement("div");
    const namePrefix = mode === 'add' ? 'addChild' : 'editChild';
    div.innerHTML = `<input type="text" placeholder="Imię dziecka" name="${namePrefix}Name[]"><input type="number" placeholder="Wiek" min="0" name="${namePrefix}Age[]"><button type="button" class="remove-child-btn" onclick="this.parentElement.remove()">X</button>`;
    container.appendChild(div);
}

function filterGuests(status) {
    guestFilterState = status;
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`.filter-btn[onclick="filterGuests('${status}')"]`).classList.add("active");
    renderGuests();
}

// NOWA FUNKCJA: Generuje HTML dla znacznika statusu
function getStatusHtml(status) {
    let text = '', className = '';
    switch(status) {
        case 'confirmed': text = 'ZATWIERDZONY'; className = 'status-confirmed'; break;
        case 'pending': text = 'Oczekuje na poinformowanie Państwa Młodych w systemie'; className = 'status-pending'; break;
        case 'rejected': text = 'REZYGNACJA'; className = 'status-rejected'; break; // NOWY STATUS
        case 'unconfirmed': text = 'Oczekuje na akceptację'; className = 'status-unconfirmed'; break;
        default: text = 'Nieznany'; className = 'status-unconfirmed';
    }
    return `<span class="status-badge ${className}">${text}</span>`; 
}

// NOWA FUNKCJA: Generuje SELECT dla admina
function getAdminStatusSelect(guestId, currentStatus) {
    let select = `<select onchange="confirmGuestUpdate(${guestId}, 'rsvp_status', this)" title="Status Administracyjny">`;
    // DODANO 'rejected' do listy statusów
    const statuses = { 'unconfirmed': 'Niepotwierdzony', 'pending': 'Oczekuje', 'confirmed': 'Zatwierdzony', 'rejected': 'Rezygnacja' }; 
    for (const [key, value] of Object.entries(statuses)) {
        const selected = key === currentStatus ? 'selected' : '';
        select += `<option value="${key}" ${selected}>${value}</option>`;
    }
    select += `</select>`;
    return select;
}

// script.js (cała funkcja renderGuests)

function renderGuests() {
    const tableBody = document.querySelector('#guestTable tbody');
<<<<<<< Updated upstream
=======
    // Guard Clause:
>>>>>>> Stashed changes
    if (!tableBody) return;
    const tableFoot = document.querySelector('#guestTable tfoot');
    tableBody.innerHTML = ''; tableFoot.innerHTML = '';
    
    // Zaktualizowana logika filtrowania
    let filteredGuests = guests.filter(g => {
        switch (guestFilterState) {
            case 'all': 
                return true;
            case 'confirmed': 
                return g.rsvp_status === 'confirmed';
            case 'unconfirmed': 
                return g.rsvp_status !== 'confirmed'; 
            case 'pending':
                return g.rsvp_status === 'pending'; 
            case 'after_party':
                return parseInt(g.after_party) > 0 && g.rsvp_status === 'confirmed'; 
            case 'rejected':
                return g.rsvp_status === 'rejected'; // Dodano filtr dla Rezygnacji
            default:
                return true;
        }
    });
    
    // -----------------------------------------------------
    // NOWE OBLICZENIA: ZAPROSZENI (suma całej listy)
    // -----------------------------------------------------
    const allAdults = guests.reduce((sum, g) => sum + (g.guest1_name ? 1 : 0) + (g.guest2_name ? 1 : 0), 0);
    const allChildren = guests.reduce((sum, g) => sum + (g.children ? g.children.length : 0), 0);
    const totalInvited = allAdults + allChildren;
    // -----------------------------------------------------
    
    filteredGuests.forEach(guest => {
        const isConfirmed = guest.rsvp_status === 'confirmed'; 
        
        // Definicja i obliczenie lokalnej liczby osób w grupie (oryginalny max)
        const countAdults = (guest.guest1_name ? 1 : 0) + (guest.guest2_name ? 1 : 0);
        const countChildren = (guest.children ? guest.children.length : 0);
        const maxPeople = countAdults + countChildren;
        
        let desc = [guest.guest1_name, guest.guest2_name].filter(Boolean).join(' & ');
        if(guest.children && guest.children.length > 0) desc += ` z dziećmi: ${guest.children.map(c => `${c.child_name} (${c.age}l)`).join(', ')}`;
        const row = document.createElement('tr');
        
        // NOWE: Przycisk/ikona do wyświetlania uwagi
        const cleanNotes = (guest.notes || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const notesButton = cleanNotes ? `<button type="button" class="notes-btn" onclick="alert('Uwagi od gościa:\\n${cleanNotes}')">Dieta / Uwagi</button>` : '';

        // NOWE POLA EDYCJI dla Dorosłych i Dzieci
        const confirmedAdultsInput = `<input type="number" value="${guest.confirmed_adults}" min="0" max="${countAdults}" onchange="confirmGuestUpdate(${guest.id}, 'confirmed_adults', this)" ${!isConfirmed ? 'disabled' : ''}>`;
        const confirmedChildrenInput = `<input type="number" value="${guest.confirmed_children}" min="0" max="${countChildren}" onchange="confirmGuestUpdate(${guest.id}, 'confirmed_children', this)" ${!isConfirmed ? 'disabled' : ''}>`;
        
        // NOWY STATUS POPRAWIN (input number)
        const afterPartyInput = `<input type="number" value="${guest.after_party}" min="0" max="${maxPeople}" onchange="confirmGuestUpdate(${guest.id}, 'after_party', this)" ${!isConfirmed ? 'disabled' : ''}>`;
        
        // NOWY STATUS RSVP I PRZYCISK ZARZĄDZANIA
        const statusHtml = getStatusHtml(guest.rsvp_status);
        const rsvpButton = `<button type="button" onclick="generateAndShowRsvpLink(${guest.id}, '${desc.replace(/'/g, "\\'")}')">Link RSVP / QR</button>`;
        const adminStatusSelect = getAdminStatusSelect(guest.id, guest.rsvp_status);

        // ZMIANA: Dodano kolumnę dla poprawin
        row.innerHTML = `<td>${desc} ${notesButton}</td> 
                         <td>${statusHtml} ${adminStatusSelect}</td>
                         <td>${confirmedAdultsInput}</td>
                         <td>${confirmedChildrenInput}</td>
                         <td>${afterPartyInput}</td> 
                         <td><input type="number" value="${guest.accommodation}" min="0" onchange="confirmGuestUpdate(${guest.id}, 'accommodation', this)" ${!isConfirmed ? 'disabled' : ''}></td>
                         <td>${rsvpButton}
                             <button type="button" onclick="openModal('edit-guest-modal', ${guest.id})">Edytuj</button>
                             <button type="button" class="secondary" onclick="confirmRemoveGuest(${guest.id})">Usuń</button></td>`;
        tableBody.appendChild(row);
    });
    
    // -----------------------------------------------------
    // OBLICZENIA DLA STOPKI: POTWIERDZENI (Confirmed)
    // -----------------------------------------------------
    const confirmedGuests = guests.filter(g => g.rsvp_status === 'confirmed');
    // Liczba POTWIERDZONA przez Admina/Gościa
    const finalAdults = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.confirmed_adults) || 0), 0);
    const finalChildren = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.confirmed_children) || 0), 0);
    const totalConfirmed = finalAdults + finalChildren;
    
    const confirmedAccommodation = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.accommodation) || 0), 0);
    const confirmedAfterParty = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.after_party) || 0), 0);

    // ZMIANA W STOPCE: Dodanie informacji o zaproszonych gościach
    tableFoot.innerHTML = `
        <tr>
            <!-- Kolumna 1: Zaproszeni -->
            <td colspan="2">
                <strong>Zaproszeni:</strong> ${totalInvited} os. (Dorośli: ${allAdults}, Dzieci: ${allChildren})
            </td>
            <!-- Kolumna 2: Potwierdzeni Dorosłych -->
            <td style="font-weight: bold; background-color: var(--light-bg-color);">
                ${finalAdults} os.
            </td>
            <!-- Kolumna 3: Potwierdzeni Dzieci -->
            <td style="font-weight: bold; background-color: var(--light-bg-color);">
                ${finalChildren} os.
            </td>
            <!-- Kolumna 4: Poprawiny -->
            <td>${confirmedAfterParty} os.</td>
            <!-- Kolumna 5: Nocleg -->
            <td>${confirmedAccommodation} os.</td>
            <!-- Kolumna 6: Akcje (pusta) -->
            <td></td>
        </tr>
    `;
    
    updateBudget(); 
    renderUnassignedGuests();
}


// MODYFIKACJA: confirmGuestUpdate - do obsługi pola numerycznego
function confirmGuestUpdate(guestId, key, el) {
    // ZMIANA: Wartość jest teraz zawsze liczbą całkowitą, jeśli nie jest to select/checkbox (dla accommodation i after_party)
    const value = el.type === 'checkbox' ? el.checked : el.value;
    
    // Konwersja na boolean/int, jakiej oczekuje serwer, w zależności od klucza
    let finalValue;
    if (el.type === 'checkbox') {
        finalValue = value ? 'true' : 'false';
    } else if (key === 'rsvp_status') {
        finalValue = value; // String
    } else {
        finalValue = parseInt(value); // Liczba dla accommodation/after_party
        if (isNaN(finalValue) || finalValue < 0) finalValue = 0;
    }
    
    const guest = guests.find(g => g.id == guestId);
    const guestName = [guest.guest1_name, guest.guest2_name].filter(Boolean).join(' & ');

    confirmAction(`Zmienić status dla grupy: ${guestName}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'update_guest_status');
        formData.append('guest_id', guestId);
        formData.append('key', key);
        formData.append('value', finalValue); // Wysłanie już przetworzonej wartości
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) await renderAll();
        else {
            alert(result.message);
            // Wycofanie zmiany, jeśli była na input/select
            el.value = guest[key];
        }
    }, () => { 
        // Wycofanie zmiany, jeśli była na input/select
        el.value = guest[key]; 
    });
}

// NOWA FUNKCJA: Generuje token i wyświetla modal
async function generateAndShowRsvpLink(guestId, guestName) {
    let guest = guests.find(g => g.id == guestId);
    let token = guest.rsvp_token;
    
    if (!token) {
        const formData = new FormData();
        formData.append('action', 'generate_token');
        formData.append('guest_id', guestId);
        
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success && result.token) {
            token = result.token;
            // Odśwież lokalną tablicę, aby uniknąć kolejnego zapytania
            guest.rsvp_token = token; 
        } else {
            alert(result.message || "Nie udało się wygenerować tokenu.");
            return;
        }
    }
    
    const rsvpUrl = `${window.location.origin}/rsvp.php?token=${token}`; // ZMIANA: Musisz dostosować ścieżkę do rsvp.php
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rsvpUrl)}`;
    
    document.getElementById("rsvpModalGuestName").textContent = `Dla: ${guestName}`;
    document.getElementById("rsvpLinkInput").value = rsvpUrl;
    document.getElementById("qrCodeImage").src = qrApiUrl;
    
    openModal('rsvp-link-modal'); // Użycie ogólnego openModal
}

function confirmRemoveGuest(guestId) {
    const guest = guests.find(g => g.id == guestId);
    const guestName = [guest.guest1_name, guest.guest2_name].filter(Boolean).join(' & ');
    confirmAction(`Usunąć grupę gości: ${guestName}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'delete_guest');
        formData.append('guest_id', guestId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
    });
}

function renderVendors() {
    const list = document.getElementById("vendorList");
    // Guard Clause:
    if (!list) return;
    list.innerHTML = "";
    vendors.forEach(vendor => {
        const li = document.createElement("li");
        const cost = parseFloat(vendor.cost);
        const totalPaid = parseFloat(vendor.total_paid) || 0; // ZMIANA: Użycie total_paid
        const isPaidFull = parseInt(vendor.paid_full_status) === 1; // ZMIANA: Użycie paid_full_status
        const remaining = cost - totalPaid;
        const paidStatus = isPaidFull ? 'Opłacone w całości' : `Opłacono: ${totalPaid.toFixed(2)} PLN`;
        const dateInfo = vendor.payment_date ? `<small class="date-info">Termin końcowej płatności: ${vendor.payment_date}</small>` : "";
        
        li.innerHTML = `<div class="vendor-details">
                            <span><strong>${vendor.name}:</strong> ${cost.toFixed(2)} PLN (${paidStatus}, Pozostało: ${remaining.toFixed(2)} PLN)</span>
                            ${dateInfo}
                        </div>
                        <div>
                            <button type="button" onclick="openAddPaymentModal(${vendor.id}, '${vendor.name}', ${cost.toFixed(2)}, ${totalPaid.toFixed(2)})">Dodaj Wpłatę</button>
                            <button type="button" onclick="openModal('edit-vendor-modal', ${vendor.id})">Edytuj</button>
                            <button type="button" class="secondary" onclick="confirmRemoveVendor(${vendor.id})">Usuń</button>
                        </div>`;
        list.appendChild(li);
    });
}

// NOWA FUNKCJA: Otwieranie modalu dodawania płatności
function openAddPaymentModal(vendorId, vendorName, totalCost, totalPaid) {
    document.getElementById("paymentVendorId").value = vendorId;
    document.getElementById("paymentModalTitle").textContent = `Rejestracja płatności dla: ${vendorName}`;
    const remaining = totalCost - totalPaid;
    document.getElementById("paymentAmount").placeholder = `Kwota (pozostało: ${remaining.toFixed(2)} PLN)`;
    // Domyślnie ustawia maks. kwotę do zapłaty
    document.getElementById("paymentAmount").max = remaining > 0 ? remaining.toFixed(2) : 0.01;
    document.getElementById("add-payment-modal").style.display = "flex";
}

function confirmRemoveVendor(vendorId) {
    const vendor = vendors.find(v => v.id == vendorId);
    confirmAction(`Usunąć koszt: ${vendor.name}? Wszystkie powiązane płatności i zadania zostaną USUNIĘTE!`, async () => { // ZMIANA: Ostrzeżenie o płatnościach
        const formData = new FormData();
        formData.append('action', 'delete_vendor');
        formData.append('vendor_id', vendorId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
    });
}

// script.js (cała funkcja updateBudget)

function updateBudget() {
    const priceAdultEl = document.getElementById("priceAdult");
<<<<<<< Updated upstream
    if (!priceAdultEl) return;
    
    // Pobieranie cen
=======
    // Guard Clause:
    if (!priceAdultEl) return;
>>>>>>> Stashed changes
    const pA = parseFloat(priceAdultEl.value) || 0;
    const pCO = parseFloat(document.getElementById("priceChildOlder").value) || 0;
    const pCY = parseFloat(document.getElementById("priceChildYounger").value) || 0;
    const pAcc = parseFloat(document.getElementById("priceAccommodation").value) || 0;
    
    // POBIERANIE DYNAMICZNYCH WIDEŁEK WIEKOWYCH
    const ageOlderMin = parseInt(document.getElementById('age_older_min')?.value) || 4;
    const ageOlderMax = parseInt(document.getElementById('age_older_max')?.value) || 10;
    const ageAdultMin = parseInt(document.getElementById('age_adult_min')?.value) || 11;
    const ageYoungerMax = ageOlderMin > 0 ? ageOlderMin - 1 : 0; // Wiek Younger kończy się przed Older Min
    
    let mealCost = 0, accommCost = 0;

    // Implementacja precyzyjnego walidatora wieku
    guests.filter(g => g.rsvp_status === 'confirmed').forEach(g => {
        const confirmedAdults = parseInt(g.confirmed_adults) || 0;
        const confirmedChildren = parseInt(g.confirmed_children) || 0;
        
        // 1. KOSZT DOROSŁYCH:
        mealCost += confirmedAdults * pA;
        
        // 2. KOSZT DZIECI: Liczymy tylko do limitu confirmedChildren
        if (confirmedChildren > 0 && g.children) {
            
            // Sortujemy dzieci (np. aby opłacić droższe stawki w pierwszej kolejności, jeśli jest limit)
            const sortedChildren = g.children.sort((a, b) => b.age - a.age);
            
            let childrenCounted = 0;
            
            sortedChildren.forEach(child => {
                if (childrenCounted < confirmedChildren) { 
                    
                    const age = parseInt(child.age) || 0;

                    // WALIDATOR DYNAMICZNYCH WIDEŁEK
                    if (age >= ageAdultMin) { 
                        mealCost += pA;
                    } else if (age >= ageOlderMin && age <= ageOlderMax) { 
                        mealCost += pCO;
                    } else if (age <= ageYoungerMax) { 
                        mealCost += pCY;
                    } else {
                        // Przypadek błędu: wiek poza zdefiniowanymi widełkami (np. wiek > ageOlderMax i < ageAdultMin)
                        // W takim przypadku, dla bezpieczeństwa, przyjmujemy cenę Adult Price
                         mealCost += pA; 
                    }
                    childrenCounted++;
                }
            });
        }
        
        // 3. KOSZT NOCLEGU: Bez zmian
        accommCost += (parseInt(g.accommodation) || 0) * pAcc;
    });
	
			
	// policz dorosłych potwierdzonych
let confirmedAdults = 0;
guests.filter(g => parseInt(g.confirmed) === 1).forEach(g => {
  if (g.guest1_name) confirmedAdults++;
  if (g.guest2_name) confirmedAdults++;
});

// suma pozycji per-dorosły
let extrasPerAdult = budgetItems.reduce((sum, it) => {
  const price = parseFloat(it.unit_price) || 0;
  // dziś każdy item jest per_adult == true
  return sum + (price * confirmedAdults);
}, 0);

    let vendorTotal = vendors.reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);
    let totalPaid = vendors.reduce((sum, v) => sum + (parseFloat(v.total_paid) || 0), 0);
    
    document.getElementById("guestMealCost").textContent = mealCost.toFixed(2);
    document.getElementById("guestAccommCost").textContent = accommCost.toFixed(2);
    document.getElementById("vendorTotalCost").textContent = vendorTotal.toFixed(2);
	const totalCost = mealCost + accommCost + vendorTotal + extrasPerAdult;
    document.getElementById("totalWeddingCost").textContent = totalCost.toFixed(2);
    document.getElementById("totalPaid").textContent = totalPaid.toFixed(2);
    document.getElementById("totalRemaining").textContent = (totalCost - totalPaid).toFixed(2);
	
	const extrasEl = document.getElementById("extrasPerAdultCost");
if (extrasEl) extrasEl.textContent = extrasPerAdult.toFixed(2);

<<<<<<< Updated upstream
function updateBudgetDisplay() {
    const ageOlderMin = parseInt(document.getElementById('age_older_min')?.value) || 4;
    const ageOlderMax = parseInt(document.getElementById('age_older_max')?.value) || 10;
    const ageAdultMin = parseInt(document.getElementById('age_adult_min')?.value) || 11;
    
    // Walidacja logiki: Wiek "younger" musi kończyć się przed wiekiem "older"
    const finalYoungerMax = ageOlderMin > 0 ? ageOlderMin - 1 : 0;
    
    // Zaktualizuj wyświetlane zakresy
    const rangeOlderEl = document.getElementById('ageOlderRange');
    if (rangeOlderEl) rangeOlderEl.textContent = `${ageOlderMin}-${ageOlderMax}`;
    
    const rangeYoungerEl = document.getElementById('ageYoungerMax');
    if (rangeYoungerEl) rangeYoungerEl.textContent = finalYoungerMax;
    
    // Zmieniaj cennik, gdy widełki się zmienią
    updateBudget(); 
=======
>>>>>>> Stashed changes
}

function renderTables() {
    const container = document.getElementById("tables-container");
<<<<<<< Updated upstream
=======
    // Guard Clause:
>>>>>>> Stashed changes
    if (!container) return;
    container.innerHTML = "";
    
    tables.forEach(table => {
        const wrapper = document.createElement("div"); wrapper.className = "table-wrapper";
        const tableDiv = document.createElement("div"); tableDiv.id = table.id; tableDiv.className = `table-representation ${table.shape}`;
        const occupiedSeats = table.seats.filter(s => s.person_id).length;
        
        // 1. Nazwa stołu (Umieszczona absolutnie)
        const nameSpan = document.createElement('span');
        // ZMIANA: Usunięcie <br> i użycie formatu z nawiasami obok
        nameSpan.innerHTML = `${table.name} (${occupiedSeats}/${table.capacity})`; 
        tableDiv.appendChild(nameSpan);  // Dodajemy do kontenera stołu

        const isRect = table.shape === 'rect';
        const halfway = isRect ? Math.ceil(table.capacity / 2) : table.capacity;
        
        // 2. Kontenery dla miejsc
        const leftColumn = document.createElement('div');
        leftColumn.className = isRect ? 'table-seats-column' : 'table-seats-row';
        leftColumn.style.gridColumn = isRect ? 1 : '1 / -1'; 

        const rightColumn = isRect ? document.createElement('div') : leftColumn; 
        if (isRect) {
            rightColumn.className = 'table-seats-column';
            rightColumn.style.gridColumn = 3; 
        }

        table.seats.forEach((seat, index) => {
<<<<<<< Updated upstream
            const seatDiv = document.createElement("div"); 
            seatDiv.id = `seat-${seat.id}`; 
            
            // ... (logika klas i zawartości miejsca bez zmian)
            let seatClass = "seat"; 
                if (seat.person_id) {
                    seatClass += " occupied";
                    // ZMIANA: Używamy stałych klas do kolorowania
                    if (seat.person_type === 'child') seatClass += " seat-child"; 
                    if (seat.person_type === 'guest1' || seat.person_type === 'guest2') seatClass += " seat-adult"; 
                }
                seatDiv.className = seatClass; 
            
            seatDiv.dataset.tableId = table.id; seatDiv.dataset.seatId = seat.id;
            seatDiv.ondragover = allowDrop; seatDiv.ondrop = dropOnSeat;

            if (seat.person_id) {
                const personName = seat.person_name || "Błąd"; 
                seatDiv.dataset.tooltip = personName; 
                seatDiv.draggable = true;
=======
            const seatDiv = document.createElement("div"); seatDiv.id = `seat-${seat.id}`; seatDiv.className = "seat"; seatDiv.dataset.tableId = table.id; seatDiv.dataset.seatId = seat.id;
            seatDiv.ondragover = allowDrop; seatDiv.ondrop = dropOnSeat;

            if (seat.person_id) {
                seatDiv.classList.add("occupied");
                const personName = seat.person_name || "Błąd"; seatDiv.textContent = personName ? personName.split(" ")[0] : "Błąd"; seatDiv.dataset.tooltip = personName; seatDiv.draggable = true;
>>>>>>> Stashed changes
                
                let shortName;
                if (seat.person_type === 'child') {
                    const namePart = personName.split(" ")[0];
                    const agePart = personName.match(/\(\d+l\)/) ? personName.match(/\(\d+l\)/)[0] : '';
                    shortName = namePart + agePart;
                } else { 
                    shortName = personName; 
                }
                
                seatDiv.textContent = shortName; 

                let personIdentifier;
                if (seat.person_type === 'guest1' || seat.person_type === 'guest2') {
                    const guestGroup = guests.find(g => g.id == seat.person_id);
                    if(guestGroup) personIdentifier = `person-${seat.person_type}-${guestGroup.id}`;
                } else { personIdentifier = `person-child-${seat.person_id}`; }
                seatDiv.dataset.personIdentifier = personIdentifier;

                seatDiv.ondragstart = (ev) => ev.dataTransfer.setData("text/plain", personIdentifier);
                seatDiv.ondblclick = () => unassignPersonFromSeat(seat.id, personName);
            }
            
            // DODANIE MIEJSCA DO WŁAŚCIWEJ KOLUMNY
            if (isRect) {
                if (index < halfway) {
                    leftColumn.appendChild(seatDiv);
                } else {
                    rightColumn.appendChild(seatDiv);
                }
            } else {
                leftColumn.appendChild(seatDiv); 
            }
            
            positionSeat(seatDiv, index, table.capacity, table.shape);
        });
<<<<<<< Updated upstream
        
        // 3. Wypełnienie pustej przestrzeni i dodanie kolumn do stołu
        if (isRect) {
             const leftCount = leftColumn.children.length;
             const rightCount = rightColumn.children.length;

             if (leftCount > rightCount) {
                 for (let i = rightCount; i < leftCount; i++) {
                     rightColumn.appendChild(document.createElement('div')).className = 'seat-spacer';
                 }
             } else if (rightCount > leftCount) {
                 for (let i = leftCount; i < rightCount; i++) {
                     leftColumn.appendChild(document.createElement('div')).className = 'seat-spacer';
                 }
             }

            tableDiv.appendChild(leftColumn);
            tableDiv.appendChild(rightColumn);
        } else {
            // Dla kół: tylko jeden kontener z miejscami
            tableDiv.appendChild(leftColumn);
        }

        const deleteButton = document.createElement("button"); 
        deleteButton.className = "remove-table-btn"; 
        deleteButton.textContent = "Usuń Stół"; 
        deleteButton.onclick = () => confirmRemoveTable(table.id);
        
        const clearButton = document.createElement("button"); 
        clearButton.className = "clear-table-btn"; 
        clearButton.textContent = "Wyczyść Usadzenie"; 
        clearButton.onclick = () => confirmClearTable(table.id, table.name);
        
        // ZMIANA: Układ przycisków
        wrapper.appendChild(tableDiv); 
        
        // Dodajemy kontener na przyciski, aby wycentrować je pod wąskim stołem
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '10px';
        
        clearButton.style.backgroundColor = '#6200EE'; // Nowy kolor dla Wyczyść (jak na obrazku)
        clearButton.style.color = 'white';
        clearButton.style.padding = '10px 20px';
        clearButton.style.borderRadius = '4px';

        deleteButton.style.backgroundColor = '#9c27b0'; // Nowy kolor dla Usuń (jak na obrazku)
        deleteButton.style.color = 'white';
        deleteButton.style.padding = '10px 20px';
        deleteButton.style.borderRadius = '4px';

        buttonContainer.appendChild(clearButton);
        buttonContainer.appendChild(deleteButton);
        
        wrapper.appendChild(buttonContainer);
        container.appendChild(wrapper);
=======
        const deleteButton = document.createElement("button"); deleteButton.className = "remove-table-btn"; deleteButton.textContent = "Usuń"; deleteButton.onclick = () => confirmRemoveTable(table.id);
        wrapper.appendChild(tableDiv); wrapper.appendChild(deleteButton); container.appendChild(wrapper);
>>>>>>> Stashed changes
    });
}

function confirmRemoveTable(tableId) {
    confirmAction('Czy na pewno chcesz usunąć ten stół?', async () => {
        const formData = new FormData(); formData.append('action', 'delete_table'); formData.append('table_id', tableId);
<<<<<<< Updated upstream
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll(); else alert(result.message);
    });
}

function confirmClearTable(tableId, tableName) {
    confirmAction(`Czy na pewno chcesz usunąć WSZYSTKICH gości ze stołu: ${tableName}?`, async () => {
        const formData = new FormData(); 
        formData.append('action', 'clear_table_seating'); 
        formData.append('table_id', tableId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll(); 
        else alert(result.message);
=======
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll(); else alert(result.message);
>>>>>>> Stashed changes
    });
}


function positionSeat(seatDiv, index, capacity, shape) {
<<<<<<< Updated upstream
    // FUNKCJA ZASLEPKA: Flexbox w CSS obsługuje teraz układ, 
    // aby zachować czytelność długich nazw.
=======
    const seatSize = 70; const seatOffset = `-${seatSize / 2}px`;
    if (shape === "round") {
        const angle = (index / capacity) * 2 * Math.PI; const radius = 160; 
        const translateX = Math.cos(angle) * radius - (seatSize / 2); const translateY = Math.sin(angle) * radius - (seatSize / 2);
        seatDiv.style.transform = `translate(${translateX}px, ${translateY}px)`;
    } else {
        const seatsOnTop = Math.ceil(capacity / 2); const seatsOnBottom = capacity - seatsOnTop; const side = index < seatsOnTop ? "top" : "bottom";
        if (side === "top") {
            const posOnSide = index; seatDiv.style.left = `${(100 / (seatsOnTop + 1)) * (posOnSide + 1)}%`; seatDiv.style.top = seatOffset;
        } else {
            const posOnSide = index - seatsOnTop; seatDiv.style.left = `${(100 / (seatsOnBottom + 1)) * (posOnSide + 1)}%`; seatDiv.style.bottom = seatOffset;
        }
        seatDiv.style.transform = 'translateX(-50%)';
    }
>>>>>>> Stashed changes
}

function renderUnassignedGuests() {
    const pool = document.getElementById("unassigned-guests");
    // Guard Clause:
    if (!pool) return;
    pool.innerHTML = "<h3>Goście do usadzenia</h3>";
    const assignedPeopleIds = new Set(tables.flatMap(t => t.seats.filter(s => s.person_id).map(s => `${s.person_type}-${s.person_id}`)));
    
<<<<<<< Updated upstream
    // ZMIANA: Filtr musi być teraz na 'rsvp_status' === 'confirmed'
    guests.filter(g => g.rsvp_status === 'confirmed' && (parseInt(g.confirmed_adults) > 0 || parseInt(g.confirmed_children) > 0)).forEach(family => {
        
        const confirmedAdults = parseInt(family.confirmed_adults) || 0;
        const confirmedChildren = parseInt(family.confirmed_children) || 0;
        
        // UWAGA: Nie możemy użyć prostego: if (confirmedAdults > 0) pool.appendChild(createDraggablePerson(...));
        // ponieważ nie wiemy, który z nich to guest1, a który guest2.
        // Dla uproszczenia, zakładamy, że jeśli potwierdzono 1 dorosłego, jest to GUEST1, jeśli 2, to GUEST1 i GUEST2.
        
        if (confirmedAdults > 0 && family.guest1_name && !assignedPeopleIds.has(`guest1-${family.id}`)) { 
            pool.appendChild(createDraggablePerson(family.id, "guest1", family.guest1_name)); 
        }
        if (confirmedAdults > 1 && family.guest2_name && !assignedPeopleIds.has(`guest2-${family.id}`)) { 
            pool.appendChild(createDraggablePerson(family.id, "guest2", family.guest2_name)); 
        }
        
        // ZMIANA: Logika dla dzieci (skoro jest confirmed_children, usadzamy wszystkie dzieci)
        // Dzieci są usadzane, jeśli liczba potwierdzonych dzieci jest > 0
        if (confirmedChildren > 0 && family.children) {
            family.children.forEach((child) => {
                if (!assignedPeopleIds.has(`child-${child.id}`)) { 
                    pool.appendChild(createDraggablePerson(child.id, `child`, child.child_name)); 
                }
=======
    guests.filter(g => parseInt(g.confirmed) === 1).forEach(family => {
        if (family.guest1_name && !assignedPeopleIds.has(`guest1-${family.id}`)) { pool.appendChild(createDraggablePerson(family.id, "guest1", family.guest1_name)); }
        if (family.guest2_name && !assignedPeopleIds.has(`guest2-${family.id}`)) { pool.appendChild(createDraggablePerson(family.id, "guest2", family.guest2_name)); }
        if (family.children) {
            family.children.forEach((child) => {
                if (!assignedPeopleIds.has(`child-${child.id}`)) { pool.appendChild(createDraggablePerson(child.id, `child`, child.child_name)); }
>>>>>>> Stashed changes
            });
        }
    });
}

function createDraggablePerson(personId, personType, name) {
    const div = document.createElement("div"); div.id = `person-${personType}-${personId}`; div.className = "guest-item"; div.draggable = true; div.ondragstart = drag; div.textContent = name; return div;
}
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text/plain", ev.target.id); }

async function dropOnSeat(ev) {
    ev.preventDefault();
    const draggedPersonIdentifier = ev.dataTransfer.getData("text/plain"); const targetSeatDiv = ev.currentTarget; const targetSeatId = targetSeatDiv.dataset.seatId;
    const sourceSeatDiv = document.querySelector(`[data-person-identifier="${draggedPersonIdentifier}"]`); const oldSeatId = sourceSeatDiv ? sourceSeatDiv.dataset.seatId : 0;
    if (targetSeatId === oldSeatId) return;

    const formData = new FormData(); formData.append('action', 'assign_person'); formData.append('seat_id', targetSeatId); formData.append('dragged_person_id', draggedPersonIdentifier);
    if (oldSeatId) formData.append('old_seat_id', oldSeatId);
    
    const response = await fetch('index.php', { method: 'POST', body: formData });
    const result = await response.json();
    if(result.success) await renderAll(); else alert(result.message);
}

async function dropOnPool(ev) {
    ev.preventDefault();
    const draggedPersonIdentifier = ev.dataTransfer.getData("text/plain");
    const sourceSeatDiv = document.querySelector(`[data-person-identifier="${draggedPersonIdentifier}"]`);
    if (sourceSeatDiv) {
        const seatId = sourceSeatDiv.dataset.seatId;
        const formData = new FormData(); formData.append('action', 'unassign_person'); formData.append('seat_id', seatId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) await renderAll(); else alert(result.message);
    }
}

function unassignPersonFromSeat(seatId, personName) {
    confirmAction(`Czy na pewno chcesz usunąć "${personName}" z tego miejsca?`, async () => {
        const formData = new FormData(); formData.append('action', 'unassign_person'); formData.append('seat_id', seatId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) await renderAll(); else alert(result.message);
    });
}

function openModal(modalId, recordId) {
    if (modalId === "edit-guest-modal") {
<<<<<<< Updated upstream
        const guest = guests.find(g => g.id == recordId); 
        if (!guest) return;
        
        // ZABEZPIECZAMY WSZYSTKIE POBRANIA ELEMENTÓW DLA GOŚCI
        const guestIdEl = document.getElementById("editGuestId");
        if(guestIdEl) guestIdEl.value = guest.id; 

        const guest1NameEl = document.getElementById("editGuest1Name");
        if(guest1NameEl) guest1NameEl.value = guest.guest1_name; 

        const guest2NameEl = document.getElementById("editGuest2Name");
        if(guest2NameEl) guest2NameEl.value = guest.guest2_name;
        
        const childrenContainer = document.getElementById("edit-children-inputs"); 
        if(childrenContainer) childrenContainer.innerHTML = "";
        
=======
        const guest = guests.find(g => g.id == recordId); if (!guest) return;
        document.getElementById("editGuestId").value = guest.id; document.getElementById("editGuest1Name").value = guest.guest1_name; document.getElementById("editGuest2Name").value = guest.guest2_name;
        const childrenContainer = document.getElementById("edit-children-inputs"); childrenContainer.innerHTML = "";
>>>>>>> Stashed changes
        if(guest.children) {
            guest.children.forEach(child => {
                const div = document.createElement("div"); const namePrefix = 'editChild';
                div.innerHTML = `<input type="text" value="${child.child_name}" name="${namePrefix}Name[]"><input type="number" value="${child.age}" min="0" name="${namePrefix}Age[]"><button type="button" class="remove-child-btn" onclick="this.parentElement.remove()">X</button>`;
                if(childrenContainer) childrenContainer.appendChild(div);
            });
        }
    } else if (modalId === "edit-vendor-modal") {
<<<<<<< Updated upstream
        const vendor = vendors.find(v => v.id == recordId); 
        if (!vendor) return;
        
        // ZABEZPIECZAMY WSZYSTKIE POBRANIA ELEMENTÓW DLA DOSTAWCÓW
        const vendorIdEl = document.getElementById("editVendorId");
        if (vendorIdEl) vendorIdEl.value = vendor.id;

        const vendorNameEl = document.getElementById("editVendorName");
        if (vendorNameEl) vendorNameEl.value = vendor.name;

        const vendorCostEl = document.getElementById("editVendorCost");
        if (vendorCostEl) vendorCostEl.value = vendor.cost;

        const paymentDateEl = document.getElementById("editVendorPaymentDate");
        if (paymentDateEl) paymentDateEl.value = vendor.payment_date;

=======
        const vendor = vendors.find(v => v.id == recordId); if (!vendor) return;
        document.getElementById("editVendorId").value = vendor.id; document.getElementById("editVendorName").value = vendor.name; document.getElementById("editVendorCost").value = vendor.cost;
        document.getElementById("editVendorDeposit").value = vendor.deposit; document.getElementById("editVendorPaymentDate").value = vendor.payment_date; document.getElementById("editVendorPaidFull").checked = parseInt(vendor.paid_full) === 1;
>>>>>>> Stashed changes
    }
    // Upewnij się, że element modalny istnieje
    const modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

function renderUsers() {
    const userList = document.getElementById('userList'); if (!userList) return;
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li'); li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems = 'center'; li.style.padding = '10px'; li.style.borderBottom = '1px solid #eee';
        let permissionText = 'Podgląd'; if (user.permission_level === 'editor') permissionText = 'Edycja'; if (user.permission_level === 'owner') permissionText = 'Właściciel';
        let actionsHtml = '';
        if (user.permission_level !== 'owner') {
            actionsHtml = `<div style="display: flex; gap: 5px;"><button type="button" class="secondary" style="padding: 5px 10px;" onclick="updateUserPermission(${user.id}, '${user.permission_level}')">Zmień</button><button type="button" class="secondary" style="background: #e53935; padding: 5px 10px;" onclick="removeUserAccess(${user.id}, '${user.email}')">Usuń</button></div>`;
        }
        li.innerHTML = `<span><strong>${user.email}</strong> - <span style="font-style: italic;">${permissionText}</span></span>${actionsHtml}`;
        userList.appendChild(li);
    });
}

function updateUserPermission(userId, currentLevel) {
    const newLevel = prompt(`Wybierz nowy poziom uprawnień (wpisz 'editor' lub 'viewer'):`, currentLevel);
    if (newLevel && (newLevel === 'editor' || newLevel === 'viewer')) {
        const formData = new FormData(); formData.append('action', 'update_user_permission'); formData.append('user_id', userId); formData.append('permission_level', newLevel);
        fetch('index.php', { method: 'POST', body: formData }).then(res => res.json()).then(result => { if (result.success) renderAll(); else alert(result.message || "Wystąpił błąd."); });
    } else if (newLevel !== null) { alert("Wprowadzono nieprawidłową wartość. Dozwolone: 'editor' lub 'viewer'."); }
}

function removeUserAccess(userId, userEmail) {
    if (confirm(`Czy na pewno chcesz usunąć dostęp dla użytkownika ${userEmail}?`)) {
        const formData = new FormData(); formData.append('action', 'remove_user_access'); formData.append('user_id', userId);
        fetch('index.php', { method: 'POST', body: formData }).then(res => res.json()).then(result => { if (result.success) renderAll(); else alert(result.message || "Wystąpił błąd."); });
    }
}

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
function exportToPDF() {
    if (typeof jsPDF === 'undefined' || typeof jsPDF.API.autoTable === 'undefined') { alert('Biblioteka PDF nie jest jeszcze gotowa.'); return; }
    const { jsPDF: JSPDF } = window; const doc = new JSPDF(); const weddingDate = document.getElementById("weddingDate").value || "Nie ustawiono";
    doc.setFontSize(18); doc.text(`Raport Slubny - Data: ${weddingDate}`, 14, 22);
    const guestBody = [];
    guests.forEach(g => {
        const isConfirmed = parseInt(g.confirmed) === 1; const needsAccommodation = parseInt(g.accommodation) > 0;
        if (g.guest1_name) guestBody.push([g.guest1_name, "Dorosly", isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]);
        if (g.guest2_name) guestBody.push([g.guest2_name, "Dorosly", isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]);
        if (g.children) { g.children.forEach(c => guestBody.push([c.child_name, `Dziecko (${c.age} lat)`, isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]));}
    });
    doc.autoTable({ head: [["Imie i Nazwisko", "Typ", "Obecnosc", "Nocleg"]], body: guestBody, startY: 30, headStyles: { fillColor: [74, 20, 140] } });
<<<<<<< Updated upstream
    
    // ZMIANA: Eksport budżetu z nowymi danymi
    const vendorBody = vendors.map(v => [ 
        v.name, 
        parseFloat(v.cost).toFixed(2), 
        (parseFloat(v.total_paid) || 0).toFixed(2), // ZMIANA: Użycie total_paid
        parseInt(v.paid_full_status) === 1 ? "Tak" : "Nie", // ZMIANA: Użycie paid_full_status
        v.payment_date || '-'
    ]);
    doc.autoTable({ head: [["Usluga", "Koszt (PLN)", "Zapłacono (PLN)", "Opłacone w całości", "Termin"]], body: vendorBody, startY: doc.autoTable.previous.finalY + 10, headStyles: { fillColor: [74, 20, 140] } });
    
=======
    const vendorBody = vendors.map(v => [ v.name, parseFloat(v.cost).toFixed(2), parseFloat(v.deposit).toFixed(2), parseInt(v.paid_full) === 1 ? "Tak" : "Nie" ]);
    doc.autoTable({ head: [["Usluga", "Koszt (PLN)", "Zaliczka (PLN)", "Oplacone"]], body: vendorBody, startY: doc.autoTable.previous.finalY + 10, headStyles: { fillColor: [74, 20, 140] } });
>>>>>>> Stashed changes
    const seatingBody = [];
    tables.forEach(table => {
        seatingBody.push([{ content: `${table.name} (${table.shape}, ${table.capacity} os.)`, colSpan: 2, styles: { fontStyle: "bold", fillColor: "#f3e5f5" } }]);
        table.seats.forEach((seat, seatIndex) => { let personName = seat.person_name || "Wolne"; seatingBody.push([`Miejsce ${seatIndex + 1}`, personName]); });
    });
    doc.autoTable({ head: [["Miejsce na Stole", "Gosc"]], body: seatingBody, startY: doc.autoTable.previous.finalY + 10, headStyles: { fillColor: [74, 20, 140] } });
    doc.save("Raport_Slubny.pdf");
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') { alert('Biblioteka Excel nie została jeszcze załadowana.'); return; }
    const guestData = [];
    guests.forEach(g => {
        const isConfirmed = parseInt(g.confirmed) === 1; const groupName = [g.guest1_name, g.guest2_name].filter(Boolean).join(" & ");
        if (g.guest1_name) guestData.push({ Grupa: groupName, Imię: g.guest1_name, Typ: "Dorosły", Potwierdzenie: isConfirmed ? "Tak" : "Nie", Nocleg_osoby: parseInt(g.accommodation) });
        if (g.guest2_name) guestData.push({ Grupa: groupName, Imię: g.guest2_name, Typ: "Dorosły", Potwierdzenie: isConfirmed ? "Tak" : "Nie", Nocleg_osoby: parseInt(g.accommodation) });
        if (g.children) { g.children.forEach(c => guestData.push({ Grupa: groupName, Imię: c.child_name, Typ: `Dziecko (${c.age} lat)`, Potwierdzenie: isConfirmed ? "Tak" : "Nie", Nocleg_osoby: parseInt(g.accommodation) })); }
    });
    const guestWS = XLSX.utils.json_to_sheet(guestData);
<<<<<<< Updated upstream
    
    // ZMIANA: Eksport budżetu z nowymi danymi
    const budgetData = vendors.map(v => ({ 
        'Usługa': v.name, 
        'Koszt (PLN)': parseFloat(v.cost), 
        'Zapłacono (PLN)': parseFloat(v.total_paid) || 0, // ZMIANA: Użycie total_paid
        'Opłacone w całości': parseInt(v.paid_full_status) === 1 ? 'Tak' : 'Nie', // ZMIANA: Użycie paid_full_status
        'Termin końcowej płatności': v.payment_date 
    }));
    const budgetWS = XLSX.utils.json_to_sheet(budgetData);
    
=======
    const budgetData = vendors.map(v => ({ 'Usługa': v.name, 'Koszt (PLN)': parseFloat(v.cost), 'Zaliczka (PLN)': parseFloat(v.deposit), 'Opłacone w całości': parseInt(v.paid_full) === 1 ? 'Tak' : 'Nie', 'Termin płatności': v.payment_date }));
    const budgetWS = XLSX.utils.json_to_sheet(budgetData);
>>>>>>> Stashed changes
    const seatingData = [];
    tables.forEach(table => {
        seatingData.push({ "Stół / Miejsce": table.name, "Gość": `(${table.shape}, ${table.capacity} miejsc)` });
        table.seats.forEach((seat, seatIndex) => { let personName = seat.person_name || "Wolne"; seatingData.push({ "Stół / Miejsce": `Miejsce ${seatIndex + 1}`, "Gość": personName }); });
        seatingData.push({});
    });
    const seatingWS = XLSX.utils.json_to_sheet(seatingData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, guestWS, "Lista Gości"); XLSX.utils.book_append_sheet(wb, budgetWS, "Budżet - Usługodawcy"); XLSX.utils.book_append_sheet(wb, seatingWS, "Plan Stołów");
    XLSX.writeFile(wb, "Organizer_Slubny_Raport.xlsx");
}

function exportDataToFile() {
    const stateData = { meta: { version: "2.0-db", savedAt: new Date().toISOString() }, data: { tasks, guests, vendors, tables, settings: { wedding_date: document.getElementById('weddingDate').value, price_adult: document.getElementById('priceAdult').value, price_child_older: document.getElementById('priceChildOlder').value, price_child_younger: document.getElementById('priceChildYounger').value, accommodation: document.getElementById('priceAccommodation').value, } } };
    const blob = new Blob([JSON.stringify(stateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `organizer_dane_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}

function importDataFromFile(event) {
    alert("Importowanie danych z pliku wymaga zaawansowanej logiki po stronie serwera i nie jest w pełni zaimplementowane w tej wersji.");
    event.target.value = '';
}
<<<<<<< Updated upstream
=======

function renderBudgetItems() {
  const list = document.getElementById('budgetItemsList');
  if (!list) return;
  list.innerHTML = '';
  budgetItems.forEach(it => {
    const li = document.createElement('li');
    li.className = 'price-item';
    li.innerHTML = `
      <span><strong>${it.label}</strong> — ${parseFloat(it.unit_price).toFixed(2)} PLN / dorosły</span>
      <div>
        <button type="button" class="secondary" onclick="confirmRemoveBudgetItem(${it.id})">Usuń</button>
      </div>`;
    list.appendChild(li);
  });
}

async function confirmRemoveBudgetItem(id) {
  confirmAction('Usunąć tę pozycję cennika?', async () => {
    const fd = new FormData();
    fd.append('action', 'delete_budget_item');
    fd.append('id', id);
    const res = await fetch('index.php', { method: 'POST', body: fd });
    const out = await res.json();
    if (out.success) await renderAll(); else alert(out.message || 'Błąd usuwania');
  });
}
>>>>>>> Stashed changes
