// js/budget.js

// --- VENDOR RENDERING & CATEGORY MANAGEMENT ---

/**
 * Renderuje tabelę dostawców z grupowaniem po kategorii i wskaźnikami postępu.
 */
 
 function renderVendors() {
    renderVendorCategoriesList(); 
    fillVendorCategorySelects(); 

    const tableBody = document.getElementById("vendorTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    
    // 1. Logika grupowania po kategorii
    const groupedVendors = vendors.reduce((acc, vendor) => {
        const category = vendor.category_name || 'Brak Kategorii';
        if (!acc[category]) acc[category] = [];
        acc[category].push(vendor);
        return acc;
    }, {});

    // 2. Renderowanie tabeli z grupowaniem
    for (const category in groupedVendors) {
        // Nagłówek grupy (Kategoria)
        const headerRow = tableBody.insertRow();
        headerRow.innerHTML = `<td colspan="7" style="font-weight: bold; background-color: var(--light-bg-color); color: var(--secondary-color); text-align: left; padding: 10px;">${category}</td>`;
        
        groupedVendors[category].forEach(vendor => {
            const cost = parseFloat(vendor.cost);
            const totalPaid = parseFloat(vendor.total_paid) || 0;
            const remaining = cost - totalPaid;
            const percentage = cost > 0 ? Math.round((totalPaid / cost) * 100) : (totalPaid > 0 ? 100 : 0);
            const isFullyPaid = remaining <= 0.01 && cost > 0;

            const row = tableBody.insertRow();
            row.className = 'vendor-row';
            // ZMIANA: KLIKNIĘCIE CAŁEGO WIERSZA OTWIERA MODAL PŁATNOŚCI
            row.onclick = () => showVendorPaymentsModal(vendor.id, vendor.name, cost, totalPaid); 

            // Używamy 6 kolumn, ale ostatnia kolumna będzie AKCJAMI
            row.innerHTML = `
                <td>${vendor.name}</td>
                <td>${cost.toFixed(2)} PLN</td>
                <td>${totalPaid.toFixed(2)} PLN</td>
                <td style="color: ${remaining > 0 ? '#d32f2f' : 'var(--success-color)'}; font-weight: bold;">${remaining.toFixed(2)} PLN</td>
                <td>${vendor.payment_date || '-'}</td>
                <td style="cursor: pointer;">
                    <div class="progress-bar-container" title="${totalPaid.toFixed(2)} PLN / ${cost.toFixed(2)} PLN">
                        <div class="progress-bar" style="width: ${percentage}%; background-color: ${isFullyPaid ? 'var(--success-color)' : 'var(--payment-color)'};">${percentage > 0 ? percentage + '%' : ''}</div>
                    </div>
                </td>
                <!-- DODANIE OSOBNEJ KOLUMNY DLA AKCJI - by uniknąć problemów z 'event.stopPropagation()' -->
                <td style="cursor: default;">
                     <button type="button" onclick="event.stopPropagation(); openAddPaymentModal(${vendor.id}, '${vendor.name}', ${cost.toFixed(2)}, ${totalPaid.toFixed(2)})" style="font-size: 0.7em; padding: 3px 6px; margin-top: 5px;">+ Wpłata</button>
                     <button type="button" onclick="openModal('edit-vendor-modal', ${vendor.id})" style="font-size: 0.7em; padding: 3px 6px; margin-top: 5px;">Edytuj</button>
                </td>
            `;
        });
    }
}


async function showVendorPaymentsModal(vendorId, vendorName, totalCost, totalPaid) {
    // 1. Zabezpieczenie przed wielokrotnym kliknięciem (opcjonalne, ale dobre)
    const detailsContainer = document.getElementById('paymentsDetails');
    if (!detailsContainer) return;

    // 2. Ustawianie nagłówka modala
    document.getElementById("paymentsModalVendorName").textContent = 
        `Płatności dla: ${vendorName} (Koszt całkowity: ${totalCost.toFixed(2)} PLN, Zapłacono: ${totalPaid.toFixed(2)} PLN)`;
    
    // Wyczyść i wstaw komunikat ładowania
    detailsContainer.innerHTML = 'Ładowanie szczegółów płatności...';
    
    // Otwórz modal z ładowaniem (funkcja z js/modals.js)
    openModal('vendor-payments-modal'); 

    try {
        // 3. Pobieranie rat z API (zakładamy, że api_data.php jest gotowe)
        const response = await fetch(`api_data.php?dataType=vendor_payments&vendorId=${vendorId}`);
        const payments = await response.json();

        if (!Array.isArray(payments) || payments.error) throw new Error('Błąd odczytu płatności z serwera.');

        if (payments.length === 0) {
            detailsContainer.innerHTML = '<p>Brak zarejestrowanych płatności dla tego dostawcy.</p>';
            return;
        }

        // 4. Generowanie HTML dla rat
        let html = '<table class="payments-list"><thead><tr><th>Data</th><th>Kwota</th><th>Opis</th><th>Akcje</th></tr></thead><tbody>';
        
        payments.forEach(p => {
            // Użycie toFixed(2) dla lepszego formatowania kwoty
            const amountFormatted = parseFloat(p.amount).toFixed(2);
            
            html += `<tr>
                        <td>${p.payment_date}</td>
                        <td>${amountFormatted} PLN</td>
                        <td>${p.description || '-'}</td>
                        <td>
                            <!-- Przycisk usuwania raty -->
                            <button type="button" 
                                onclick="confirmRemovePayment(${p.id}, '${vendorName}', '${amountFormatted}')" 
                                style="background-color: #d32f2f; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 0.75em;">
                                Usuń
                            </button>
                        </td>
                    </tr>`;
        });

        html += '</tbody></table>';
        detailsContainer.innerHTML = html;

    } catch (error) {
        detailsContainer.innerHTML = `<p style="color: red;">Wystąpił błąd podczas ładowania rat: ${error.message}</p>`;
        console.error("Błąd ładowania rat:", error);
    }
}

// NOWA FUNKCJA: Obsługa usuwania pojedynczej raty
async function confirmRemovePayment(paymentId, vendorName, amount) {
    // Musimy zatrzymać propagację, aby modal się nie zamknął, ale już jesteśmy w modalu.
    confirmAction(`Czy na pewno usunąć płatność (${amount} PLN) dla ${vendorName}?`, async () => {
        const formData = new FormData();
        formData.append('action', 'delete_vendor_payment'); // NOWA AKCJA!
        formData.append('payment_id', paymentId);
        
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            // Po usunięciu raty, odśwież wszystko, aby zaktualizować sumy i zamknij modal płatności
            await renderAll();
            closeModal('vendor-payments-modal'); 
        } else {
            alert(result.message || "Błąd podczas usuwania płatności.");
        }
    });
}
/**
 * Renderuje listę kategorii w sekcji zarządzania (z przyciskami do usuwania).
 */
function renderVendorCategoriesList() {
    const list = document.getElementById('categoryList');
    if (!list) return;
    list.innerHTML = '';
    
    vendorCategories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="padding: 5px 10px; background-color: var(--accent-color); border-radius: 20px; color: var(--primary-color); display: flex; align-items: center; gap: 5px;">${cat.name} 
                            <button type="button" class="remove-child-btn" onclick="confirmRemoveCategory(${cat.id}, '${cat.name}')">X</button>
                        </span>`;
        list.appendChild(li);
    });
}

function fillVendorCategorySelects() {
    const addSelect = document.getElementById('vendorCategory');
    const editSelect = document.getElementById('editVendorCategory');

    // Używamy tablicy, aby przetworzyć oba elementy naraz
    [addSelect, editSelect].forEach(select => {
        // Kontynuuj tylko jeśli element istnieje w DOM
        if (!select) return; 
        
        // *Ważne: Nie ma potrzeby zachowywania currentSelectedId dla formularza dodawania*
        // Ale zachowaj dla formularza edycji, aby po renderAll wartość nie zniknęła
        const currentSelectedId = (select.id === 'editVendorCategory' && select.value !== '0') ? select.value : '0';

        select.innerHTML = '<option value="0">Wybierz kategorię...</option>';
        
        vendorCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            // Sprawdź czy ID jest zgodne z zapisanym
            if (cat.id == currentSelectedId) option.selected = true;
            select.appendChild(option);
        });
        
        // Jeśli jest to select edycji, spróbuj ustawić category_id na 0
        if (select.id === 'editVendorCategory') {
            // Wartość domyślna musi być ustawiona na nowo, jeśli nie było kategorii
            if (!select.value) select.value = '0';
        }
    });
}

/**
 * Wypełnia pola SELECT w formularzach dodawania/edycji dostawców.
 */
function renderVendorCategorySelects() {
    // Selecty dla dodawania i edycji
    const selects = [document.getElementById('vendorCategory'), document.getElementById('editVendorCategory')];
    
    selects.forEach(select => {
        if (!select) return;
        // Pamiętaj, który ID był wybrany (dla edycji, by nie zresetować po renderAll)
        const currentSelectedId = select.dataset.selectedId || select.value;
        select.innerHTML = '<option value="0">Wybierz kategorię...</option>';
        
        vendorCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            if (cat.id == currentSelectedId) option.selected = true;
            select.appendChild(option);
        });
        select.dataset.selectedId = currentSelectedId; // Zachowaj wybrane ID
    });
}

/**
 * Logika potwierdzenia usunięcia kategorii.
 */
function confirmRemoveCategory(categoryId, categoryName) {
    confirmAction(`Czy na pewno usunąć kategorię: ${categoryName}? Powiązani dostawcy stracą kategorię!`, async () => {
        const formData = new FormData();
        formData.append('action', 'delete_vendor_category');
        formData.append('category_id', categoryId);
        const response = await fetch('index.php', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) await renderAll();
        else alert(result.message);
    });
}
/**
 * Wypełnia pojedyncze pole SELECT kategoriami.
 */
function populateCategorySelect(selectElement, selectedId) {
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="0">Wybierz kategorię...</option>';
    
    vendorCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        if (cat.id == selectedId) option.selected = true;
        selectElement.appendChild(option);
    });
}