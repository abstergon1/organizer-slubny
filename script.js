// --- GLOBALNE ZMIENNE STANU ---
let tasks = [], guests = [], vendors = [], tables = [];
let currentDate = new Date();
let countdownInterval;
let guestFilterState = 'all';

// --- INICJALIZACJA APLIKACJI ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    showPage('dashboard');
    loadInitialData();
});

// --- FUNKCJE POMOCNICZE API ---
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`api/${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Błąd serwera');
        }
        return await response.json();
    } catch (error) {
        console.error(`Błąd API (${endpoint}):`, error);
        alert(`Wystąpił błąd: ${error.message}`);
        return null;
    }
}

async function loadInitialData() {
    const state = await apiCall('get_data.php');
    if (state && state.data) {
        tasks = state.data.tasks.map(t => ({...t, completed: !!t.completed, isPaymentTask: !!t.isPaymentTask})) || []; 
        guests = state.data.guests.map(g => ({...g, confirmed: !!g.confirmed})) || []; 
        vendors = state.data.vendors.map(v => ({...v, paid_full: !!v.paid_full})) || []; // Nazwa kolumny w SQL
        tables = state.data.tables || [];
        
        if (state.data.weddingDate) document.getElementById('weddingDate').value = state.data.weddingDate;
        if(state.data.prices) {
            document.getElementById('priceAdult').value = state.data.prices.adult;
            document.getElementById('priceChildOlder').value = state.data.prices.childOlder;
            document.getElementById('priceChildYounger').value = state.data.prices.childYounger;
            document.getElementById('priceAccommodation').value = state.data.prices.accommodation;
        }
        renderAll();
        setupCountdown();
    }
}

function renderAll() {
    renderTasks(); renderCalendar();
    renderGuests();
    renderVendors();
    updateBudget();
    renderTables(); renderUnassignedGuests();
}

function confirmAction(message, onConfirm) {
    if (confirm(message)) onConfirm();
}

// --- NAWIGACJA ---
function setupNavigation() {
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => { showPage(button.dataset.page); });
    });
}
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });
}

// --- PULPIT ---
function setupCountdown() {
    const weddingDateInput = document.getElementById('weddingDate');
    if (weddingDateInput.value) startCountdown(weddingDateInput.value);
}

async function saveSettings() {
    const payload = {
        weddingDate: document.getElementById('weddingDate').value,
        prices: {
            adult: document.getElementById('priceAdult').value,
            childOlder: document.getElementById('priceChildOlder').value,
            childYounger: document.getElementById('priceChildYounger').value,
            accommodation: document.getElementById('priceAccommodation').value,
        }
    };
    const result = await apiCall('update_settings.php', 'POST', payload);
    if (result && result.success) {
        alert("Ustawienia zostały zapisane.");
        startCountdown(payload.weddingDate);
        updateBudget();
    }
}

function startCountdown(date) {
    if (countdownInterval) clearInterval(countdownInterval);
    const countdownElement = document.getElementById('countdown');
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

// --- ZADANIA i KALENDARZ ---
async function addTask() {
    const name = document.getElementById('taskName').value, date = document.getElementById('taskDate').value, owner = document.getElementById('taskOwner').value;
    if (!name || !date) return alert("Nazwa zadania i data są wymagane!");
    
    const result = await apiCall('add_task.php', 'POST', { name, date, owner });
    if (result && result.success) {
        document.getElementById('taskName').value = ''; document.getElementById('taskDate').value = ''; document.getElementById('taskOwner').value = '';
        loadInitialData();
    }
}
function confirmToggleTask(id, checkbox) {
    const task = tasks.find(t => t.id === id);
    confirmAction(`Oznaczyć zadanie "${task.name}" jako ${checkbox.checked ? 'ukończone' : 'nieukończone'}?`, async () => {
        const payload = { 
            id: id, 
            completed: checkbox.checked,
            completionDate: checkbox.checked ? new Date().toISOString().split('T')[0] : null
        };
        const result = await apiCall('update_task.php', 'POST', payload);
        if (result && result.success) loadInitialData();
        else checkbox.checked = !checkbox.checked;
    });
}
function confirmRemoveTask(id) {
    const task = tasks.find(t => t.id === id);
    confirmAction(`Usunąć zadanie "${task.name}"?`, async () => {
        const result = await apiCall('delete_task.php', 'POST', { id });
        if (result && result.success) loadInitialData();
    });
}
function renderTasks() {
    const list = document.getElementById('taskList'); list.innerHTML = '';
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        const paymentIcon = task.isPaymentTask ? '💰 ' : '';
        li.innerHTML = `<input type="checkbox" ${task.completed ? 'checked' : ''} onchange="confirmToggleTask(${task.id}, this)"><span>${paymentIcon}<strong>${task.name}</strong> (do ${task.date}) - Odp: ${task.owner || 'brak'}${task.completed ? ` | Zrealizowano: ${task.completionDate}` : ''}</span><button onclick="confirmRemoveTask(${task.id})">Usuń</button>`;
        list.appendChild(li);
    });
}
function renderCalendar() { /* Bez zmian */ }
function nextMonth() { /* Bez zmian */ }
function previousMonth() { /* Bez zmian */ }

// --- GOŚCIE ---
function addChildInput(mode = 'add') { /* Bez zmian */ }

async function addGuest() {
    const guest1 = document.getElementById('guest1Name').value, guest2 = document.getElementById('guest2Name').value;
    if (!guest1 && !guest2) return alert("Przynajmniej jedno imię gościa jest wymagane!");
    const children = Array.from(document.getElementById('children-inputs').querySelectorAll('div')).map(div => ({name: div.children[0].value, age: parseInt(div.children[1].value) || 0})).filter(c => c.name);
    
    const result = await apiCall('add_guest.php', 'POST', { guest1, guest2, children });
    if (result && result.success) {
        document.getElementById('guest1Name').value = ''; document.getElementById('guest2Name').value = '';
        document.getElementById('children-inputs').innerHTML = `<div><input type="text" placeholder="Imię dziecka"><input type="number" placeholder="Wiek" min="0"></div>`;
        loadInitialData();
    }
}
function filterGuests(status) { /* Bez zmian */ }
function renderGuests() {
    const tableBody = document.querySelector('#guestTable tbody'), tableFoot = document.querySelector('#guestTable tfoot');
    tableBody.innerHTML = ''; tableFoot.innerHTML = '';
    let filteredGuests = guests.filter(g => guestFilterState === 'all' || (guestFilterState === 'confirmed' && g.confirmed) || (guestFilterState === 'unconfirmed' && !g.confirmed));
    let totalAdults = 0, totalChildren = 0, totalAccommodationPeople = 0;
    filteredGuests.forEach(guest => {
        let desc = [guest.guest1, guest.guest2].filter(Boolean).join(' & ');
        if(guest.children.length > 0) desc += ` z dziećmi: ${guest.children.map(c => `${c.name} (${c.age}l)`).join(', ')}`;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${desc}</td><td><input type="checkbox" ${guest.confirmed ? 'checked' : ''} onchange="confirmGuestUpdate(${guest.id}, 'confirmed', this)"></td><td><input type="number" value="${guest.accommodation}" min="0" onchange="confirmGuestUpdate(${guest.id}, 'accommodation', this)"></td><td><button onclick="openModal('edit-guest-modal', ${guest.id})">Edytuj</button><button class="secondary" onclick="confirmRemoveGuest(${guest.id})">Usuń</button></td>`;
        tableBody.appendChild(row);
        if(guest.guest1) totalAdults++; if(guest.guest2) totalAdults++; totalChildren += guest.children.length;
        totalAccommodationPeople += Number(guest.accommodation) || 0;
    });
    tableFoot.innerHTML = `<tr><td><strong>SUMA:</strong> ${totalAdults + totalChildren} osób (Dorośli: ${totalAdults}, Dzieci: ${totalChildren})</td><td>-</td><td>${totalAccommodationPeople} osób (nocleg)</td><td>-</td></tr>`;
    updateBudget(); 
    renderUnassignedGuests();
}
function confirmGuestUpdate(guestId, key, el) {
    const value = el.type === 'checkbox' ? el.checked : parseInt(el.value);
    const guest = guests.find(g => g.id === guestId);
    guest[key] = value;
    saveGuestChanges(guest); // Wywołujemy pełen zapis
}
function confirmRemoveGuest(guestId) {
    const guest = guests.find(g => g.id === guestId);
    confirmAction(`Usunąć grupę gości: ${[guest.guest1, guest.guest2].filter(Boolean).join(' & ')}?`, async () => {
        const result = await apiCall('delete_guest.php', 'POST', { id: guestId });
        if (result && result.success) loadInitialData();
    });
}
async function saveGuestChanges(guestToSave = null) {
    let guest;
    if (guestToSave) {
        guest = guestToSave;
    } else {
        const guestId = parseInt(document.getElementById('editGuestId').value);
        guest = guests.find(g => g.id === guestId);
        if (!guest) return;
        guest.guest1 = document.getElementById('editGuest1Name').value; 
        guest.guest2 = document.getElementById('editGuest2Name').value;
        guest.children = Array.from(document.getElementById('edit-children-inputs').querySelectorAll('div')).map(div => ({name: div.children[0].value, age: parseInt(div.children[1].value) || 0})).filter(c => c.name);
    }
    const result = await apiCall('update_guest.php', 'POST', guest);
    if(result && result.success) {
        if (!guestToSave) closeModal('edit-guest-modal');
        loadInitialData();
    }
}

// --- BUDŻET ---
async function addVendor() {
    const payload = {
        name: document.getElementById('vendorName').value,
        cost: parseFloat(document.getElementById('vendorCost').value) || 0,
        deposit: parseFloat(document.getElementById('vendorDeposit').value) || 0,
        paidFull: document.getElementById('vendorPaidFull').checked,
        paymentDate: document.getElementById('vendorPaymentDate').value
    };
    if (!payload.name || !payload.cost) return alert("Nazwa usługi i koszt są wymagane!");
    const result = await apiCall('add_vendor.php', 'POST', payload);
    if(result && result.success) {
        ['vendorName', 'vendorCost', 'vendorDeposit', 'vendorPaymentDate'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('vendorPaidFull').checked = false;
        loadInitialData();
    }
}
function renderVendors() {
    const list = document.getElementById("vendorList"); list.innerHTML = "";
    vendors.forEach(vendor => {
        const li = document.createElement("li");
        const remaining = vendor.cost - (vendor.paid_full ? vendor.cost : vendor.deposit);
        const dateInfo = vendor.payment_date ? `<small class="date-info">Termin płatności: ${vendor.payment_date}</small>` : "";
        li.innerHTML = `<div class="vendor-details"><span><strong>${vendor.name}:</strong> ${Number(vendor.cost).toFixed(2)} PLN (Pozostało: ${remaining.toFixed(2)} PLN)</span>${dateInfo}</div><div><button onclick="openModal('edit-vendor-modal', ${vendor.id})">Edytuj</button><button class="secondary" onclick="confirmRemoveVendor(${vendor.id})">Usuń</button></div>`;
        list.appendChild(li);
    });
    updateBudget();
}
function confirmRemoveVendor(vendorId) {
    const vendor = vendors.find(v => v.id === vendorId);
    confirmAction(`Usunąć koszt: ${vendor.name}?`, async () => { 
        const result = await apiCall('delete_vendor.php', 'POST', { id: vendorId });
        if(result && result.success) loadInitialData();
    });
}
function updateBudget() { /* Logika bez zmian, ale odczytuje dane z globalnych zmiennych */ }
async function saveVendorChanges() {
    const vendorId = parseInt(document.getElementById('editVendorId').value);
    const payload = {
        id: vendorId,
        name: document.getElementById('editVendorName').value,
        cost: parseFloat(document.getElementById('editVendorCost').value) || 0,
        deposit: parseFloat(document.getElementById('editVendorDeposit').value) || 0,
        paymentDate: document.getElementById('editVendorPaymentDate').value,
        paidFull: document.getElementById('editVendorPaidFull').checked,
    };
    const result = await apiCall('update_vendor.php', 'POST', payload);
    if(result && result.success) {
        closeModal('edit-vendor-modal');
        loadInitialData();
    }
}

// --- PLAN STOŁÓW ---
async function addTable() {
    const name = document.getElementById('tableName').value || `Stół #${tables.length + 1}`;
    const capacity = parseInt(document.getElementById('tableCapacity').value);
    const shape = document.getElementById('tableShape').value;
    if(!capacity || capacity <= 0) { alert("Podaj prawidłową liczbę miejsc."); return; }
    const result = await apiCall('add_table.php', 'POST', { name, capacity, shape });
    if(result && result.success) {
        document.getElementById('tableName').value = '';
        document.getElementById('tableCapacity').value = '';
        loadInitialData();
    }
}
function confirmRemoveTable(tableId) {
    confirmAction('Czy na pewno chcesz usunąć ten stół?', async () => {
        const result = await apiCall('delete_table.php', 'POST', { id: tableId });
        if(result && result.success) loadInitialData();
    });
}
function renderTables() { /* Funkcja bez zmian */ }
function positionSeat(seatDiv, index, capacity, shape) { /* Bez zmian */ }
function renderUnassignedGuests() { /* Bez zmian */ }
function createDraggablePerson(familyId, personKey, name) { /* Bez zmian */ }
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text/plain", ev.target.id); }

async function dropOnSeat(ev) {
    ev.preventDefault();
    const draggedPersonId = ev.dataTransfer.getData("text/plain");
    const targetSeatDiv = ev.currentTarget;
    const targetSeatId = parseInt(targetSeatDiv.id.replace('seat-', ''));
    
    let sourceSeatId = null;
    tables.forEach(table => {
        const foundSeat = table.seats.find(s => s.person_id === draggedPersonId);
        if (foundSeat) sourceSeatId = foundSeat.id;
    });

    const targetTable = tables.find(t => t.seats.some(s => s.id === targetSeatId));
    const targetSeat = targetTable.seats.find(s => s.id === targetSeatId);
    const personOnTargetSeatId = targetSeat.person_id;

    if (draggedPersonId === personOnTargetSeatId) return;

    const payload = { draggedPersonId, targetSeatId, personOnTargetSeatId, sourceSeatId };
    const result = await apiCall('update_seat.php', 'POST', payload);
    if(result && result.success) loadInitialData();
}

async function dropOnPool(ev) {
    ev.preventDefault();
    const personId = ev.dataTransfer.getData("text/plain");
    // To jest operacja odwrotna do dropOnSeat - ustawiamy personId na null dla miejsca, gdzie był ten gość
    let sourceSeatId = null;
    tables.forEach(table => {
        const foundSeat = table.seats.find(s => s.person_id === personId);
        if (foundSeat) sourceSeatId = foundSeat.id;
    });

    if (sourceSeatId) {
        // Wykorzystujemy ten sam endpoint, ale z pustym draggedPersonId
        const payload = { draggedPersonId: null, targetSeatId: sourceSeatId, personOnTargetSeatId: personId, sourceSeatId: null };
        const result = await apiCall('update_seat.php', 'POST', payload);
        if (result && result.success) loadInitialData();
    }
}
function unassignPersonFromSeat(personId, personName) {
    confirmAction(`Czy na pewno chcesz usunąć "${personName}" z tego miejsca?`, () => {
        const mockEvent = { preventDefault: () => {}, dataTransfer: { getData: () => personId }};
        dropOnPool(mockEvent);
    });
}

// --- MODALE ---
function openModal(modalId, recordId) { /* Logika bez zmian, ale dane z globalnych zmiennych */ }
function closeModal(modalId) { /* Bez zmian */ }

// --- EKSPORT ---
// Funkcje exportToPDF i exportToExcel pozostają bez zmian, bo operują na danych już załadowanych do przeglądarki.
function exportToPDF() { /* Bez zmian */ }
function exportToExcel() { /* Bez zmian */ }