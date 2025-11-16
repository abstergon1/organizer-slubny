// js/main.js

// --- INICJALIZACJA ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Używamy setTimeout, aby dać 50ms na zainicjowanie globalnych obiektów JS/PDF
    setTimeout(async () => {
        setupNavigation();
        
        // Bezpieczne ustawienie aktywnej strony
        const activeButton = document.querySelector('.nav-button.active');
        if (activeButton) {
            showPage(activeButton.dataset.page);
        }
        
        // Rozpoczynamy cykl pobierania danych i renderowania
        await renderAll(); 

        document.querySelectorAll('.ajax-form').forEach(form => {
            form.addEventListener('submit', handleFormSubmit);
        });
        
    }, 50); // OPÓŹNIENIE 50ms NA START WSZYSTKIEGO
});