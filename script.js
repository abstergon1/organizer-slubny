// --- GLOBALNE ZMIENNE STANU ---
let tasks = [], guests = [], vendors = [], tables = [];
let currentDate = new Date();
let countdownInterval;
let guestFilterState = 'all';
let isDataDirty = false; // Flaga do śledzenia niezapisanych zmian

// --- INICJALIZACJA APLIKACJI ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    showPage('dashboard');
    checkForLocalData();
    setupBeforeUnloadListener();
});

// --- NAWIGACJA I GŁÓWNE FUNKCJE ---
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

// --- ZARZĄDZANIE STANEM (ZAPIS/ODCZYT) ---
function setDataDirty(isDirty = true) {
    isDataDirty = isDirty;
}

function saveState(showAlert = false) {
    const stateData = {
        meta: {
            version: 1,
            savedAt: new Date().toISOString()
        },
        data: {
            tasks, guests, vendors, tables,
            weddingDate: document.getElementById('weddingDate').value,
            prices: {
                adult: document.getElementById('priceAdult').value,
                childOlder: document.getElementById('priceChildOlder').value,
                childYounger: document.getElementById('priceChildYounger').value,
                accommodation: document.getElementById('priceAccommodation').value,
            }
        }
    };
    localStorage.setItem('weddingOrganizerState', JSON.stringify(stateData));
    setDataDirty(false); // Resetujemy flagę po zapisie
    if (showAlert) {
        alert("Dane zostały zapisane w przeglądarce!");
    }
}

function loadState(state) {
    if (state && state.data) {
        tasks = state.data.tasks || []; 
        guests = state.data.guests || []; 
        vendors = state.data.vendors || []; 
        tables = state.data.tables || [];
        if (state.data.weddingDate) document.getElementById('weddingDate').value = state.data.weddingDate;
        if(state.data.prices) {
            document.getElementById('priceAdult').value = state.data.prices.adult;
            document.getElementById('priceChildOlder').value = state.data.prices.childOlder;
            document.getElementById('priceChildYounger').value = state.data.prices.childYounger;
            document.getElementById('priceAccommodation').value = state.data.prices.accommodation;
        }
        setDataDirty(false); // Po wczytaniu dane są "czyste"
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
function confirmAction(message, onConfirm, onCancel) {
    if (confirm(message)) onConfirm();
    else if (onCancel) onCancel();
}
function setupBeforeUnloadListener() {
    window.addEventListener('beforeunload', (e) => {
        if (isDataDirty) {
            e.preventDefault();
            e.returnValue = ''; // Wymagane przez niektóre przeglądarki
            return ''; // Standard
        }
    });
}
function checkForLocalData() {
    const localStateJSON = localStorage.getItem('weddingOrganizerState');
    if (localStateJSON) {
        const localState = JSON.parse(localStateJSON);
        const modal = document.getElementById('welcome-modal');
        const infoDiv = document.getElementById('local-data-info');
        const savedAt = new Date(localState.meta.savedAt).toLocaleString('pl-PL');
        
        infoDiv.innerHTML = `<p>Znaleziono zapisane dane w tej przeglądarce!</p>
                             <p><strong>Ostatni zapis:</strong> ${savedAt}</p>
                             <p><strong>Wersja:</strong> ${localState.meta.version || 1}</p>`;
        
        document.getElementById('load-local-data-btn').onclick = () => {
            loadState(localState);
            modal.style.display = 'none';
        };
        document.getElementById('ignore-local-data-btn').onclick = () => {
            modal.style.display = 'none';
        };
        modal.style.display = 'flex';
    }
}

// --- SEKCJA: PULPIT ---
function setupCountdown() {
    const weddingDateInput = document.getElementById('weddingDate');
    if (weddingDateInput.value) startCountdown(weddingDateInput.value);
}
function saveWeddingDate() {
    const date = document.getElementById('weddingDate').value;
    if (!date) { alert("Wybierz datę ślubu!"); return; }
    setDataDirty();
    saveState();
    startCountdown(date);
    alert("Data ślubu została zapisana.");
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

// --- SEKCJA: ZADANIA i KALENDARZ ---
function addTask() {
    const name = document.getElementById('taskName').value, date = document.getElementById('taskDate').value, owner = document.getElementById('taskOwner').value;
    if (!name || !date) return alert("Nazwa zadania i data są wymagane!");
    tasks.push({ id: Date.now(), name, date, owner, completed: false, completionDate: null, isPaymentTask: false, vendorId: null });
    document.getElementById('taskName').value = ''; document.getElementById('taskDate').value = ''; document.getElementById('taskOwner').value = '';
    setDataDirty(); saveState(); renderTasks(); renderCalendar();
}
function confirmToggleTask(id, checkbox) {
    const task = tasks.find(t => t.id === id);
    confirmAction(`Oznaczyć zadanie "${task.name}" jako ${checkbox.checked ? 'ukończone' : 'nieukończone'}?`, () => {
        task.completed = checkbox.checked;
        task.completionDate = task.completed ? new Date().toLocaleDateString('pl-PL') : null;
        setDataDirty(); saveState(); renderTasks(); renderCalendar();
    }, () => { checkbox.checked = !checkbox.checked; });
}
function confirmRemoveTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task.isPaymentTask) { alert("Tego zadania nie można usunąć ręcznie. Usuń lub zmień datę płatności w zakładce Budżet."); renderTasks(); return; }
    confirmAction(`Usunąć zadanie "${task.name}"?`, () => { tasks = tasks.filter(t => t.id !== id); setDataDirty(); saveState(); renderTasks(); renderCalendar(); });
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
function renderCalendar() {
    const view = document.getElementById('calendar-view'); view.innerHTML = '';
    const month = currentDate.getMonth(), year = currentDate.getFullYear();
    document.getElementById('calendar-month-year').textContent = `${currentDate.toLocaleString('pl', { month: 'long' })} ${year}`;
    const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) { view.innerHTML += `<div class="calendar-day empty"></div>`; }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div'); dayDiv.className = 'calendar-day';
        const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const eventsForDay = tasks.filter(t => t.date === dayString);
        let eventsHTML = eventsForDay.map(event => `<div class="task-on-calendar ${event.isPaymentTask ? 'payment' : 'task'} ${event.completed ? 'completed' : ''}" title="${event.name}">${event.isPaymentTask ? '💰 ' : ''}${event.name}</div>`).join('');
        dayDiv.innerHTML = `<div class="day-number">${day}</div>${eventsHTML}`;
        view.appendChild(dayDiv);
    }
}
function nextMonth() { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); }
function previousMonth() { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); }

// --- SEKCJA: GOŚCIE ---
function addChildInput(mode = 'add') {
    const container = document.getElementById(mode === "add" ? "children-inputs" : "edit-children-inputs");
    const div = document.createElement("div");
    div.innerHTML = `<input type="text" placeholder="Imię dziecka"><input type="number" placeholder="Wiek" min="0"><button type="button" class="remove-child-btn" onclick="this.parentElement.remove()">X</button>`;
    container.appendChild(div);
}

function addGuest() {
    const guest1 = document.getElementById('guest1Name').value, guest2 = document.getElementById('guest2Name').value;
    if (!guest1 && !guest2) return alert("Przynajmniej jedno imię gościa jest wymagane!");
    const children = Array.from(document.getElementById('children-inputs').querySelectorAll('div')).map(div => ({name: div.children[0].value, age: parseInt(div.children[1].value) || 0})).filter(c => c.name);
    guests.push({ id: Date.now(), guest1, guest2, children, confirmed: false, accommodation: 0 });
    document.getElementById('guest1Name').value = ''; document.getElementById('guest2Name').value = '';
    document.getElementById('children-inputs').innerHTML = `<div><input type="text" placeholder="Imię dziecka"><input type="number" placeholder="Wiek" min="0"></div>`;
    setDataDirty(); saveState(); renderGuests();
}
function filterGuests(status) {
    guestFilterState = status;
    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`.filter-btn[onclick="filterGuests('${status}')"]`).classList.add("active");
    renderGuests();
}
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
        totalAccommodationPeople += guest.accommodation;
    });
    tableFoot.innerHTML = `<tr><td><strong>SUMA:</strong> ${totalAdults + totalChildren} osób (Dorośli: ${totalAdults}, Dzieci: ${totalChildren})</td><td>-</td><td>${totalAccommodationPeople} osób (nocleg)</td><td>-</td></tr>`;
    updateBudget(); 
    renderUnassignedGuests();
}
function confirmGuestUpdate(guestId, key, el) {
    const value = el.type === 'checkbox' ? el.checked : parseInt(el.value);
    const guest = guests.find(g => g.id === guestId);
    confirmAction(`Zmienić status dla grupy: ${[guest.guest1, guest.guest2].filter(Boolean).join(' & ')}?`, () => { guest[key] = value; setDataDirty(); saveState(); renderAll(); }, () => { if(el.type === 'checkbox') el.checked = !el.checked; else el.value = guest[key]; });
}
function confirmRemoveGuest(guestId) {
    const guest = guests.find(g => g.id === guestId);
    confirmAction(`Usunąć grupę gości: ${[guest.guest1, guest.guest2].filter(Boolean).join(' & ')}?`, () => { guests = guests.filter(g => g.id !== guestId); setDataDirty(); saveState(); renderAll(); });
}
function saveGuestChanges() {
    const guestId = parseInt(document.getElementById('editGuestId').value), guest = guests.find(g => g.id === guestId); if (!guest) return;
    guest.guest1 = document.getElementById('editGuest1Name').value; guest.guest2 = document.getElementById('editGuest2Name').value;
    guest.children = Array.from(document.getElementById('edit-children-inputs').querySelectorAll('div')).map(div => ({name: div.children[0].value, age: parseInt(div.children[1].value) || 0})).filter(c => c.name);
    setDataDirty(); saveState(); renderAll(); closeModal('edit-guest-modal');
}

// --- SEKCJA: BUDŻET ---
function syncVendorPaymentTask(vendor) {
    let existingTask = tasks.find(t => t.vendorId === vendor.id);
    if (vendor.paymentDate) {
        if (existingTask) { existingTask.date = vendor.paymentDate; existingTask.name = `Zapłać dla: ${vendor.name}`; } 
        else { tasks.push({ id: Date.now(), name: `Zapłać dla: ${vendor.name}`, date: vendor.paymentDate, owner: 'Para Młoda', completed: false, completionDate: null, isPaymentTask: true, vendorId: vendor.id }); }
    } else { if (existingTask) { tasks = tasks.filter(t => t.vendorId !== vendor.id); } }
}
function addVendor() {
    const name = document.getElementById('vendorName').value, cost = parseFloat(document.getElementById('vendorCost').value);
    if (!name || isNaN(cost)) return alert("Nazwa usługi i koszt są wymagane!");
    const newVendor = {id: Date.now(), name, cost, deposit: parseFloat(document.getElementById('vendorDeposit').value) || 0, paidFull: document.getElementById('vendorPaidFull').checked, paymentDate: document.getElementById('vendorPaymentDate').value};
    vendors.push(newVendor);
    syncVendorPaymentTask(newVendor);
    ['vendorName', 'vendorCost', 'vendorDeposit', 'vendorPaymentDate'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('vendorPaidFull').checked = false;
    setDataDirty(); saveState(); renderAll();
}
function renderVendors() {
    const list = document.getElementById("vendorList");
    list.innerHTML = "";
    vendors.forEach(vendor => {
        const li = document.createElement("li");
        const remaining = vendor.cost - (vendor.paidFull ? vendor.cost : vendor.deposit);
        const dateInfo = vendor.paymentDate ? `<small class="date-info">Termin płatności: ${vendor.paymentDate}</small>` : "";
        li.innerHTML = `<div class="vendor-details"><span><strong>${vendor.name}:</strong> ${vendor.cost.toFixed(2)} PLN (Pozostało: ${remaining.toFixed(2)} PLN)</span>${dateInfo}</div><div><button onclick="openModal('edit-vendor-modal', ${vendor.id})">Edytuj</button><button class="secondary" onclick="confirmRemoveVendor(${vendor.id})">Usuń</button></div>`;
        list.appendChild(li);
    });
    updateBudget();
}
function confirmRemoveVendor(vendorId) {
    const vendor = vendors.find(v => v.id === vendorId);
    confirmAction(`Usunąć koszt: ${vendor.name}?`, () => { 
        vendors = vendors.filter(v => v.id !== vendorId); 
        tasks = tasks.filter(t => t.vendorId !== vendorId);
        setDataDirty(); saveState(); renderAll();
    });
}
function updateBudget() {
    const pA = parseFloat(document.getElementById("priceAdult").value) || 0,
        pCO = parseFloat(document.getElementById("priceChildOlder").value) || 0,
        pCY = parseFloat(document.getElementById("priceChildYounger").value) || 0,
        pAcc = parseFloat(document.getElementById("priceAccommodation").value) || 0;
    let mealCost = 0,
        accommCost = 0;
    guests.filter(g => g.confirmed).forEach(g => {
        if (g.guest1) mealCost += pA;
        if (g.guest2) mealCost += pA;
        g.children.forEach(c => mealCost += c.age <= 3 ? pCY : c.age <= 12 ? pCO : pA);
        accommCost += g.accommodation * pAcc;
    });
    let vendorTotal = vendors.reduce((sum, v) => sum + (v.cost || 0), 0);
    let totalPaid = vendors.reduce((sum, v) => sum + (v.paidFull ? v.cost : v.deposit || 0), 0);
    document.getElementById("guestMealCost").textContent = mealCost.toFixed(2);
    document.getElementById("guestAccommCost").textContent = accommCost.toFixed(2);
    document.getElementById("vendorTotalCost").textContent = vendorTotal.toFixed(2);
    const totalCost = mealCost + accommCost + vendorTotal;
    document.getElementById("totalWeddingCost").textContent = totalCost.toFixed(2);
    document.getElementById("totalPaid").textContent = totalPaid.toFixed(2);
    document.getElementById("totalRemaining").textContent = (totalCost - totalPaid).toFixed(2);
}
function saveVendorChanges() {
    const vendorId = parseInt(document.getElementById('editVendorId').value), vendor = vendors.find(v => v.id === vendorId); if (!vendor) return;
    vendor.name = document.getElementById('editVendorName').value;
    vendor.cost = parseFloat(document.getElementById('editVendorCost').value) || 0;
    vendor.deposit = parseFloat(document.getElementById('editVendorDeposit').value) || 0;
    vendor.paymentDate = document.getElementById('editVendorPaymentDate').value;
    vendor.paidFull = document.getElementById('editVendorPaidFull').checked;
    syncVendorPaymentTask(vendor);
    setDataDirty(); saveState(); renderAll();
    closeModal('edit-vendor-modal');
}

// --- SEKCJA: PLAN STOŁÓW ---
function addTable() {
    const name = document.getElementById('tableName').value || `Stół #${tables.length + 1}`;
    const capacity = parseInt(document.getElementById('tableCapacity').value);
    const shape = document.getElementById('tableShape').value;
    
    if(!capacity || capacity <= 0) { alert("Podaj prawidłową liczbę miejsc."); return; }
    
    tables.push({ id: `table-${Date.now()}`, name, capacity, shape, seats: Array.from({ length: capacity }, (_, i) => ({ id: `seat-${Date.now()}-${i}`, personId: null })) });
    
    document.getElementById('tableName').value = '';
    setDataDirty(); 
    saveState(); 
    renderTables();
}

function confirmRemoveTable(tableId) {
    confirmAction('Czy na pewno chcesz usunąć ten stół? Wszyscy przypisani goście wrócą do puli.', () => {
        tables = tables.filter(t => t.id !== tableId);
        setDataDirty(); saveState(); renderTables(); renderUnassignedGuests();
    });
}
function renderTables() {
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    tables.forEach(table => {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        const tableDiv = document.createElement("div");
        tableDiv.id = table.id;
        tableDiv.className = `table-representation ${table.shape}`;
        const occupiedSeats = table.seats.filter(s => s.personId).length;
        tableDiv.innerHTML = `<span>${table.name}<br><small>(${occupiedSeats}/${table.capacity})</small></span>`;
        table.seats.forEach((seat, index) => {
            const seatDiv = document.createElement("div");
            seatDiv.id = seat.id;
            seatDiv.className = "seat";
            seatDiv.dataset.tableId = table.id;
            
            seatDiv.ondragover = allowDrop;
            seatDiv.ondrop = dropOnSeat;

            if (seat.personId) {
                seatDiv.classList.add("occupied");
                const [, familyId, personKey] = seat.personId.split("-");
                const family = guests.find(g => g.id == familyId);
                let personName = "Błąd";
                if (family) {
                    if (personKey === "guest1") personName = family.guest1;
                    else if (personKey === "guest2") personName = family.guest2;
                    else if (family.children[parseInt(personKey.replace("child", ""))]) personName = family.children[parseInt(personKey.replace("child", ""))].name;
                }
                seatDiv.textContent = personName ? personName.split(" ")[0] : "Błąd";
                seatDiv.dataset.tooltip = personName;
                seatDiv.draggable = true;
                seatDiv.ondragstart = (ev) => ev.dataTransfer.setData("text/plain", seat.personId);
                seatDiv.ondblclick = () => unassignPersonFromSeat(seat.personId, personName);
            }
            positionSeat(seatDiv, index, table.capacity, table.shape);
            tableDiv.appendChild(seatDiv);
        });
        const deleteButton = document.createElement("button");
        deleteButton.className = "remove-table-btn";
        deleteButton.textContent = "Usuń";
        deleteButton.onclick = () => confirmRemoveTable(table.id);
        wrapper.appendChild(tableDiv);
        wrapper.appendChild(deleteButton);
        container.appendChild(wrapper)
    });
}

function positionSeat(seatDiv, index, capacity, shape) {
    const seatSize = 70;
    const seatOffset = `-${seatSize / 2}px`;

    if (shape === "round") {
        const angle = (index / capacity) * 2 * Math.PI;
        const radius = 160; 
        const translateX = Math.cos(angle) * radius - (seatSize / 2);
        const translateY = Math.sin(angle) * radius - (seatSize / 2);
        seatDiv.style.transform = `translate(${translateX}px, ${translateY}px)`;
    } else { // rect
        const seatsOnTop = Math.ceil(capacity / 2);
        const seatsOnBottom = capacity - seatsOnTop;
        const side = index < seatsOnTop ? "top" : "bottom";

        if (side === "top") {
            const posOnSide = index;
            seatDiv.style.left = `${(100 / (seatsOnTop + 1)) * (posOnSide + 1)}%`;
            seatDiv.style.top = seatOffset;
        } else {
            const posOnSide = index - seatsOnTop;
            seatDiv.style.left = `${(100 / (seatsOnBottom + 1)) * (posOnSide + 1)}%`;
            seatDiv.style.bottom = seatOffset;
        }
        seatDiv.style.transform = 'translateX(-50%)';
    }
}

function renderUnassignedGuests() {
    const pool = document.getElementById("unassigned-guests");
    pool.innerHTML = "<h3>Goście do usadzenia</h3>";
    const assignedPeople = tables.flatMap(t => t.seats.map(s => s.personId)).filter(Boolean);
    guests.filter(g => g.confirmed).forEach(family => {
        if (family.guest1 && !assignedPeople.includes(`person-${family.id}-guest1`)) pool.appendChild(createDraggablePerson(family.id, "guest1", family.guest1));
        if (family.guest2 && !assignedPeople.includes(`person-${family.id}-guest2`)) pool.appendChild(createDraggablePerson(family.id, "guest2", family.guest2));
        family.children.forEach((child, index) => {
            if (!assignedPeople.includes(`person-${family.id}-child${index}`)) pool.appendChild(createDraggablePerson(family.id, `child${index}`, child.name));
        });
    });
}
function createDraggablePerson(familyId, personKey, name) {
    const div = document.createElement("div");
    div.id = `person-${familyId}-${personKey}`;
    div.className = "guest-item";
    div.draggable = true;
    div.ondragstart = drag;
    div.textContent = name;
    return div;
}
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text/plain", ev.target.id); }

// ZMIANA: Całkowicie nowa, poprawna logika zamiany miejsc
function dropOnSeat(ev) {
    ev.preventDefault();
    const draggedPersonId = ev.dataTransfer.getData("text/plain");
    const targetSeatDiv = ev.currentTarget;
    
    const targetSeatId = targetSeatDiv.id;
    const targetTableId = targetSeatDiv.dataset.tableId;
    
    const targetTable = tables.find(t => t.id === targetTableId);
    if (!targetTable) return;
    const targetSeat = targetTable.seats.find(s => s.id === targetSeatId);
    if (!targetSeat) return;

    const personAlreadyOnTargetSeatId = targetSeat.personId;

    if (draggedPersonId === personAlreadyOnTargetSeatId) {
        return;
    }

    let sourceSeat = null;
    for (const table of tables) {
        const foundSeat = table.seats.find(s => s.personId === draggedPersonId);
        if (foundSeat) {
            sourceSeat = foundSeat;
            break;
        }
    }
    
    targetSeat.personId = draggedPersonId;

    if (sourceSeat) {
        sourceSeat.personId = personAlreadyOnTargetSeatId; 
    }
    
    setDataDirty();
    saveState();
    renderAll();
}


function dropOnPool(ev) {
    ev.preventDefault();
    unassignPerson(ev.dataTransfer.getData("text/plain"));
    setDataDirty(); saveState(); renderTables(); renderUnassignedGuests();
}
function unassignPerson(personId) {
    tables.forEach(table => table.seats.forEach(seat => { if (seat.personId === personId) seat.personId = null; }));
}
function unassignPersonFromSeat(personId, personName) {
    confirmAction(`Czy na pewno chcesz usunąć "${personName}" z tego miejsca?`, () => {
        unassignPerson(personId);
        setDataDirty();
        saveState();
        renderTables();
        renderUnassignedGuests();
    });
}

// --- MODALE: FUNKCJE OGÓLNE ---
function openModal(modalId, recordId) {
    if (modalId === "edit-guest-modal") {
        const guest = guests.find(g => g.id === recordId);
        if (!guest) return;
        document.getElementById("editGuestId").value = guest.id;
        document.getElementById("editGuest1Name").value = guest.guest1;
        document.getElementById("editGuest2Name").value = guest.guest2;
        const childrenContainer = document.getElementById("edit-children-inputs");
        childrenContainer.innerHTML = "";
        guest.children.forEach(child => {
            const div = document.createElement("div");
            div.innerHTML = `<input type="text" value="${child.name}"><input type="number" value="${child.age}" min="0"><button type="button" class="remove-child-btn" onclick="this.parentElement.remove()">X</button>`;
            childrenContainer.appendChild(div);
        });
    } else if (modalId === "edit-vendor-modal") {
        const vendor = vendors.find(v => v.id === recordId);
        if (!vendor) return;
        document.getElementById("editVendorId").value = vendor.id;
        document.getElementById("editVendorName").value = vendor.name;
        document.getElementById("editVendorCost").value = vendor.cost;
        document.getElementById("editVendorDeposit").value = vendor.deposit;
        document.getElementById("editVendorPaymentDate").value = vendor.paymentDate;
        document.getElementById("editVendorPaidFull").checked = vendor.paidFull;
    }
    document.getElementById(modalId).style.display = "flex";
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// --- SEKCJA: EKSPORT ---
function exportDataToFile() {
    const dataToExport = localStorage.getItem('weddingOrganizerState');
    if (!dataToExport) {
        alert("Brak danych do wyeksportowania. Dodaj gości, zadania lub koszty.");
        return;
    }
    const state = JSON.parse(dataToExport);
    const date = new Date(state.meta.savedAt);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
    const version = state.meta.version || 1;

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizer_dane_${formattedDate}_${formattedTime}_v${version}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importDataFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            if (!importedState.meta || !importedState.data) {
                throw new Error("Nieprawidłowy format pliku.");
            }
            const savedAt = new Date(importedState.meta.savedAt).toLocaleString('pl-PL');
            const version = importedState.meta.version || 1;
            
            confirmAction(`Znaleziono dane w pliku:\nOstatni zapis: ${savedAt}\nWersja: ${version}\n\nCzy na pewno chcesz nadpisać wszystkie obecne dane? Tej operacji nie można cofnąć.`, () => {
                loadState(importedState);
                saveState(); // Zapisz zaimportowane dane do localStorage
                alert("Dane zostały pomyślnie zaimportowane!");
                closeModal('welcome-modal');
            });
        } catch (error) {
            alert("Błąd podczas wczytywania pliku. Upewnij się, że jest to prawidłowy plik z danymi organizera.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const weddingDate = document.getElementById("weddingDate").value || "Nie ustawiono";
    doc.setFontSize(18);
    doc.text(`Raport Ślubny - Data: ${weddingDate}`, 14, 22);
    
    // Tabela gości
    const guestBody = [];
    guests.forEach(g => {
        if (g.guest1) guestBody.push([g.guest1, "Dorosły", g.confirmed ? "Tak" : "Nie", g.accommodation > 0 ? "Tak" : "Nie"]);
        if (g.guest2) guestBody.push([g.guest2, "Dorosły", g.confirmed ? "Tak" : "Nie", g.accommodation > 0 ? "Tak" : "Nie"]);
        g.children.forEach(c => guestBody.push([c.name, `Dziecko (${c.age} lat)`, g.confirmed ? "Tak" : "Nie", g.accommodation > 0 ? "Tak" : "Nie"]));
    });
    doc.autoTable({ head: [["Imię i Nazwisko", "Typ", "Obecność", "Nocleg"]], body: guestBody, startY: 30, headStyles: { fillColor: [74, 20, 140] } });

    // Tabela budżetu
    const vendorBody = vendors.map(v => [v.name, v.cost.toFixed(2), v.deposit.toFixed(2), v.paidFull ? "Tak" : "Nie"]);
    doc.autoTable({ head: [["Usługa", "Koszt (PLN)", "Zaliczka (PLN)", "Opłacone"]], body: vendorBody, startY: doc.autoTable.previous.finalY + 10, headStyles: { fillColor: [74, 20, 140] } });

    // Tabela Plan Stołów
    const seatingBody = [];
    tables.forEach((table, index) => {
        seatingBody.push([{ content: `${table.name} (${table.shape}, ${table.capacity} os.)`, colSpan: 2, styles: { fontStyle: "bold", fillColor: "#f3e5f5" } }]);
        table.seats.forEach((seat, seatIndex) => {
            let personName = "Wolne";
            if (seat.personId) {
                const [, familyId, personKey] = seat.personId.split("-");
                const family = guests.find(g => g.id == familyId);
                if (family) {
                    if (personKey === "guest1") personName = family.guest1;
                    else if (personKey === "guest2") personName = family.guest2;
                    else if (family.children[parseInt(personKey.replace("child", ""))]) personName = family.children[parseInt(personKey.replace("child", ""))].name;
                }
            }
            seatingBody.push([`Miejsce ${seatIndex + 1}`, personName]);
        });
    });
    doc.autoTable({ head: [["Miejsce na Stole", "Gość"]], body: seatingBody, startY: doc.autoTable.previous.finalY + 10, headStyles: { fillColor: [74, 20, 140] } });

    doc.save("Raport_Slubny.pdf");
}

function exportToExcel() {
    const guestData = [];
    guests.forEach(g => {
        if (g.guest1) guestData.push({ Grupa: [g.guest1, g.guest2].filter(Boolean).join(" & "), Imię: g.guest1, Typ: "Dorosły", Potwierdzenie: g.confirmed ? "Tak" : "Nie", Nocleg_osoby: g.accommodation });
        if (g.guest2) guestData.push({ Grupa: [g.guest1, g.guest2].filter(Boolean).join(" & "), Imię: g.guest2, Typ: "Dorosły", Potwierdzenie: g.confirmed ? "Tak" : "Nie", Nocleg_osoby: g.accommodation });
        g.children.forEach(c => guestData.push({ Grupa: [g.guest1, g.guest2].filter(Boolean).join(" & "), Imię: c.name, Typ: `Dziecko (${c.age} lat)`, Potwierdzenie: g.confirmed ? "Tak" : "Nie", Nocleg_osoby: g.accommodation }));
    });
    const guestWS = XLSX.utils.json_to_sheet(guestData);

    const budgetWS = XLSX.utils.json_to_sheet(vendors);

    const seatingData = [];
    tables.forEach((table, index) => {
        seatingData.push({ "Stół / Miejsce": table.name, Gość: `(${table.shape})` });
        table.seats.forEach((seat, seatIndex) => {
            let personName = "Wolne";
            if (seat.personId) {
                const [, familyId, personKey] = seat.personId.split("-");
                const family = guests.find(g => g.id == familyId);
                if (family) {
                    if (personKey === "guest1") personName = family.guest1;
                    else if (personKey === "guest2") personName = family.guest2;
                    else if (family.children[parseInt(personKey.replace("child", ""))]) personName = family.children[parseInt(personKey.replace("child", ""))].name;
                }
            }
            seatingData.push({ "Stół / Miejsce": `Miejsce ${seatIndex + 1}`, Gość: personName });
        });
        seatingData.push({});
    });
    const seatingWS = XLSX.utils.json_to_sheet(seatingData);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, guestWS, "Lista Gości");
    XLSX.utils.book_append_sheet(wb, budgetWS, "Budżet - Usługodawcy");
    XLSX.utils.book_append_sheet(wb, seatingWS, "Plan Stołów");
    
    XLSX.writeFile(wb, "Organizer_Slubny_Raport.xlsx");
}