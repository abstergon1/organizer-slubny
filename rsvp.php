<?php
require_once 'functions.php'; // Musi załadować funkcje (które załadują db_connect)

// Zdefiniowanie URLa aplikacji
$base_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";

$token = $_GET['token'] ?? null;
$guest = null;
$error = null;
$success = null;
$settings = [];

// Musimy pobrać ustawienia organizera
if ($token) {
    $guest = get_guest_by_token($token);
    
    if ($guest && $guest['organizer_id']) {
        // Pobranie dynamicznych ustawień
        $settings = get_settings($guest['organizer_id']);
    }

    if (!$guest) {
        $error = "Nieprawidłowy link do potwierdzenia obecności.";
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Krok 2: Obsługa odpowiedzi RSVP
        $confirmed = isset($_POST['confirmed']) && $_POST['confirmed'] === 'true';
        $accommodation = (int)($_POST['accommodation'] ?? 0);
        $notes = trim($_POST['notes'] ?? '');
        $after_party = (int)($_POST['after_party_count'] ?? 0);
        
        // Jeśli gość nie potwierdza, nie może żądać noclegu ani poprawin.
        if (!$confirmed) {
            $accommodation = 0;
            $after_party = 0;
        }
        
        
		
		if (update_rsvp_response($guest['id'], $confirmed, $accommodation, $notes, $after_party)) {
            // ZMIANA: Lepszy komunikat o rezygnacji
            if ($confirmed) {
                 $success = "Dziękujemy za potwierdzenie! Więcej informacji poniżej.";
            } else {
                 $success = "Dziękujemy za informację. Państwa rezygnacja została odnotowana. Będziemy tęsknić!";
            }
                        // Odśwież dane gościa po aktualizacji
            $guest = get_guest_by_token($token);
        } else {
            $error = "Wystąpił błąd podczas zapisywania odpowiedzi.";
        }
    }
} else {
    $error = "Brak wymaganego tokenu dostępu. Sprawdź zaproszenie.";
}

// --- WIDOK HTML DLA GOŚCI (Zaktualizowany) ---
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potwierdzenie Obecności na weselu</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f3e5f5; color: #333; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .rsvp-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 500px; width: 90%; text-align: center; }
        h1 { color: #4a148c; margin-bottom: 20px; }
        h3 { color: #7b1fa2; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #e1bee7; padding-bottom: 5px; }
        .guest-name { font-size: 1.2em; font-weight: bold; margin-bottom: 15px; }
        .message.error { color: #d32f2f; font-weight: bold; }
        .message.success { color: #4caf50; font-weight: bold; }
        form label { display: block; margin-top: 15px; font-weight: bold; text-align: left; }
        form input[type="number"], form input[type="text"], form select, form textarea { width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
        form textarea { min-height: 80px; resize: vertical; }
        form button { background-color: #7b1fa2; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; transition: background-color 0.3s; }
        form button:hover { background-color: #4a148c; }
        .status-badge { display: inline-block; padding: 5px 10px; border-radius: 5px; margin-bottom: 15px; font-weight: bold; }
        .status-unconfirmed { background-color: #ffccbc; color: #d32f2f; }
        .status-pending { background-color: #ffe082; color: #ffa000; }
        .status-confirmed { background-color: #c8e6c9; color: #388e3c; }
        .info-box { padding: 15px 0; text-align: left; margin-top: 20px; font-size: 0.9em; }
        .info-box p, .info-box ul { margin: 5px 0; }
        .map-container { overflow: hidden; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
        .map-container iframe { width: 100%; height: 200px; border: none; }
    </style>
</head>
<body>
    <div class="rsvp-container">
        <h1>Potwierdzenie Obecności na weselu</h1>

        <?php if ($error): ?>
            <p class="message error"><?php echo htmlspecialchars($error); ?></p>
        <?php elseif ($guest): 
            // Zmienne dla nazw i liczenia
            $guest_names = array_filter([$guest['guest1_name'], $guest['guest2_name']]);
            $total_people = count($guest_names) + count($guest['children']);
            $names_string = implode(' & ', $guest_names);
            if (count($guest['children']) > 0) {
                $names_string .= " (oraz " . count($guest['children']) . " dzieci)";
            }
            
            // Zmienne dla informacji z bazy
            $bride_contact = htmlspecialchars($settings['contact_bride_phone'] ?? 'Brak');
            $groom_contact = htmlspecialchars($settings['contact_groom_phone'] ?? 'Brak');
        ?>
            <p class="guest-name">Szanowni Państwo: <?php echo htmlspecialchars($names_string); ?></p>
            
            <p class="status-badge status-<?php echo htmlspecialchars($guest['rsvp_status']); ?>">
                Aktualny Status: 
                <?php
                    if ($guest['rsvp_status'] === 'unconfirmed') echo 'Czekamy na Państwa odpowiedź';
                    if ($guest['rsvp_status'] === 'pending') echo 'Oczekuje na powinformowanie Państwa Młodych, do czasu ich zatweirdzenia mogą Państwo edytować poniższe dane';
                    if ($guest['rsvp_status'] === 'confirmed') echo 'Obecność potwierdzona przez Państwa Młodych';
                ?>
            </p>

            <?php if ($success): ?>
                <p class="message success"><?php echo htmlspecialchars($success); ?></p>
            <?php endif; ?>

            <?php 
                // ZMIANA: Formularz powinien się wyświetlić TYLKO, gdy status to UNCONFIRMED
                $can_answer = $guest['rsvp_status'] === 'unconfirmed'; 
                // Dodatkowo, jeśli gość odpowiedział, ale to nie jest finalny status 'confirmed', 
                // powinien mieć możliwość edycji swojej odpowiedzi (ale upraszczamy to i pozwalamy na edycję, 
                // dopóki organizator nie zatwierdzi)
                $can_edit = $guest['rsvp_status'] !== 'confirmed'; // Niech pending też może edytować
            ?>

            <?php if ($can_edit): ?>
            
            <form method="POST">
                <h2>Potwierdzenie</h2>
                <input type="hidden" name="confirmed" id="confirmed_input" value="true">
                
                <label for="accommodation_input">Ile osób z Państwa potrzebuje noclegu?</label>
                <input type="number" id="accommodation_input" name="accommodation" min="0" max="<?php echo $total_people; ?>" value="<?php echo (int)$guest['accommodation']; ?>">

                <label for="after_party_count_input" style="margin-top: 25px;">Liczba osób na poprawiny:</label>
                <select id="after_party_count_input" name="after_party_count" style="width: 100%;" onchange="document.getElementById('confirmed_input').value='true';">
                    <?php $current_count = (int)$guest['after_party']; ?>
                    <option value="0" <?php echo $current_count === 0 ? 'selected' : ''; ?>>0 osób (Nie bierzemy udziału)</option>
                    <?php for ($i = 1; $i <= $total_people; $i++): ?>
                        <option value="<?php echo $i; ?>" <?php echo $current_count === $i ? 'selected' : ''; ?>><?php echo $i; ?> osób</option>
                    <?php endfor; ?>
                </select>

                <label for="notes_input">Państwa uwagi:</label>
                <textarea id="notes_input" name="notes" placeholder="Wpisz uwagi (Obecność tylko na ślubie, bez osoby towarzyszącej, "><?php echo htmlspecialchars($guest['notes'] ?? ''); ?></textarea>

                <button type="submit" onclick="document.getElementById('confirmed_input').value='true';">Potwierdzam obecność</button>
                <button type="submit" style="background-color: #d32f2f;" onclick="document.getElementById('confirmed_input').value='false'; document.getElementById('accommodation_input').value='0'; document.getElementById('after_party_count_input').value='0';">Nie będziemy mogli być</button>
            </form>
            
            <?php else: ?>
                <!-- TO WYŚWIETLA SIĘ PO REZYGNACJI LUB FINALNYM ZATWIERDZENIU -->
                <?php if ($guest['rsvp_status'] === 'confirmed'): ?>
                    <p>Cieszymy się, że będziecie z nami! Państwa obecność została już ostatecznie zatwierdzona.</p>
                <?php else: ?>
                    <p>Dziękujemy za Państwa informację. Stan Państwa odpowiedzi:
                       <span class="status-badge status-unconfirmed">Nieobecność potwierdzona przez Gości.</span>
                    </p>
                <?php endif; ?>
            <?php endif; ?>

            <div class="info-box">
                <!-- NOWE SEKCJE DYNAMICZNE -->
				                <h3>Kontakt</h3>
                <p>Panna Młoda: <?php echo $bride_contact; ?></p>
                <p>Pan Młody: <?php echo $groom_contact; ?></p>
				
                <?php if (!empty($settings['church_map_embed']) || !empty($settings['venue_map_embed'])): ?>
                    <h3>Mapy</h3>
                    <p>Poniżej znajdą Państwo mapki dojazdu:</p>
                    
                    <?php if (!empty($settings['church_map_embed'])): ?>
                        <p><strong>Kościół:</strong></p>
                        <div class="map-container"><?php echo $settings['church_map_embed']; ?></div>
                    <?php endif; ?>

                    <?php if (!empty($settings['venue_map_embed'])): ?>
                         <p><strong>Sala Weselna:</strong></p>
                        <div class="map-container"><?php echo $settings['venue_map_embed']; ?></div>
                    <?php endif; ?>
                <?php endif; ?>
                
                <?php if ($settings['wedding_schedule'] ?? ''): ?>
                    <h3>Plan Dnia</h3>
                    <?php echo nl2br(htmlspecialchars($settings['wedding_schedule'])); ?>
                <?php endif; ?>

                <?php if ($settings['wedding_menu'] ?? ''): ?>
                    <h3>Menu</h3>
                    <?php echo nl2br(htmlspecialchars($settings['wedding_menu'])); ?>
                <?php endif; ?>

                <?php if ($settings['key_info'] ?? ''): ?>
                    <h3>Kluczowe Informacje</h3>
                    <?php echo nl2br(htmlspecialchars($settings['key_info'])); ?>
                <?php endif; ?>

                <?php if ($guest['rsvp_status'] === 'confirmed' && $guest['table_name']): ?>
                    <h3>Miejsce</h3>
                    <p>Zostali Państwo usadzeni przy stole: **<?php echo htmlspecialchars($guest['table_name']); ?>**</p>
                <?php endif; ?>

                <?php if ((int)$guest['accommodation'] > 0): ?>
                    <h3>Nocleg</h3>
                    <p>Potwierdzono **<?php echo (int)$guest['accommodation']; ?>** miejsc noclegowych.</p>
                <?php endif; ?>
                
                <?php if ((int)$guest['after_party'] > 0): ?>
                    <h3>Poprawiny</h3>
                    <p>Potwierdzono udział **<?php echo (int)$guest['after_party']; ?>** osób w poprawinach.</p>
                <?php endif; ?>
                                
                <?php if ($guest['notes']): ?>
                    <h3 style="color: #d32f2f;">Państwa Uwagi:</h3>
                    <p>**<?php echo htmlspecialchars($guest['notes']); ?>**</p>
                <?php endif; ?>
            </div>

        <?php endif; ?>
    </div>
</body>
</html>