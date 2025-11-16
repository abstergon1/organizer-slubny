<?php
// api_qr_export.php
require_once 'auth.php'; 
require_once 'functions.php';

// Zabezpieczenie przed brakiem organizera
if (!$organizer_id || !can_edit($permission_level)) {
    http_response_code(403);
    die("Brak autoryzacji do eksportu.");
}

// Musimy upewnić się, że tokeny są wygenerowane
// (renderAll/get_guests nie gwarantuje, że pole rsvp_token nie jest null)
// W tym celu musielibyśmy w pętli generować tokeny. Poniżej upraszczamy to:

// --- STAŁE I ZMIENNE ---
$zip_file = 'qr_kody_rsvp_' . $organizer_id . '.zip';
$base_rsvp_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]/rsvp.php?token=";
$qr_api_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data='; // Wyższa rozdzielczość dla druku

$guests_list = get_guests($organizer_id);
$temp_dir = sys_get_temp_dir() . '/qr_temp_' . uniqid() . '/';

// --- ZABEZPIECZENIE I INICJALIZACJA ZIP ---
if (!class_exists('ZipArchive')) {
    die("Błąd: Wymagane rozszerzenie PHP ZipArchive jest niedostępne.");
}

$zip = new ZipArchive();
if ($zip->open($zip_file, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
    die("Nie można utworzyć pliku ZIP.");
}
if (!is_dir($temp_dir)) {
    mkdir($temp_dir);
}


// --- GŁÓWNA PĘTLA: GENEROWANIE I DODAWANIE DO ZIP ---
$errors = [];
$success_count = 0;

foreach ($guests_list as $guest) {
    // 1. Zabezpiecz się przed brakiem tokena (jeśli gość nie ma tokena, wygeneruj go)
    if (empty($guest['rsvp_token'])) {
        // Musisz ręcznie wywołać generowanie tokena (jeśli token nie jest w bazie)
        // Zakładając, że get_guest_by_token lub inna funkcja już to zrobiła.
        // Jeśli nie, musisz wywołać funkcję generate_rsvp_token($guest['id'])
        // W tym miejscu musisz mieć pewność, że token istnieje w bazie.
        $token = generate_rsvp_token($guest['id']);
    } else {
        $token = $guest['rsvp_token'];
    }

    if (!$token) {
        $errors[] = "Gość z grupy ID {$guest['id']} nie ma tokena RSVP.";
        continue;
    }

    // 2. Utwórz URL dla QR
    $qr_data_url = $base_rsvp_url . urlencode($token);
    $qr_image_url = $qr_api_url . urlencode($qr_data_url);

    // 3. Utwórz nazwę pliku
    $guest_name_1 = preg_replace('/[^a-zA-Z0-9_ -]/', '', $guest['guest1_name']);
    $guest_name_2 = preg_replace('/[^a-zA-Z0-9_ -]/', '', $guest['guest2_name']);
    $final_name = trim($guest_name_1 . ($guest_name_2 ? "_i_" . $guest_name_2 : ""));
    $final_name = preg_replace('/[ -]+/', '_', $final_name) . '.png';

    // 4. Pobierz obraz QR (używając cURL dla większej stabilności)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $qr_image_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0); // Opcjonalnie, jeśli masz problem z certyfikatami
    $qr_image_content = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200 || empty($qr_image_content)) {
        $errors[] = "Błąd pobierania QR dla {$final_name}. Kod HTTP: {$http_code}";
        continue;
    }

    // 5. Dodaj obraz do ZIP
    $zip->addFromString($final_name, $qr_image_content);
    $success_count++;
}


// --- FINALIZACJA I POBIERANIE ---

$zip->close();

// Wyczyść katalog tymczasowy
array_map('unlink', glob("$temp_dir/*.*"));
rmdir($temp_dir);

if ($success_count === 0) {
    // W przypadku błędu, usuniemy pusty ZIP i pokażemy błąd
    unlink($zip_file);
    die("Nie udało się wygenerować żadnego kodu QR. Powody: " . implode("; ", $errors));
}

// 6. Wymuszenie pobrania
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . basename($zip_file) . '"');
header('Content-Length: ' . filesize($zip_file));
header('Pragma: no-cache');
header('Expires: 0');
readfile($zip_file);

// Usunięcie pliku ZIP po wysłaniu
unlink($zip_file);
exit;

?>