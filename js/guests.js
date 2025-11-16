// js/guests.js

// --- GUEST LOGIC ---

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
        case 'rejected': text = 'REZYGNACJA'; className = 'status-rejected'; break; 
        case 'unconfirmed': text = 'Oczekuje na akceptację'; className = 'status-unconfirmed'; break;
        default: text = 'Nieznany'; className = 'status-unconfirmed';
    }
    return `<span class="status-badge ${className}">${text}</span>`; 
}

// NOWA FUNKCJA: Generuje SELECT dla admina
function getAdminStatusSelect(guestId, currentStatus) {
    let select = `<select onchange="confirmGuestUpdate(${guestId}, 'rsvp_status', this)" title="Status Administracyjny">`;
    const statuses = { 'unconfirmed': 'Niepotwierdzony', 'pending': 'Oczekuje', 'confirmed': 'Zatwierdzony', 'rejected': 'Rezygnacja' }; 
    for (const [key, value] of Object.entries(statuses)) {
        const selected = key === currentStatus ? 'selected' : '';
        select += `<option value="${key}" ${selected}>${value}</option>`;
    }
    select += `</select>`;
    return select;
}

function renderGuests() {
    const tableBody = document.querySelector('#guestTable tbody');
    if (!tableBody) return;
    const tableFoot = document.querySelector('#guestTable tfoot');
    tableBody.innerHTML = ''; tableFoot.innerHTML = '';
    
    // Logika filtrowania...
    let filteredGuests = guests.filter(g => {
        switch (guestFilterState) {
            case 'all': return true;
            case 'confirmed': return g.rsvp_status === 'confirmed';
            case 'unconfirmed': return g.rsvp_status !== 'confirmed'; 
            case 'pending': return g.rsvp_status === 'pending'; 
            case 'after_party': return parseInt(g.after_party) > 0 && g.rsvp_status === 'confirmed'; 
            case 'rejected': return g.rsvp_status === 'rejected';
            default: return true;
        }
    });
    
    // OBLICZENIA: ZAPROSZENI
    const allAdults = guests.reduce((sum, g) => sum + (g.guest1_name ? 1 : 0) + (g.guest2_name ? 1 : 0), 0);
    const allChildren = guests.reduce((sum, g) => sum + (g.children ? g.children.length : 0), 0);
    const totalInvited = allAdults + allChildren;
    
    filteredGuests.forEach(guest => {
        const isConfirmed = guest.rsvp_status === 'confirmed'; 
        const countAdults = (guest.guest1_name ? 1 : 0) + (guest.guest2_name ? 1 : 0);
        const countChildren = (guest.children ? guest.children.length : 0);
        const maxPeople = countAdults + countChildren;
        
        let desc = [guest.guest1_name, guest.guest2_name].filter(Boolean).join(' & ');
        if(guest.children && guest.children.length > 0) desc += ` z dziećmi: ${guest.children.map(c => `${c.child_name} (${c.age}l)`).join(', ')}`;
        const row = document.createElement('tr');
        
        const cleanNotes = (guest.notes || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const notesButton = cleanNotes ? `<button type="button" class="notes-btn" onclick="alert('Uwagi od gościa:\\n${cleanNotes}')">Dieta / Uwagi</button>` : '';

        const confirmedAdultsInput = `<input type="number" value="${guest.confirmed_adults}" min="0" max="${countAdults}" onchange="confirmGuestUpdate(${guest.id}, 'confirmed_adults', this)" ${!isConfirmed ? 'disabled' : ''}>`;
        const confirmedChildrenInput = `<input type="number" value="${guest.confirmed_children}" min="0" max="${countChildren}" onchange="confirmGuestUpdate(${guest.id}, 'confirmed_children', this)" ${!isConfirmed ? 'disabled' : ''}>`;
        const afterPartyInput = `<input type="number" value="${guest.after_party}" min="0" max="${maxPeople}" onchange="confirmGuestUpdate(${guest.id}, 'after_party', this)" ${!isConfirmed ? 'disabled' : ''}>`;
        const statusHtml = getStatusHtml(guest.rsvp_status);
        const rsvpButton = `<button type="button" onclick="generateAndShowRsvpLink(${guest.id}, '${desc.replace(/'/g, "\\'")}')">Link RSVP / QR</button>`;
        const adminStatusSelect = getAdminStatusSelect(guest.id, guest.rsvp_status);

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
    
    // OBLICZENIA DLA STOPKI: POTWIERDZENI (Confirmed)
    const confirmedGuests = guests.filter(g => g.rsvp_status === 'confirmed');
    const finalAdults = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.confirmed_adults) || 0), 0);
    const finalChildren = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.confirmed_children) || 0), 0);
    const confirmedAccommodation = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.accommodation) || 0), 0);
    const confirmedAfterParty = confirmedGuests.reduce((sum, g) => sum + (parseInt(g.after_party) || 0), 0);

    tableFoot.innerHTML = `
        <tr>
            <td colspan="2">
                <strong>Zaproszeni:</strong> ${totalInvited} os. (Dorośli: ${allAdults}, Dzieci: ${allChildren})
            </td>
            <td style="font-weight: bold; background-color: var(--light-bg-color);">${finalAdults} os.</td>
            <td style="font-weight: bold; background-color: var(--light-bg-color);">${finalChildren} os.</td>
            <td>${confirmedAfterParty} os.</td>
            <td>${confirmedAccommodation} os.</td>
            <td></td>
        </tr>
    `;
    
    // Wywołania do innych modułów
    updateBudget(); 
    renderUnassignedGuests();
}


function confirmGuestUpdate(guestId, key, el) {
    const value = el.type === 'checkbox' ? el.checked : el.value;
    
    let finalValue;
    if (el.type === 'checkbox') {
        finalValue = value ? 'true' : 'false';
    } else if (key === 'rsvp_status') {
        finalValue = value; 
    } else {
        finalValue = parseInt(value); 
        if (isNaN(finalValue) || finalValue < 0) finalValue = 0;
    }
    
    const guest = guests.find(g => g.id == guestId);
    const guestName = [guest.guest1_name, guest.guest2_name].filter(Boolean).join(' & ');

    confirmAction(`Zmienić status dla grupy: ${guestName}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'update_guest_status');
        formData.append('guest_id', guestId);
        formData.append('key', key);
        formData.append('value', finalValue); 
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if(result.success) await renderAll();
        else {
            alert(result.message);
            el.value = guest[key];
        }
    }, () => { 
        el.value = guest[key]; 
    });
}

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
            guest.rsvp_token = token; 
        } else {
            alert(result.message || "Nie udało się wygenerować tokenu.");
            return;
        }
    }
    
    const rsvpUrl = `${window.location.origin}/rsvp.php?token=${token}`; 
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rsvpUrl)}`;
    
    document.getElementById("rsvpModalGuestName").textContent = `Dla: ${guestName}`;
    document.getElementById("rsvpLinkInput").value = rsvpUrl;
    document.getElementById("qrCodeImage").src = qrApiUrl;
    
    openModal('rsvp-link-modal'); 
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