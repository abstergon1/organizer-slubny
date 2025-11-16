// js/export.js

function exportToPDF() {
    // Sprawdzenie (Używamy try-catch dla wydajności)
    if (typeof jsPDF === 'undefined' || typeof jsPDF.API.autoTable === 'undefined') { 
        alert('Błąd: Biblioteka jsPDF nie jest poprawnie załadowana. Sprawdź pliki w konsoli przeglądarki (F12).'); 
        return; 
    }
    
    toggleLoading(true);

    try {
        const doc = new jsPDF.jsPDF(); 
        const weddingDate = document.getElementById("weddingDate").value || "Nie ustawiono";
        const totalConfirmed = guests.filter(g => g.rsvp_status === 'confirmed').reduce((sum, g) => sum + (parseInt(g.confirmed_adults) || 0) + (parseInt(g.confirmed_children) || 0), 0);

        // --- NAGŁÓWEK ---
        doc.setFontSize(18); 
        doc.text(`Raport Ślubny - Data: ${weddingDate}`, 14, 22);
        doc.setFontSize(10);
        doc.text(`Potwierdzona liczba Gości (Dorosłych i Dzieci): ${totalConfirmed}`, 14, 28);
        
        let finalY = 35; 
        
        // --- SEKCJA 1: LISTA GOŚCI ---
        doc.setFontSize(14); doc.text("1. Lista Gości (Szczegóły RSVP)", 14, finalY); finalY += 5;
        
        const guestBody = [];
        guests.forEach(g => {
            const groupName = [g.guest1_name, g.guest2_name].filter(Boolean).join(" & ");
            const rsvpStatus = (g.rsvp_status === 'confirmed' && g.confirmed_adults > 0) ? `TAK (${g.confirmed_adults} dor.)` : (g.rsvp_status === 'rejected' ? 'REZYGNACJA' : 'CZEKAMY');
            const afterParty = g.after_party > 0 ? `${g.after_party} os.` : 'Nie';
            const accommodation = g.accommodation > 0 ? `${g.accommodation} os.` : 'Nie';
            const childrenInfo = g.children && g.children.length > 0 
                ? g.children.map(c => `${c.child_name} (${c.age}l)`).join(', ') 
                : 'Brak';
            
            guestBody.push([
                groupName, rsvpStatus, `${g.confirmed_children || 0} dz.`, afterParty, accommodation, 
                childrenInfo, g.notes || '-'
            ]);
        });
        
        doc.autoTable({ 
            startY: finalY + 5, 
            head: [["Grupa Gości", "Obecność (Dor.)", "Potw. Dzieci", "Poprawiny", "Nocleg", "Dzieci (Zaprosz.)", "Uwagi"]], 
            body: guestBody, 
            headStyles: { fillColor: [74, 20, 140], fontSize: 9 },
            styles: { fontSize: 8, overflow: 'linebreak' },
            columnStyles: { 6: { cellWidth: 30 } } 
        });
        finalY = doc.autoTable.previous.finalY;

        // --- SEKCJA 2: PLAN STOŁÓW ---
        doc.setFontSize(14); 
        doc.text("2. Plan Stołów", 14, finalY + 15); finalY += 20;

        tables.forEach(table => {
            finalY = doc.autoTable.previous ? doc.autoTable.previous.finalY : finalY; 
            
            const seatingBody = [];
            seatingBody.push([{ 
                content: `${table.name} (${table.shape === 'round' ? 'Okrągły' : 'Prostokątny'} - Miejsca: ${table.seats.length})`, 
                colSpan: 3, 
                styles: { fontStyle: "bold", fillColor: [243, 229, 245], textColor: [74, 20, 140] } 
            }]);
            
            let occupiedCount = 0;
            table.seats.forEach((seat, seatIndex) => { 
                let personName = seat.person_name || "Wolne"; 
                let type = seat.person_id ? (seat.person_type === 'child' ? 'Dziecko' : 'Dorosły') : '-';
                if (seat.person_id) occupiedCount++;
                seatingBody.push([`Miejsce ${seatIndex + 1}`, personName, type]); 
            });
            
            seatingBody.push([{ content: `Zajęte: ${occupiedCount}/${table.capacity}`, colSpan: 3, styles: { fontStyle: "italic", fillColor: [240, 240, 240] } }]);
            
             doc.autoTable({ 
                startY: finalY + 5, 
                head: [["Miejsce na Stole", "Gość", "Typ"]], 
                body: seatingBody, 
                headStyles: { fillColor: [74, 20, 140], fontSize: 9 },
                styles: { fontSize: 8, overflow: 'linebreak' }
            });
            finalY = doc.autoTable.previous.finalY;
        });
        
        // 2.2 Goście Nieprzypisani
        const unassignedBody = [];
        const assignedPeopleIds = new Set(tables.flatMap(t => t.seats.filter(s => s.person_id).map(s => `${s.person_type}-${s.person_id}`)));
        
        guests.filter(g => g.rsvp_status === 'confirmed').forEach(family => {
            const confirmedAdults = parseInt(family.confirmed_adults) || 0;
            const confirmedChildren = parseInt(family.confirmed_children) || 0;
            const groupName = [family.guest1_name, family.guest2_name].filter(Boolean).join(" & ");
            
            if (confirmedAdults > 0 && family.guest1_name && !assignedPeopleIds.has(`guest1-${family.id}`)) { unassignedBody.push([family.guest1_name, 'Dorosły', groupName]); }
            if (confirmedAdults > 1 && family.guest2_name && !assignedPeopleIds.has(`guest2-${family.id}`)) { unassignedBody.push([family.guest2_name, 'Dorosły', groupName]); }
            if (confirmedChildren > 0 && family.children) {
                family.children.forEach((child) => {
                    if (!assignedPeopleIds.has(`child-${child.id}`)) { unassignedBody.push([`${child.child_name} (${child.age}l)`, 'Dziecko', groupName]); }
                });
            }
        });

        if (unassignedBody.length > 0) {
            doc.setFontSize(12); doc.text("Goście POTWIERDZENI, ale nieprzypisani do stołu:", 14, finalY + 10); finalY += 10;
            doc.autoTable({ 
                startY: finalY + 5, 
                head: [["Imię", "Typ", "Grupa"]], 
                body: unassignedBody, 
                headStyles: { fillColor: [255, 171, 64], fontSize: 9 },
                styles: { fontSize: 8 }
            });
            finalY = doc.autoTable.previous.finalY;
        }
        
        // --- SEKCJA 3: BUDŻET ---
        const vendorBody = vendors.map(v => [ 
            v.name, parseFloat(v.cost).toFixed(2), (parseFloat(v.total_paid) || 0).toFixed(2), 
            parseInt(v.paid_full_status) === 1 ? "Tak" : "Nie", v.payment_date || '-'
        ]);
        
        doc.setFontSize(14); doc.text("3. Budżet - Usługodawcy", 14, finalY + 15); finalY += 20;
        doc.autoTable({ 
            startY: finalY + 5, 
            head: [["Usługa", "Koszt (PLN)", "Zapłacono (PLN)", "Opłacone w całości", "Termin"]], 
            body: vendorBody, 
            headStyles: { fillColor: [74, 20, 140], fontSize: 9 },
            styles: { fontSize: 8 }
        });
        
        doc.save("Raport_Slubny.pdf");
        
    } catch (e) {
        alert("Wystąpił błąd podczas generowania PDF: " + e.message);
        console.error("Błąd PDF:", e);
    } finally {
        toggleLoading(false);
    }
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') { alert('Biblioteka Excel nie została jeszcze załadowana.'); return; }
    // ... (Logika eksportu do Excela) ...
}

function exportDataToFile() {
    // ... (Logika eksportu danych) ...
}

function toggleLoading(isLoading) {
    const mainButton = document.querySelector('.export-buttons button[onclick="exportToPDF()"]');
    if (!mainButton) return;
    
    if (isLoading) {
        mainButton.textContent = 'Generowanie PDF... Proszę czekać.';
        mainButton.disabled = true;
        mainButton.style.backgroundColor = '#FF9800'; 
    } else {
        mainButton.textContent = 'Eksportuj do PDF';
        mainButton.disabled = false;
        mainButton.style.backgroundColor = '#7b1fa2'; 
    }
}


function exportAllQRCodes() {
    // 1. Wizualna informacja dla użytkownika
    const exportBtn = document.querySelector('.export-buttons button[onclick="exportAllQRCodes()"]');
    if (exportBtn) {
        exportBtn.textContent = 'Przygotowywanie ZIP...';
        exportBtn.disabled = true;
    }
    
    // 2. Wymuszenie pobrania pliku z serwera
    // Używamy bezpośredniego przekierowania, ponieważ serwer ma zwrócić plik ZIP
    window.location.href = 'api_qr_export.php';

    // 3. Używamy setTimeout, aby zresetować przycisk po krótkiej chwili
    // W tle serwer już generuje ZIP, a przeglądarka rozpocznie pobieranie.
    setTimeout(() => {
        if (exportBtn) {
            exportBtn.textContent = 'Pobierz wszystkie QR Kody (ZIP)';
            exportBtn.disabled = false;
        }
    }, 3000); // Reset po 3 sekundach
}