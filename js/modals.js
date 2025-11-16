// js/modals.js (POPRAWIONA WERSJA)

// UWAGA: Aby ten kod działał, musi być załadowany PO js/globals.js i js/budget.js.

function openModal(modalId, recordId) {
    
    // --- 1. MODAL EDYCJI DOSTAWCY (edit-vendor-modal) ---
    if (modalId === "edit-vendor-modal") {
        const vendor = vendors.find(v => v.id == recordId); 
        if (!vendor) return;

        // Ustawienie wartości pola kategorii (musi być wypełnione wczesniej przez js/budget.js)
        const categorySelectEl = document.getElementById("editVendorCategory");
        if (categorySelectEl) {
            categorySelectEl.value = vendor.category_id || 0; // Ustaw ID kategorii dostawcy (lub 0)
        }
	    
        // Ustawianie reszty pól dostawcy
        const vendorIdEl = document.getElementById("editVendorId");
        if (vendorIdEl) vendorIdEl.value = vendor.id;

        const vendorNameEl = document.getElementById("editVendorName");
        if (vendorNameEl) vendorNameEl.value = vendor.name;

        const vendorCostEl = document.getElementById("editVendorCost");
        if (vendorCostEl) vendorCostEl.value = vendor.cost;

        const paymentDateEl = document.getElementById("editVendorPaymentDate");
        if (paymentDateEl) paymentDateEl.value = vendor.payment_date;
    
    } 
    
    // --- 2. MODAL EDYCJI GOŚCIA (edit-guest-modal) ---
    else if (modalId === "edit-guest-modal") { // Użyj else if, aby obsłużyć gościa
        const guest = guests.find(g => g.id == recordId); 
        if (!guest) return;
        
        // Ustawianie pól gościa
        const guestIdEl = document.getElementById("editGuestId");
        if(guestIdEl) guestIdEl.value = guest.id; 

        const guest1NameEl = document.getElementById("editGuest1Name");
        if(guest1NameEl) guest1NameEl.value = guest.guest1_name; 

        const guest2NameEl = document.getElementById("editGuest2Name");
        if(guest2NameEl) guest2NameEl.value = guest.guest2_name;
        
        // Dzieci
        const childrenContainer = document.getElementById("edit-children-inputs"); 
        if(childrenContainer) childrenContainer.innerHTML = ""; // Wyczyść stare

        if(guest.children) {
            guest.children.forEach(child => {
                const div = document.createElement("div"); const namePrefix = 'editChild';
                div.innerHTML = `<input type="text" value="${child.child_name}" name="${namePrefix}Name[]"><input type="number" value="${child.age}" min="0" name="${namePrefix}Age[]"><button type="button" class="remove-child-btn" onclick="this.parentElement.remove()">X</button>`;
                if(childrenContainer) childrenContainer.appendChild(div);
            });
        }
    }

    // Upewnij się, że element modalny istnieje
    const modalEl = document.getElementById(modalId);
    if (modalEl) modalEl.style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

function addChildInput(mode = 'add') {
    const container = document.getElementById(mode === "add" ? "children-inputs" : "edit-children-inputs");
    const div = document.createElement("div");
    const namePrefix = mode === 'add' ? 'addChild' : 'editChild';
    div.innerHTML = `<input type="text" placeholder="Imię dziecka" name="${namePrefix}Name[]"><input type="number" placeholder="Wiek" min="0" name="${namePrefix}Age[]"><button type="button" class="remove-child-btn" onclick="this.parentElement.remove()">X</button>`;
    container.appendChild(div);
}

// NOWA FUNKCJA: Otwieranie modalu dodawania płatności
function openAddPaymentModal(vendorId, vendorName, totalCost, totalPaid) {
    document.getElementById("paymentVendorId").value = vendorId;
    document.getElementById("paymentModalTitle").textContent = `Rejestracja płatności dla: ${vendorName}`;
    const remaining = totalCost - totalPaid;
    document.getElementById("paymentAmount").placeholder = `Kwota (pozostało: ${remaining.toFixed(2)} PLN)`;
    document.getElementById("paymentAmount").max = remaining > 0 ? remaining.toFixed(2) : 0.01;
    document.getElementById("add-payment-modal").style.display = "flex";
}