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
        $data = get_vendors($organizer_id);
        break;
    case 'tables':
        $data = get_tables($organizer_id);
        break;
    case 'organizer_users':
        $data = get_organizer_users($organizer_id);
        break;
	case 'vendor_categories':
        $data = get_vendor_categories($organizer_id); 
        break;
	case 'vendor_payments':
        $vendor_id = (int)($_GET['vendorId'] ?? 0);
        if ($vendor_id > 0) {
            if (!$organizer_id) {
                 $data = ['error' => 'Brak autoryzacji organizera.'];
                 break;
            }
            $data = get_vendor_payments($vendor_id); 
             
        } else {
             $data = ['error' => 'Brak wymaganego Vendor ID'];
        }
        break;
    default:
        $data = ['error' => 'Nieznany typ danych'];
        break;
}

echo json_encode($data);