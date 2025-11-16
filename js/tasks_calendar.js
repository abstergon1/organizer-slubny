// js/tasks_calendar.js


function setupCountdown() {
    const weddingDateInput = document.getElementById('weddingDate');
    const weddingTimeInput = document.getElementById('weddingTime'); // NOWA ZMIENNA
    const rsvpDateInput = document.getElementById('rsvpDeadlineDate'); // NOWA ZMIENNA

    // 1. Licznik do ślubu
    if (weddingDateInput && weddingTimeInput && weddingDateInput.value) {
        // Łączymy datę i czas w jeden ciąg
        const fullWeddingDate = `${weddingDateInput.value}T${weddingTimeInput.value}`;
        startCountdown('countdown', fullWeddingDate);
    }
    
    // 2. Licznik do terminu RSVP
    if (rsvpDateInput && rsvpDateInput.value) {
        // Ustawiamy godzinę na koniec dnia (23:59:59)
        const fullRsvpDate = `${rsvpDateInput.value}T23:59:59`;
        startCountdown('rsvpCountdown', fullRsvpDate);
    }
}

function startCountdown(elementId, dateString) {
    // Użyj unikalnej nazwy dla interwału (np. z ID elementu)
    const intervalName = `countdownInterval_${elementId}`;
    
    // Wyczyść stary interwał, jeśli istnieje
    if (window[intervalName]) clearInterval(window[intervalName]);
    
    const countdownElement = document.getElementById(elementId);
    if (!countdownElement) return;
    if (!dateString) {
        countdownElement.innerHTML = `Ustaw datę, aby rozpocząć odliczanie.`;
        return;
    }
    
    const targetDateTime = new Date(dateString).getTime();
    
    window[intervalName] = setInterval(() => {
        const distance = targetDateTime - new Date().getTime();
        
        if (distance < 0) { 
            clearInterval(window[intervalName]); 
            countdownElement.innerHTML = elementId === 'rsvpCountdown' ? "Termin minął!" : "Wszystkiego najlepszego!"; 
            return; 
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

// --- TASK LOGIC ---

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

// --- CALENDAR LOGIC ---
function openModal(modalId) { 
    document.getElementById(modalId).style.display = "flex"; 
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

function openAddTaskModal(dateString = null) {
    const taskDateInput = document.getElementById('taskDate');
    
    if (taskDateInput && dateString) {
        taskDateInput.value = dateString;
    }
    
    if (typeof showPage === 'function') {
        showPage('tasks'); 
    } else {
    }
    document.getElementById('taskName')?.focus(); 
}

function renderCalendar() {
    const view = document.getElementById('calendar-view');
    if (!view) return;
    view.innerHTML = '';
    const todayString = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    
    const month = currentDate.getMonth(), year = currentDate.getFullYear();
    document.getElementById('calendar-month-year').textContent = `${currentDate.toLocaleString('pl', { month: 'long' })} ${year}`;
    const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) { view.innerHTML += `<div class="calendar-day empty"></div>`; }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div'); 
        const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        dayDiv.className = 'calendar-day';
        if (dayString === todayString) dayDiv.classList.add('today'); 
        
        const eventsForDay = tasks.filter(t => t.date === dayString);
        const maxTasksToShow = 3; 

        let eventsHTML = eventsForDay.slice(0, maxTasksToShow).map(event => {
            const isCompleted = parseInt(event.completed) === 1;
            const isPayment = parseInt(event.is_payment_task) === 1;
            return `<div class="task-on-calendar ${isPayment ? 'payment' : 'task'} ${isCompleted ? 'completed' : ''}" title="${event.name}">${isPayment ? '💰 ' : ''}${event.name}</div>`;
        }).join('');
        
        // NOWOŚĆ: Link do szczegółów dnia (PRZEKAZUJEMY TYLKO DATĘ)
        if (eventsForDay.length > maxTasksToShow) {
            eventsHTML += `<span style="font-size: 0.75em; color: var(--secondary-color); cursor: pointer; display: block; margin-top: 5px;" onclick="showDayDetailsModal('${dayString}')">... i ${eventsForDay.length - maxTasksToShow} więcej</span>`;
        }
        
        // NOWOŚĆ: Przycisk dodawania zadania w danym dniu (PRZYCISK + DZIAŁA POPRAWNIE)
        const addBtn = `<button type="button" onclick="event.stopPropagation(); openAddTaskModal('${dayString}')" style="float: right; margin-top: 5px; font-size: 0.7em; padding: 2px 5px;">+</button>`;

        dayDiv.innerHTML = `<div class="day-number">${day}</div>${addBtn}${eventsHTML}`;
        
        view.appendChild(dayDiv);
    }
}

function showDayDetailsModal(dayString) {
    // 1. Znajdź zadania dla tego dnia
    const events = tasks.filter(t => t.date === dayString);

    document.getElementById('dayDetailsDate').textContent = `Zadania na dzień: ${dayString}`;
    const list = document.getElementById('dayDetailsList');
    list.innerHTML = '';
    
    // 2. Użyj logiki renderowania
    events.forEach(task => {
        const li = document.createElement('li');
        const isCompleted = parseInt(task.completed) === 1;
        const paymentIcon = parseInt(task.is_payment_task) === 1 ? '💰 ' : '';
        li.className = isCompleted ? 'completed' : '';
        
        // Używamy funkcji renderującej listę zadań, która jest już gotowa
        li.innerHTML = `
            <span>${paymentIcon}<strong>${task.name}</strong> (${task.owner || 'brak'})</span>
            <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="confirmToggleTask(${task.id}, this.checked)">
            <button type="button" onclick="confirmRemoveTask(${task.id})">Usuń</button>
        `;
        list.appendChild(li);
    });
    
    // 3. Otwórz modal
    openModal('day-details-modal');
}

function nextMonth() { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); }
function previousMonth() { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); }