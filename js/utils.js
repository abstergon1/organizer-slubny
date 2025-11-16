// js/utils.js

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

        // Resetowanie formularza
        if (form.classList.contains('task-input') || form.classList.contains('guest-form') || form.classList.contains('vendor-form') || form.classList.contains('table-controls') || form.id === 'add-invite-user-form' || form.id === 'create-user-form') {
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


function confirmAction(message, onConfirm, onCancel) {
    if (confirm(message)) onConfirm();
    else if (onCancel) onCancel();
}

/**
 * Podpina zdarzenia do przycisków nawigacji.
 */
function setupNavigation() {
    document.querySelectorAll('.nav-button').forEach(button => {
        button.addEventListener('click', () => { showPage(button.dataset.page); });
    });
}

function showPage(pageId) {

    // 1. Ukryj wszystkie strony
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none'; // Używamy stylu inline dla największego priorytetu
    });

    // 2. Znajdź i POKAŻ stronę
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
        pageToShow.style.display = 'block'; // NADPISZ WSZYSTKO
    } else {
        console.error("showPage: Nie znaleziono elementu o ID:", pageId);
    }

    // 3. Zaktualizuj przyciski nawigacyjne (UI)
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });
}

function toggleLoading(isLoading) {
    const mainButton = document.querySelector('.export-buttons button[onclick="exportToPDF()"]');
    if (!mainButton) return;
    
    // Logika do włączania/wyłączania przycisku Eksport
    if (isLoading) {
        mainButton.textContent = 'Generowanie PDF... Proszę czekać.';
        mainButton.disabled = true;
        mainButton.style.backgroundColor = '#FF9800'; 
    } else {
        mainButton.textContent = 'Eksportuj do PDF';
        mainButton.disabled = false;
        mainButton.style.backgroundColor = 'var(--secondary-color)'; 
    }
}