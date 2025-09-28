<?php
// api_data.php
require_once 'functions.php';

header('Content-Type: application/json');

$dataType = $_GET['dataType'] ?? '';

$data = [];

switch ($dataType) {
    case 'tasks':
        $data = get_tasks();
        break;
    case 'guests':
        $data = get_guests();
        break;
    case 'vendors':
        $data = get_vendors();
        break;
    case 'price_items':
        $data = get_price_items();
        break;
    case 'tables':
        $data = get_tables();
        // Dodatkowa logika do uzupełnienia nazw gości w miejscach
        foreach ($data as &$table) {
            foreach ($table['seats'] as &$seat) {
                if ($seat['person_type'] && $seat['person_id']) {
                    $seat['person_name'] = get_person_name($seat['person_type'], $seat['person_id']);
                }
            }
        }
        break;
    case 'settings':
        $data = [
            'wedding_date' => get_setting('wedding_date'),
            'price_adult' => get_setting('price_adult'),
            'price_child_older' => get_setting('price_child_older'),
            'price_child_younger' => get_setting('price_child_younger'),
            'price_accommodation' => get_setting('price_accommodation'),
        ];
        break;
    // Dodaj inne przypadki dla innych typów danych
    default:
        $data = ['error' => 'Nieznany typ danych'];
        break;
}

echo json_encode($data);
?>