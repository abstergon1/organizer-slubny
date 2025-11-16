// js/seating.js

// --- TABLE RENDERING ---

function renderTables() {
    const container = document.getElementById("tables-container");
    if (!container) return;
    container.innerHTML = "";
    
    tables.forEach(table => {
        const wrapper = document.createElement("div"); wrapper.className = "table-wrapper";
        const tableDiv = document.createElement("div"); tableDiv.id = table.id; tableDiv.className = `table-representation ${table.shape}`;
        const occupiedSeats = table.seats.filter(s => s.person_id).length;
        
        const nameSpan = document.createElement('span');
        nameSpan.innerHTML = `${table.name} (${occupiedSeats}/${table.capacity})`; 
        tableDiv.appendChild(nameSpan);  

        const isRect = table.shape === 'rect';
        const halfway = isRect ? Math.ceil(table.capacity / 2) : table.capacity;
        
        const leftColumn = document.createElement('div');
        leftColumn.className = isRect ? 'table-seats-column' : 'table-seats-row';
        leftColumn.style.gridColumn = isRect ? 1 : '1 / -1'; 

        const rightColumn = isRect ? document.createElement('div') : leftColumn; 
        if (isRect) {
            rightColumn.className = 'table-seats-column';
            rightColumn.style.gridColumn = 3; 
        }

        table.seats.forEach((seat, index) => {
            const seatDiv = document.createElement("div"); 
            seatDiv.id = `seat-${seat.id}`; 
            
            let seatClass = "seat"; 
                if (seat.person_id) {
                    seatClass += " occupied";
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
            
            if (isRect) {
                if (index < halfway) { leftColumn.appendChild(seatDiv); } else { rightColumn.appendChild(seatDiv); }
            } else { leftColumn.appendChild(seatDiv); }
            
            positionSeat(seatDiv, index, table.capacity, table.shape);
        });
        
        if (isRect) {
             const leftCount = leftColumn.children.length;
             const rightCount = rightColumn.children.length;

             if (leftCount > rightCount) { for (let i = rightCount; i < leftCount; i++) { rightColumn.appendChild(document.createElement('div')).className = 'seat-spacer'; } } 
             else if (rightCount > leftCount) { for (let i = leftCount; i < rightCount; i++) { leftColumn.appendChild(document.createElement('div')).className = 'seat-spacer'; } }

            tableDiv.appendChild(leftColumn);
            tableDiv.appendChild(rightColumn);
        } else { tableDiv.appendChild(leftColumn); }

        const deleteButton = document.createElement("button"); 
        deleteButton.className = "remove-table-btn"; deleteButton.textContent = "Usuń Stół"; deleteButton.onclick = () => confirmRemoveTable(table.id);
        const clearButton = document.createElement("button"); 
        clearButton.className = "clear-table-btn"; clearButton.textContent = "Wyczyść Usadzenie"; clearButton.onclick = () => confirmClearTable(table.id, table.name);
        
        wrapper.appendChild(tableDiv); 
        
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = 'flex'; buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '10px'; buttonContainer.style.marginTop = '10px';
        
        clearButton.style.backgroundColor = '#6200EE'; clearButton.style.color = 'white';
        clearButton.style.padding = '10px 20px'; clearButton.style.borderRadius = '4px';

        deleteButton.style.backgroundColor = '#9c27b0'; deleteButton.style.color = 'white';
        deleteButton.style.padding = '10px 20px'; deleteButton.style.borderRadius = '4px';

        buttonContainer.appendChild(clearButton);
        buttonContainer.appendChild(deleteButton);
        
        wrapper.appendChild(buttonContainer);
        container.appendChild(wrapper);
    });
}

function confirmRemoveTable(tableId) {
    confirmAction('Czy na pewno chcesz usunąć ten stół?', async () => {
        const formData = new FormData(); formData.append('action', 'delete_table'); formData.append('table_id', tableId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll(); else alert(result.message);
    });
}

function confirmClearTable(tableId, tableName) {
    confirmAction(`Czy na pewno chcesz usunąć WSZYSTKICH gości ze stołu: ${tableName}?`, async () => {
        const formData = new FormData(); formData.append('action', 'clear_table_seating'); formData.append('table_id', tableId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll(); else alert(result.message);
    });
}

function positionSeat(seatDiv, index, capacity, shape) {
    // FUNKCJA ZASLEPKA
}

function renderUnassignedGuests() {
    const pool = document.getElementById("unassigned-guests");
    if (!pool) return;
    pool.innerHTML = "<h3>Goście do usadzenia</h3>";
    const assignedPeopleIds = new Set(tables.flatMap(t => t.seats.filter(s => s.person_id).map(s => `${s.person_type}-${s.person_id}`)));
    
    guests.filter(g => g.rsvp_status === 'confirmed' && (parseInt(g.confirmed_adults) > 0 || parseInt(g.confirmed_children) > 0)).forEach(family => {
        
        const confirmedAdults = parseInt(family.confirmed_adults) || 0;
        const confirmedChildren = parseInt(family.confirmed_children) || 0;
        
        if (confirmedAdults > 0 && family.guest1_name && !assignedPeopleIds.has(`guest1-${family.id}`)) { pool.appendChild(createDraggablePerson(family.id, "guest1", family.guest1_name)); }
        if (confirmedAdults > 1 && family.guest2_name && !assignedPeopleIds.has(`guest2-${family.id}`)) { pool.appendChild(createDraggablePerson(family.id, "guest2", family.guest2_name)); }
        
        if (confirmedChildren > 0 && family.children) {
            family.children.forEach((child) => {
                if (!assignedPeopleIds.has(`child-${child.id}`)) { pool.appendChild(createDraggablePerson(child.id, `child`, child.child_name)); }
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