<?php
<<<<<<< Updated upstream
// api_data.php
require_once 'auth.php'; 
=======
// api_data.php (WERSJA OSTATECZNA, POPRAWIONA)
require_once 'auth.php'; // Ten plik sprawdza sesję i pobiera $organizer_id
>>>>>>> Stashed changes
require_once 'functions.php';

header('Content-Type: application/json');

<<<<<<< Updated upstream
// Dodano zabezpieczenie przed Undefined variable $organizer_id
$organizer_id = $organizer_id ?? null;

=======
>>>>>>> Stashed changes
$dataType = $_GET['dataType'] ?? '';
$data = [];

// Jeśli użytkownik nie ma organizera (np. admin bez przypisania),
// a prosi o dane specyficzne dla organizera, zwróć pustą tablicę.
$organizer_specific_data = ['tasks', 'guests', 'vendors', 'tables', 'settings', 'organizer_users'];
if (!$organizer_id && in_array($dataType, $organizer_specific_data)) {
    echo json_encode([]);
    exit;
}

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
        $data = get_vendors($organizer_id);
        break;
    case 'tables':
        $data = get_tables($organizer_id);
        break;
<<<<<<< Updated upstream
    // DODANO OBSŁUGĘ TEGO TYPU DANYCH
    case 'organizer_users':
        $data = get_organizer_users($organizer_id);
        break;
=======
    
    // --- BRAKUJĄCY I NAJWAŻNIEJSZY ELEMENT ---
    case 'organizer_users':
        $data = get_organizer_users($organizer_id);
        break;
				
	case 'budget_items':
		$data = get_budget_items($organizer_id);
		break;

>>>>>>> Stashed changes
    default:
        $data = ['error' => 'Nieznany typ danych'];
        break;
}

echo json_encode($data);