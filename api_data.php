<?php
// api_data.php
require_once 'auth.php'; 
require_once 'functions.php';

header('Content-Type: application/json');

// Dodano zabezpieczenie przed Undefined variable $organizer_id
$organizer_id = $organizer_id ?? null;

$dataType = $_GET['dataType'] ?? '';
$data = [];

switch ($dataType) {
    case 'settings':
        $data = get_settings($organizer_id);
        break;
    case 'tasks':
        $data = get_tasks($organizer_id);
        break;
    case 'guests':
        $data = get_guests($organizer_id);
        break;
    case 'vendors':
<<<<<<< Updated upstream
        $data = get_vendors();
=======
        $data = get_vendors($organizer_id);
>>>>>>> Stashed changes
        break;
    case 'tables':
        $data = get_tables($organizer_id);
        break;
    // DODANO OBSŁUGĘ TEGO TYPU DANYCH
    case 'organizer_users':
        $data = get_organizer_users($organizer_id);
        break;
    default:
        $data = ['error' => 'Nieznany typ danych'];
        break;
}

echo json_encode($data);