// js/globals.js

// --- GLOBALNE ZMIENNE (DANE) ---
let tasks = [], guests = [], vendors = [], tables = [], users = [];
let currentDate = new Date();
let guestFilterState = 'all';
let countdownInterval;
let vendorCategories = []; // DODANO NOWĄ ZMIENNĄ GLOBALNĄ

// --- GŁÓWNE FUNKCJE ASYNCHRONICZNE (KONTROLER DANYCH) ---

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
 * Po pobraniu danych, odświeża wszystkie widoki.
 */
async function renderAll() {
    // DODANO 'vendor_categories' DO LISTY DO POBRANIA
    const dataToFetch = ['settings', 'tasks', 'guests', 'vendors', 'tables', 'organizer_users', 'vendor_categories']; 
    const [settingsData, tasksData, guestsData, vendorsData, tablesData, usersData, vendorCategoriesData] = await Promise.all(
        dataToFetch.map(type => fetchData(type))
    );

    // Aktualizacja ustawień i pól w DOM
    if (settingsData && typeof settingsData === 'object' && !Array.isArray(settingsData)) {
        const weddingDateEl = document.getElementById('weddingDate');
        if (weddingDateEl) {
            weddingDateEl.value = settingsData.wedding_date || '';
            document.getElementById('weddingTime').value = settingsData.wedding_time || '16:00'; 
            document.getElementById('rsvpDeadlineDate').value = settingsData.rsvp_deadline_date || '';
            document.getElementById('hidden_wedding_date').value = settingsData.wedding_date || '';
            document.getElementById('priceAdult').value = settingsData.price_adult || '0';
            document.getElementById('priceChildOlder').value = settingsData.price_child_older || '0';
            document.getElementById('priceChildYounger').value = settingsData.price_child_younger || '0';
            document.getElementById('priceAccommodation').value = settingsData.price_accommodation || '0';
            
            const ageOlderMinEl = document.getElementById('age_older_min');
            if (ageOlderMinEl) ageOlderMinEl.value = settingsData.age_older_min || '4';
            const ageOlderMaxEl = document.getElementById('age_older_max');
            if (ageOlderMaxEl) ageOlderMaxEl.value = settingsData.age_older_max || '10';
            const ageAdultMinEl = document.getElementById('age_adult_min');
            if (ageAdultMinEl) ageAdultMinEl.value = settingsData.age_adult_min || '11';
            
            // Wypełnienie pól CMS (RODO, Zdjęcia)
            const photosInfoEl = document.getElementById('photos_info');
            if (photosInfoEl) photosInfoEl.value = settingsData.photos_info ?? photosInfoEl.value; 
            const rodoInfoEl = document.getElementById('rodo_info');
            if (rodoInfoEl) rodoInfoEl.value = settingsData.rodo_info ?? rodoInfoEl.value;

            setupCountdown();
            updateBudgetDisplay(); 
        }
    }

    // Aktualizacja globalnych tablic
    tasks = Array.isArray(tasksData) ? tasksData : [];
    guests = Array.isArray(guestsData) ? guestsData : [];
    vendors = Array.isArray(vendorsData) ? vendorsData : [];
    tables = Array.isArray(tablesData) ? tablesData : [];
    users = Array.isArray(usersData) ? usersData : [];
    vendorCategories = Array.isArray(vendorCategoriesData) ? vendorCategoriesData : []; // AKTUALIZACJA

    // Wywołanie funkcji renderujących (zdefiniowane w innych plikach)
    renderTasks(); 
    renderCalendar();
    renderGuests();
    renderVendors();
    renderTables(); 
    renderUnassignedGuests();
    renderUsers();
    updateBudget(); // Wywołane po wszystkich renderach
}


// --- FUNKCJE BUDŻETOWE (Obliczenia) ---

/**
 * Logika do obliczania całkowitego budżetu na podstawie cen i potwierdzonych gości.
 */
function updateBudget() {
    const priceAdultEl = document.getElementById("priceAdult");
    if (!priceAdultEl) return;
    
    // Pobieranie cen
    const pA = parseFloat(priceAdultEl.value) || 0;
    const pCO = parseFloat(document.getElementById("priceChildOlder").value) || 0;
    const pCY = parseFloat(document.getElementById("priceChildYounger").value) || 0;
    const pAcc = parseFloat(document.getElementById("priceAccommodation").value) || 0;
    
    // POBIERANIE DYNAMICZNYCH WIDEŁEK WIEKOWYCH
    const ageOlderMin = parseInt(document.getElementById('age_older_min')?.value) || 4;
    const ageOlderMax = parseInt(document.getElementById('age_older_max')?.value) || 10;
    const ageAdultMin = parseInt(document.getElementById('age_adult_min')?.value) || 11;
    const ageYoungerMax = ageOlderMin > 0 ? ageOlderMin - 1 : 0; 
    
    let mealCost = 0, accommCost = 0;

    // Implementacja precyzyjnego walidatora wieku
    guests.filter(g => g.rsvp_status === 'confirmed').forEach(g => {
        const confirmedAdults = parseInt(g.confirmed_adults) || 0;
        const confirmedChildren = parseInt(g.confirmed_children) || 0;
        
        // 1. KOSZT DOROSŁYCH:
        mealCost += confirmedAdults * pA;
        
        // 2. KOSZT DZIECI: 
        if (confirmedChildren > 0 && g.children) {
            
            const sortedChildren = g.children.sort((a, b) => b.age - a.age);
            
            let childrenCounted = 0;
            
            sortedChildren.forEach(child => {
                if (childrenCounted < confirmedChildren) { 
                    
                    const age = parseInt(child.age) || 0;

                    if (age >= ageAdultMin) { 
                        mealCost += pA;
                    } else if (age >= ageOlderMin && age <= ageOlderMax) { 
                        mealCost += pCO;
                    } else if (age <= ageYoungerMax) { 
                        mealCost += pCY;
                    } else {
                         mealCost += pA; 
                    }
                    childrenCounted++;
                }
            });
        }
        
        // 3. KOSZT NOCLEGU: 
        accommCost += (parseInt(g.accommodation) || 0) * pAcc;
    });

	let vendorTotal = vendors.reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);
    let totalPaid = vendors.reduce((sum, v) => sum + (parseFloat(v.total_paid) || 0), 0);
    
    const totalCost = mealCost + accommCost + vendorTotal;
    const totalRemaining = totalCost - totalPaid;

    // --- KLUCZOWA ZMIANA: ZASTOSOWANIE formatowania z separatorami ---
    const formatter = new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    
    // Zmienna do formatowania, która jest bardziej niezawodna (tylko w celu upewnienia się, że symbol tysięczny jest spacją)
    const formatValue = (value) => {
        // Natywnie formatuje i zamienia symbol waluty na czystą spację, by uniknąć &nbsp;
        // Zmiana polega na użyciu metody do zamiany spacj i symbolu na sam format liczby
        let formatted = formatter.format(value);
        
        // Jeżeli format jest "5 910,50 zł", chcemy to zachować
        // Jeżeli format jest "5910,50 zł", chcemy to zachować i polegać na native
        
        // Zostawiamy natywne formatowanie, ale usuwamy symbol waluty dla szczegółów
        return formatted;
    }

    // Używamy natywnego formatowania, które działa poprawnie, ale upewniamy się, że
    // w przeglądarce nie ma dodatkowych stylów lub błędów.
    document.getElementById("guestMealCost").textContent = formatter.format(mealCost);
    document.getElementById("guestAccommCost").textContent = formatter.format(accommCost);
    document.getElementById("vendorTotalCost").textContent = formatter.format(vendorTotal);
    
    document.getElementById("totalWeddingCost").textContent = formatter.format(totalCost);
    document.getElementById("totalPaid").textContent = formatter.format(totalPaid);
    document.getElementById("totalRemaining").textContent = formatter.format(totalRemaining);
    
	// Ustawienie koloru w zależności od pozostałej kwoty
    const remainingEl = document.getElementById("totalRemaining");
    if (remainingEl) {
        if (totalRemaining <= 0.01) {
            remainingEl.style.color = 'var(--success-color)';
        } else {
            remainingEl.style.color = 'var(--primary-color)'; 
        }
    }
}

/**
 * Aktualizuje wyświetlane zakresy wiekowe w sekcji Budżet.
 */
function updateBudgetDisplay() {
    const ageOlderMin = parseInt(document.getElementById('age_older_min')?.value) || 4;
    const ageOlderMax = parseInt(document.getElementById('age_older_max')?.value) || 10;
    const ageAdultMin = parseInt(document.getElementById('age_adult_min')?.value) || 11;
    
    const finalYoungerMax = ageOlderMin > 0 ? ageOlderMin - 1 : 0;
    
    const rangeOlderEl = document.getElementById('ageOlderRange');
    if (rangeOlderEl) rangeOlderEl.textContent = `${ageOlderMin}-${ageOlderMax}`;
    
    const rangeYoungerEl = document.getElementById('ageYoungerMax');
    if (rangeYoungerEl) rangeYoungerEl.textContent = finalYoungerMax;
    
    updateBudget(); 
}