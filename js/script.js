// js/script.js (wersja AJAX)

// --- GLOBALNE ZMIENNE STANU (CACHE) ---
let tasks = [], guests = [], vendors = [], tables = [], priceItems = [];
let currentDate = new Date();
let guestFilterState = 'all';
let countdownInterval;

// --- INICJALIZACJA APLIKACJI ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    showPage('dashboard');
    renderAll(); // Pobierz i wyrenderuj dane przy starcie

    // Ustaw nasłuchiwanie na wszystkie formularze z klasą .ajax-form
    document.querySelectorAll('.ajax-form').forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
});

/**
 * Centralna funkcja do obsługi wszystkich formularzy AJAX.
 * @param {Event} event - Obiekt zdarzenia submit.
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // ZATRZYMAJ PRZEŁADOWANIE STRONY
    const form = event.target;
    const formData = new FormData(form);

    // Specjalna obsługa dla checkboxów, które nie są wysyłane, gdy są odznaczone
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            // Jeśli checkbox jest w FormData, ale odznaczony, usuń go
            if (formData.has(cb.name)) {
                 formData.delete(cb.name);
            }
        }
    });

    try {
        const response = await fetch('index.php', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.statusText}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Wystąpił nieznany błąd serwera.');
        }

        // Sukces! Wyczyść formularz (jeśli to formularz dodawania) i odśwież widok.
        if (form.classList.contains('task-input') || form.classList.contains('guest-form') || form.classList.contains('vendor-form') || form.classList.contains('table-controls') || form.classList.contains('price-item-form')) {
            form.reset();
             // Specjalnie dla dynamicznie dodawanych dzieci
            if (form.classList.contains('guest-form')) {
                document.getElementById('children-inputs').innerHTML = `<div><input type="text" placeholder="Imię dziecka" name="addChildName[]"><input type="number" placeholder="Wiek" min="0" name="addChildAge[]"></div>`;
            }
            if (form.classList.contains('price-item-form')) {
                const scopeSelect = form.querySelector('select[name="priceItemScope"]');
                if (scopeSelect) scopeSelect.value = 'all';
            }
        }
        
        // Jeśli edytowano w modalu, zamknij go
        if (form.closest('.modal-overlay')) {
            closeModal(form.closest('.modal-overlay').id);
        }
        
        // Zaktualizuj interfejs
        await renderAll();
        
        // Opcjonalne powiadomienie o sukcesie
        // alert(result.message || 'Operacja zakończona sukcesem!');

    } catch (error) {
        console.error('Błąd podczas przetwarzania formularza:', error);
        alert(`Wystąpił błąd: ${error.message}`);
    }
}


/**
 * Pobiera dane z serwera (z pliku api_data.php).
 */
async function fetchData(dataType) {
    try {
        const response = await fetch(`api_data.php?dataType=${dataType}`);
        if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Błąd podczas pobierania danych (${dataType}):`, error);
        return [];
    }
}

/**
 * Główna funkcja do pobierania wszystkich danych z serwera i odświeżania całego interfejsu.
 */
async function renderAll() {
    const [settingsData, tasksData, guestsData, vendorsData, tablesData, priceItemsData] = await Promise.all([
        fetchData('settings'), fetchData('tasks'), fetchData('guests'), fetchData('vendors'), fetchData('tables'), fetchData('price_items')
    ]);

    if (settingsData) {
        document.getElementById('weddingDate').value = settingsData.wedding_date || '';
        document.getElementById('hidden_wedding_date').value = settingsData.wedding_date || ''; // Aktualizuj ukryte pole
        document.getElementById('priceAdult').value = settingsData.price_adult || '0';
        document.getElementById('priceChildOlder').value = settingsData.price_child_older || '0';
        document.getElementById('priceChildYounger').value = settingsData.price_child_younger || '0';
        document.getElementById('priceAccommodation').value = settingsData.price_accommodation || '0';
        setupCountdown();
    }
    tasks = tasksData; renderTasks(); renderCalendar();
    guests = guestsData; renderGuests();
    vendors = vendorsData; renderVendors();
    priceItems = Array.isArray(priceItemsData) ? priceItemsData : [];
    renderPriceItems();
    tables = tablesData; renderTables(); renderUnassignedGuests();
    updateBudget();
}

// --- POZOSTAŁE FUNKCJE (większość bez zmian, ale uproszczone, bo główna logika jest w handleFormSubmit) ---

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
function confirmAction(message, onConfirm, onCancel) {
    if (confirm(message)) onConfirm();
    else if (onCancel) onCancel();
}

function setupCountdown() {
    const weddingDateInput = document.getElementById('weddingDate');
    if (weddingDateInput.value) startCountdown(weddingDateInput.value);
}

function startCountdown(date) {
    if (countdownInterval) clearInterval(countdownInterval);
    const countdownElement = document.getElementById('countdown');
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
        // Używamy handleFormSubmit do wysłania danych
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
    const list = document.getElementById('taskList'); list.innerHTML = '';
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
    const view = document.getElementById('calendar-view'); view.innerHTML = '';
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

function renderGuests() {
    const tableBody = document.querySelector('#guestTable tbody'), tableFoot = document.querySelector('#guestTable tfoot');
    tableBody.innerHTML = ''; tableFoot.innerHTML = '';
    const isConfirmed = g => parseInt(g.confirmed) === 1;
    let filteredGuests = guests.filter(g => guestFilterState === 'all' || (guestFilterState === 'confirmed' && isConfirmed(g)) || (guestFilterState === 'unconfirmed' && !isConfirmed(g)));
    
    let totalAdults = 0, totalChildren = 0, totalAccommodationPeople = 0;
    filteredGuests.forEach(guest => {
        let desc = [guest.guest1_name, guest.guest2_name].filter(Boolean).join(' & ');
        if(guest.children && guest.children.length > 0) desc += ` z dziećmi: ${guest.children.map(c => `${c.child_name} (${c.age}l)`).join(', ')}`;
        const row = document.createElement('tr');
        row.innerHTML = `<td>${desc}</td><td><input type="checkbox" ${isConfirmed(guest) ? 'checked' : ''} onchange="confirmGuestUpdate(${guest.id}, 'confirmed', this)"></td><td><input type="number" value="${guest.accommodation}" min="0" onchange="confirmGuestUpdate(${guest.id}, 'accommodation', this)"></td><td><button type="button" onclick="openModal('edit-guest-modal', ${guest.id})">Edytuj</button><button type="button" class="secondary" onclick="confirmRemoveGuest(${guest.id})">Usuń</button></td>`;
        tableBody.appendChild(row);
        if(guest.guest1_name) totalAdults++; if(guest.guest2_name) totalAdults++; 
        if(guest.children) totalChildren += guest.children.length;
        totalAccommodationPeople += parseInt(guest.accommodation);
    });
    tableFoot.innerHTML = `<tr><td><strong>SUMA:</strong> ${totalAdults + totalChildren} osób (Dorośli: ${totalAdults}, Dzieci: ${totalChildren})</td><td>-</td><td>${totalAccommodationPeople} osób (nocleg)</td><td>-</td></tr>`;
    updateBudget(); 
    renderUnassignedGuests();
}

function confirmGuestUpdate(guestId, key, el) {
    const value = el.type === 'checkbox' ? el.checked : parseInt(el.value);
    const guest = guests.find(g => g.id == guestId);
    const guestName = [guest.guest1_name, guest.guest2_name].filter(Boolean).join(' & ');

    confirmAction(`Zmienić status dla grupy: ${guestName}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'update_guest_status');
        formData.append('guest_id', guestId);
        formData.append('key', key);
        formData.append('value', value);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) await renderAll();
        else {
            alert(result.message);
            if(el.type === 'checkbox') el.checked = !el.checked; else el.value = guest[key];
        }
    }, () => { 
        if(el.type === 'checkbox') el.checked = !el.checked; else el.value = guest[key]; 
    });
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
    list.innerHTML = "";
    vendors.forEach(vendor => {
        const li = document.createElement("li");
        const cost = parseFloat(vendor.cost);
        const deposit = parseFloat(vendor.deposit);
        const isPaidFull = parseInt(vendor.paid_full) === 1;
        const remaining = cost - (isPaidFull ? cost : deposit);
        const dateInfo = vendor.payment_date ? `<small class="date-info">Termin płatności: ${vendor.payment_date}</small>` : "";
        li.innerHTML = `<div class="vendor-details"><span><strong>${vendor.name}:</strong> ${cost.toFixed(2)} PLN (Pozostało: ${remaining.toFixed(2)} PLN)</span>${dateInfo}</div><div><button type="button" onclick="openModal('edit-vendor-modal', ${vendor.id})">Edytuj</button><button type="button" class="secondary" onclick="confirmRemoveVendor(${vendor.id})">Usuń</button></div>`;
        list.appendChild(li);
    });
}

function confirmRemoveVendor(vendorId) {
    const vendor = vendors.find(v => v.id == vendorId);
    confirmAction(`Usunąć koszt: ${vendor.name}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'delete_vendor');
        formData.append('vendor_id', vendorId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
    });
}

function renderPriceItems() {
    const list = document.getElementById('priceItemsList');
    if (!list) return;
    list.innerHTML = '';

    if (!priceItems || priceItems.length === 0) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'Brak dodatkowych pozycji.';
        list.appendChild(li);
        return;
    }

    const scopeLabels = {
        all: 'wszyscy goście',
        adults: 'tylko dorośli'
    };

    priceItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'price-item-row';
        li.dataset.itemId = item.id;

        const details = document.createElement('div');
        details.className = 'price-item-details';

        const nameEl = document.createElement('strong');
        nameEl.textContent = item.label;

        const metaEl = document.createElement('span');
        metaEl.className = 'price-item-meta';
        const amount = parseFloat(item.amount) || 0;
        metaEl.textContent = `${amount.toFixed(2)} PLN · ${scopeLabels[item.scope] || item.scope}`;

        details.appendChild(nameEl);
        details.appendChild(metaEl);

        const actions = document.createElement('div');
        actions.className = 'price-item-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = 'Edytuj';
        editBtn.onclick = () => openPriceItemEdit(item.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'secondary';
        deleteBtn.textContent = 'Usuń';
        deleteBtn.onclick = () => confirmRemovePriceItem(item.id, item.label);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(details);
        li.appendChild(actions);
        list.appendChild(li);
    });
}

function openPriceItemEdit(itemId) {
    const item = priceItems.find(pi => parseInt(pi.id, 10) === parseInt(itemId, 10));
    if (!item) return;

    const newLabel = prompt('Podaj nową nazwę pozycji:', item.label);
    if (newLabel === null) return;

    const currentAmount = Number.parseFloat(item.amount);
    const formattedAmount = Number.isNaN(currentAmount) ? '0.00' : currentAmount.toFixed(2);
    const newAmountInput = prompt('Podaj nową kwotę:', formattedAmount);
    if (newAmountInput === null) return;

    const newScopeInput = prompt('Zakres (all - wszyscy, adults - dorośli):', item.scope);
    if (newScopeInput === null) return;
    const newScope = newScopeInput.trim().toLowerCase();
    if (!['all', 'adults'].includes(newScope)) {
        alert('Zakres musi być równy "all" lub "adults".');
        return;
    }

    submitPriceItemUpdate(itemId, newLabel, newAmountInput, newScope);
}

async function submitPriceItemUpdate(itemId, label, amount, scope) {
    const formData = new FormData();
    formData.append('action', 'update_price_item');
    formData.append('priceItemId', itemId);
    formData.append('priceItemName', label);
    formData.append('priceItemAmount', amount);
    formData.append('priceItemScope', scope);

    try {
        const response = await fetch('index.php', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Błąd sieci: ${response.statusText}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Błąd podczas aktualizacji pozycji.');
        await renderAll();
    } catch (error) {
        console.error('Błąd aktualizacji pozycji cenowej:', error);
        alert(`Nie udało się zaktualizować pozycji: ${error.message}`);
    }
}

function confirmRemovePriceItem(itemId, label) {
    confirmAction(`Usunąć pozycję: ${label}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'delete_price_item');
        formData.append('priceItemId', itemId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
    });
}

function updateBudget() {
    const pA = parseFloat(document.getElementById("priceAdult").value) || 0;
    const pCO = parseFloat(document.getElementById("priceChildOlder").value) || 0;
    const pCY = parseFloat(document.getElementById("priceChildYounger").value) || 0;
    const pAcc = parseFloat(document.getElementById("priceAccommodation").value) || 0;
    let mealCost = 0, accommCost = 0;
    let confirmedGuestCount = 0, confirmedAdultCount = 0;

    guests.filter(g => parseInt(g.confirmed, 10) === 1).forEach(g => {
        if (g.guest1_name) {
            mealCost += pA;
            confirmedGuestCount++;
            confirmedAdultCount++;
        }
        if (g.guest2_name) {
            mealCost += pA;
            confirmedGuestCount++;
            confirmedAdultCount++;
        }
        if (g.children) {
            g.children.forEach(c => {
                const age = parseInt(c.age, 10) || 0;
                mealCost += age <= 3 ? pCY : age <= 12 ? pCO : pA;
                confirmedGuestCount++;
                if (age >= 18) confirmedAdultCount++;
            });
        }
        accommCost += (parseInt(g.accommodation) || 0) * pAcc;
    });

    let additionalCostTotal = priceItems.reduce((sum, item) => {
        const amount = parseFloat(item.amount) || 0;
        if (item.scope === 'adults') {
            return sum + amount * confirmedAdultCount;
        }
        return sum + amount * confirmedGuestCount;
    }, 0);

    let vendorTotal = vendors.reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);
    let totalPaid = vendors.reduce((sum, v) => sum + (parseInt(v.paid_full) === 1 ? parseFloat(v.cost) : parseFloat(v.deposit) || 0), 0);

    document.getElementById("guestMealCost").textContent = mealCost.toFixed(2);
    document.getElementById("guestAccommCost").textContent = accommCost.toFixed(2);
    document.getElementById("vendorTotalCost").textContent = vendorTotal.toFixed(2);
    const additionalElement = document.getElementById('additionalPerGuestCost');
    if (additionalElement) {
        additionalElement.textContent = additionalCostTotal.toFixed(2);
    }
    const totalCost = mealCost + accommCost + vendorTotal + additionalCostTotal;
    document.getElementById("totalWeddingCost").textContent = totalCost.toFixed(2);
    document.getElementById("totalPaid").textContent = totalPaid.toFixed(2);
    document.getElementById("totalRemaining").textContent = (totalCost - totalPaid).toFixed(2);
}

// Pozostałe funkcje (renderTables, drag-and-drop, modale, eksport) są takie same jak w poprzedniej wersji.
// Można je skopiować z poprzedniej odpowiedzi, jeśli są potrzebne.
// ... (Wklej tutaj pozostałe funkcje z poprzedniej wersji script.js)

function renderTables() {
    const container = document.getElementById("tables-container");
    container.innerHTML = "";
    tables.forEach(table => {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        const tableDiv = document.createElement("div");
        tableDiv.id = table.id;
        tableDiv.className = `table-representation ${table.shape}`;
        const occupiedSeats = table.seats.filter(s => s.person_id).length;
        tableDiv.innerHTML = `<span>${table.name}<br><small>(${occupiedSeats}/${table.capacity})</small></span>`;
        
        table.seats.forEach((seat, index) => {
            const seatDiv = document.createElement("div");
            seatDiv.id = `seat-${seat.id}`;
            seatDiv.className = "seat";
            seatDiv.dataset.tableId = table.id;
            seatDiv.dataset.seatId = seat.id;
            
            seatDiv.ondragover = allowDrop;
            seatDiv.ondrop = dropOnSeat;

            if (seat.person_id) {
                seatDiv.classList.add("occupied");
                const personName = seat.person_name || "Błąd";
                seatDiv.textContent = personName ? personName.split(" ")[0] : "Błąd";
                seatDiv.dataset.tooltip = personName;
                seatDiv.draggable = true;
                
                let personIdentifier;
                if (seat.person_type === 'guest1' || seat.person_type === 'guest2') {
                    // Trzeba znaleźć ID grupy gości
                    let guestGroup = guests.find(g => g.guest1_name === personName || g.guest2_name === personName);
                    if (guestGroup) personIdentifier = `person-${seat.person_type}-${guestGroup.id}`;
                } else { // child
                    personIdentifier = `person-child-${seat.person_id}`;
                }
                seatDiv.dataset.personIdentifier = personIdentifier;

                seatDiv.ondragstart = (ev) => ev.dataTransfer.setData("text/plain", personIdentifier);
                seatDiv.ondblclick = () => unassignPersonFromSeat(seat.id, personName);
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

function confirmRemoveTable(tableId) {
    confirmAction('Czy na pewno chcesz usunąć ten stół? Wszyscy przypisani goście wrócą do puli.', async () => {
        const formData = new FormData();
        formData.append('action', 'delete_table');
        formData.append('table_id', tableId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
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
    } else {
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
    const assignedPeopleIds = tables.flatMap(t => t.seats.map(s => s.person_id && `${s.person_type}-${s.person_id}`)).filter(Boolean);
    
    guests.filter(g => parseInt(g.confirmed) === 1).forEach(family => {
        if (family.guest1_name && !assignedPeopleIds.includes(`guest1-${family.id}`)) {
            pool.appendChild(createDraggablePerson(family.id, "guest1", family.guest1_name));
        }
        if (family.guest2_name && !assignedPeopleIds.includes(`guest2-${family.id}`)) {
            pool.appendChild(createDraggablePerson(family.id, "guest2", family.guest2_name));
        }
        if (family.children) {
            family.children.forEach((child) => {
                if (!assignedPeopleIds.includes(`child-${child.id}`)) {
                    pool.appendChild(createDraggablePerson(child.id, `child`, child.child_name));
                }
            });
        }
    });
}

function createDraggablePerson(personId, personType, name) {
    const div = document.createElement("div");
    div.id = `person-${personType}-${personId}`;
    div.className = "guest-item";
    div.draggable = true;
    div.ondragstart = drag;
    div.textContent = name;
    return div;
}
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text/plain", ev.target.id); }

async function dropOnSeat(ev) {
    ev.preventDefault();
    const draggedPersonIdentifier = ev.dataTransfer.getData("text/plain");
    const targetSeatDiv = ev.currentTarget;
    const targetSeatId = targetSeatDiv.dataset.seatId;
    const sourceSeatDiv = document.querySelector(`[data-person-identifier="${draggedPersonIdentifier}"]`);
    const oldSeatId = sourceSeatDiv ? sourceSeatDiv.dataset.seatId : 0;
    if (targetSeatId === oldSeatId) return;

    const formData = new FormData();
    formData.append('action', 'assign_person');
    formData.append('seat_id', targetSeatId);
    formData.append('dragged_person_id', draggedPersonIdentifier);
    if (oldSeatId) formData.append('old_seat_id', oldSeatId);
    
    const response = await fetch('index.php', { method: 'POST', body: formData });
    const result = await response.json();
    if(result.success) await renderAll();
    else alert(result.message);
}

async function dropOnPool(ev) {
    ev.preventDefault();
    const draggedPersonIdentifier = ev.dataTransfer.getData("text/plain");
    const sourceSeatDiv = document.querySelector(`[data-person-identifier="${draggedPersonIdentifier}"]`);
    
    if (sourceSeatDiv) {
        const seatId = sourceSeatDiv.dataset.seatId;
        const formData = new FormData();
        formData.append('action', 'unassign_person');
        formData.append('seat_id', seatId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) await renderAll();
        else alert(result.message);
    }
}

function unassignPersonFromSeat(seatId, personName) {
    confirmAction(`Czy na pewno chcesz usunąć "${personName}" z tego miejsca?`, async () => {
        const formData = new FormData();
        formData.append('action', 'unassign_person');
        formData.append('seat_id', seatId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) await renderAll();
        else alert(result.message);
    });
}

function openModal(modalId, recordId) {
    if (modalId === "edit-guest-modal") {
        const guest = guests.find(g => g.id == recordId);
        if (!guest) return;
        document.getElementById("editGuestId").value = guest.id;
        document.getElementById("editGuest1Name").value = guest.guest1_name;
        document.getElementById("editGuest2Name").value = guest.guest2_name;
        const childrenContainer = document.getElementById("edit-children-inputs");
        childrenContainer.innerHTML = "";
        if(guest.children) {
            guest.children.forEach(child => {
                const div = document.createElement("div");
                const namePrefix = 'editChild';
                div.innerHTML = `<input type="text" value="${child.child_name}" name="${namePrefix}Name[]"><input type="number" value="${child.age}" min="0" name="${namePrefix}Age[]"><button type="button" class="remove-child-btn" onclick="this.parentElement.remove()">X</button>`;
                childrenContainer.appendChild(div);
            });
        }
    } else if (modalId === "edit-vendor-modal") {
        const vendor = vendors.find(v => v.id == recordId);
        if (!vendor) return;
        document.getElementById("editVendorId").value = vendor.id;
        document.getElementById("editVendorName").value = vendor.name;
        document.getElementById("editVendorCost").value = vendor.cost;
        document.getElementById("editVendorDeposit").value = vendor.deposit;
        document.getElementById("editVendorPaymentDate").value = vendor.payment_date;
        document.getElementById("editVendorPaidFull").checked = parseInt(vendor.paid_full) === 1;
    }
    document.getElementById(modalId).style.display = "flex";
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// Funkcje eksportu bez zmian
function exportToPDF() {
    // Sprawdzenie, czy biblioteka jest załadowana
    if (typeof window.jspdf === 'undefined') {
        alert('Biblioteka PDF nie została jeszcze załadowana. Spróbuj ponownie za chwilę.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const weddingDate = document.getElementById("weddingDate").value || "Nie ustawiono";
    doc.setFontSize(18);
    // Dodajemy obsługę polskich znaków (ważne dla jsPDF)
    doc.setFont("helvetica", "normal");
    doc.text(`Raport Slubny - Data: ${weddingDate}`, 14, 22);
    
    // Tabela gości (POPRAWIONE NAZWY PÓL)
    const guestBody = [];
    guests.forEach(g => {
        const isConfirmed = parseInt(g.confirmed) === 1;
        const needsAccommodation = parseInt(g.accommodation) > 0;
        if (g.guest1_name) guestBody.push([g.guest1_name, "Dorosły", isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]);
        if (g.guest2_name) guestBody.push([g.guest2_name, "Dorosły", isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]);
        if (g.children) {
            g.children.forEach(c => guestBody.push([c.child_name, `Dziecko (${c.age} lat)`, isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]));
        }
    });
    doc.autoTable({ 
        head: [["Imie i Nazwisko", "Typ", "Obecnosc", "Nocleg"]], // Usunięte polskie znaki z nagłówków dla pewności
        body: guestBody, 
        startY: 30, 
        headStyles: { fillColor: [74, 20, 140] },
        styles: { font: "helvetica" } // Ustawienie czcionki dla całej tabeli
    });

    // Tabela budżetu (POPRAWIONE NAZWY PÓL I PARSOWANIE)
    const vendorBody = vendors.map(v => [
        v.name, 
        parseFloat(v.cost).toFixed(2), 
        parseFloat(v.deposit).toFixed(2), 
        parseInt(v.paid_full) === 1 ? "Tak" : "Nie"
    ]);
    doc.autoTable({ 
        head: [["Usluga", "Koszt (PLN)", "Zaliczka (PLN)", "Oplacone"]], 
        body: vendorBody, 
        startY: doc.autoTable.previous.finalY + 10, 
        headStyles: { fillColor: [74, 20, 140] },
        styles: { font: "helvetica" }
    });

    // Tabela Plan Stołów (logika pozostaje, bo opiera się na `person_name`)
    const seatingBody = [];
    tables.forEach(table => {
        seatingBody.push([{ content: `${table.name} (${table.shape}, ${table.capacity} os.)`, colSpan: 2, styles: { fontStyle: "bold", fillColor: "#f3e5f5" } }]);
        table.seats.forEach((seat, seatIndex) => {
            let personName = seat.person_name || "Wolne";
            seatingBody.push([`Miejsce ${seatIndex + 1}`, personName]);
        });
    });
    doc.autoTable({ 
        head: [["Miejsce na Stole", "Gosc"]], 
        body: seatingBody, 
        startY: doc.autoTable.previous.finalY + 10, 
        headStyles: { fillColor: [74, 20, 140] },
        styles: { font: "helvetica" }
    });

    doc.save("Raport_Slubny.pdf");
}

// --- SEKCJA: EKSPORT (POPRAWIONA Z USUWANIEM POLSKICH ZNAKÓW) ---

/**
 * Funkcja pomocnicza do zamiany polskich znaków na ich łacińskie odpowiedniki.
 * @param {string} text - Tekst do przetworzenia.
 * @returns {string} - Tekst bez polskich znaków diakrytycznych.
 */
function normalizePolishChars(text) {
    if (typeof text !== 'string') return text;
    const replacements = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => replacements[match]);
}

function exportToPDF() {
    // Sprawdzenie, czy biblioteka jest załadowana
    if (typeof window.jspdf === 'undefined') {
        alert('Biblioteka PDF nie została jeszcze załadowana. Spróbuj ponownie za chwilę.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const weddingDate = document.getElementById("weddingDate").value || "Nie ustawiono";
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    
    // Używamy funkcji normalizującej
    doc.text(normalizePolishChars(`Raport Ślubny - Data: ${weddingDate}`), 14, 22);
    
    // Tabela gości
    const guestBody = [];
    guests.forEach(g => {
        const isConfirmed = parseInt(g.confirmed) === 1;
        const needsAccommodation = parseInt(g.accommodation) > 0;
        // Normalizujemy każdą komórkę z tekstem
        if (g.guest1_name) guestBody.push([normalizePolishChars(g.guest1_name), normalizePolishChars("Dorosły"), isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]);
        if (g.guest2_name) guestBody.push([normalizePolishChars(g.guest2_name), normalizePolishChars("Dorosły"), isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]);
        if (g.children) {
            g.children.forEach(c => guestBody.push([normalizePolishChars(c.child_name), normalizePolishChars(`Dziecko (${c.age} lat)`), isConfirmed ? "Tak" : "Nie", needsAccommodation ? "Tak" : "Nie"]));
        }
    });
    doc.autoTable({ 
        head: [["Imie i Nazwisko", "Typ", "Obecnosc", "Nocleg"]],
        body: guestBody, 
        startY: 30, 
        headStyles: { fillColor: [74, 20, 140] }
    });

    // Tabela budżetu
    const vendorBody = vendors.map(v => [
        normalizePolishChars(v.name), 
        parseFloat(v.cost).toFixed(2), 
        parseFloat(v.deposit).toFixed(2), 
        parseInt(v.paid_full) === 1 ? "Tak" : "Nie"
    ]);
    doc.autoTable({ 
        head: [["Usluga", "Koszt (PLN)", "Zaliczka (PLN)", "Oplacone"]], 
        body: vendorBody, 
        startY: doc.autoTable.previous.finalY + 10, 
        headStyles: { fillColor: [74, 20, 140] }
    });

    // Tabela Plan Stołów
    const seatingBody = [];
    tables.forEach(table => {
        const tableName = normalizePolishChars(`${table.name} (${table.shape}, ${table.capacity} os.)`);
        seatingBody.push([{ content: tableName, colSpan: 2, styles: { fontStyle: "bold", fillColor: "#f3e5f5" } }]);
        table.seats.forEach((seat, seatIndex) => {
            let personName = normalizePolishChars(seat.person_name || "Wolne");
            seatingBody.push([`Miejsce ${seatIndex + 1}`, personName]);
        });
    });
    doc.autoTable({ 
        head: [["Miejsce na Stole", "Gosc"]], 
        body: seatingBody, 
        startY: doc.autoTable.previous.finalY + 10, 
        headStyles: { fillColor: [74, 20, 140] }
    });

    doc.save("Raport_Slubny.pdf");
}

function exportToExcel() {
    // Sprawdzenie, czy biblioteka jest załadowana
    if (typeof XLSX === 'undefined') {
        alert('Biblioteka Excel nie została jeszcze załadowana. Spróbuj ponownie za chwilę.');
        return;
    }
    
    // Dane gości
    const guestData = [];
    guests.forEach(g => {
        const isConfirmed = parseInt(g.confirmed) === 1;
        // Normalizujemy dane przed dodaniem do tablicy
        const groupName = normalizePolishChars([g.guest1_name, g.guest2_name].filter(Boolean).join(" & "));
        if (g.guest1_name) guestData.push({ Grupa: groupName, Imie: normalizePolishChars(g.guest1_name), Typ: normalizePolishChars("Dorosły"), Potwierdzenie: isConfirmed ? "Tak" : "Nie", 'Nocleg (osoby)': parseInt(g.accommodation) });
        if (g.guest2_name) guestData.push({ Grupa: groupName, Imie: normalizePolishChars(g.guest2_name), Typ: normalizePolishChars("Dorosły"), Potwierdzenie: isConfirmed ? "Tak" : "Nie", 'Nocleg (osoby)': parseInt(g.accommodation) });
        if (g.children) {
            g.children.forEach(c => guestData.push({ Grupa: groupName, Imie: normalizePolishChars(c.child_name), Typ: normalizePolishChars(`Dziecko (${c.age} lat)`), Potwierdzenie: isConfirmed ? "Tak" : "Nie", 'Nocleg (osoby)': parseInt(g.accommodation) }));
        }
    });
    const guestWS = XLSX.utils.json_to_sheet(guestData);

    // Dane budżetu
    const budgetData = vendors.map(v => ({
        'Usluga': normalizePolishChars(v.name),
        'Koszt (PLN)': parseFloat(v.cost),
        'Zaliczka (PLN)': parseFloat(v.deposit),
        'Oplacone w calosci': parseInt(v.paid_full) === 1 ? 'Tak' : 'Nie', // Nagłówek bez polskich znaków
        'Termin platnosci': v.payment_date // Nagłówek bez polskich znaków
    }));
    const budgetWS = XLSX.utils.json_to_sheet(budgetData);

    // Dane planu stołów
    const seatingData = [];
    tables.forEach(table => {
        seatingData.push({ "Stol / Miejsce": normalizePolishChars(table.name), "Gosc": `(${table.shape}, ${table.capacity} miejsc)` });
        table.seats.forEach((seat, seatIndex) => {
            let personName = normalizePolishChars(seat.person_name || "Wolne");
            seatingData.push({ "Stol / Miejsce": `Miejsce ${seatIndex + 1}`, "Gosc": personName });
        });
        seatingData.push({});
    });
    const seatingWS = XLSX.utils.json_to_sheet(seatingData);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, guestWS, "Lista Gosci");
    XLSX.utils.book_append_sheet(wb, budgetWS, "Budzet - Uslugodawcy");
    XLSX.utils.book_append_sheet(wb, seatingWS, "Plan Stolow");
    
    XLSX.writeFile(wb, "Organizer_Slubny_Raport.xlsx");
}

function exportDataToFile() {
    // Zbieramy aktualne dane z globalnych tablic (które są kopią danych z serwera)
    const stateData = {
        meta: {
            version: "2.0-db", // Oznaczamy, że to eksport z wersji bazodanowej
            savedAt: new Date().toISOString()
        },
        data: {
            tasks: tasks,
            guests: guests,
            vendors: vendors,
            tables: tables,
            settings: { // Zbieramy ustawienia bezpośrednio z pól formularzy
                wedding_date: document.getElementById('weddingDate').value,
                price_adult: document.getElementById('priceAdult').value,
                price_child_older: document.getElementById('priceChildOlder').value,
                price_child_younger: document.getElementById('priceChildYounger').value,
                price_accommodation: document.getElementById('priceAccommodation').value,
            }
        }
    };

    const blob = new Blob([JSON.stringify(stateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const formattedDate = new Date().toISOString().slice(0, 10);
    a.download = `organizer_dane_${formattedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Wczytuje dane z pliku i wysyła je do serwera w celu nadpisania bazy danych.
 */
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
            
            confirmAction(`Czy na pewno chcesz nadpisać WSZYSTKIE dane w bazie danymi z pliku? Tej operacji nie można cofnąć.`, async () => {
                try {
                    // Wyślij cały obiekt JSON do dedykowanego skryptu PHP
                    const response = await fetch('api_import.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(importedState.data)
                    });

                    if (!response.ok) {
                        throw new Error(`Błąd serwera: ${response.statusText}`);
                    }

                    const result = await response.json();
                    if (result.success) {
                        alert("Dane zostały pomyślnie zaimportowane! Strona zostanie odświeżona.");
                        await renderAll(); // Odśwież widok, aby pokazać nowe dane
                    } else {
                        throw new Error(result.message || 'Nieznany błąd podczas importu na serwerze.');
                    }
                } catch (serverError) {
                    alert(`Wystąpił błąd podczas importu: ${serverError.message}`);
                }
            });
        } catch (error) {
            alert("Błąd podczas wczytywania pliku. Upewnij się, że jest to prawidłowy plik z danymi organizera.");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Zresetuj input, aby można było wczytać ten sam plik ponownie
}