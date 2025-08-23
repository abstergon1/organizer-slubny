<?php
require '../config.php';

$pdo = getPDO();
$state = [
    'data' => [
        'tasks' => [], 'guests' => [], 'vendors' => [], 'tables' => [],
        'weddingDate' => null, 'prices' => []
    ]
];

// Settings
$stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
$settings = $stmt->fetch();
if ($settings) {
    $state['data']['weddingDate'] = $settings['wedding_date'];
    $state['data']['prices'] = [
        'adult' => $settings['price_adult'],
        'childOlder' => $settings['price_child_older'],
        'childYounger' => $settings['price_child_younger'],
        'accommodation' => $settings['price_accommodation']
    ];
}

// Tasks, Vendors
$state['data']['tasks'] = $pdo->query("SELECT * FROM tasks ORDER BY date ASC")->fetchAll();
$state['data']['vendors'] = $pdo->query("SELECT * FROM vendors")->fetchAll();

// Guests
$guest_groups = $pdo->query("SELECT * FROM guest_groups")->fetchAll(PDO::FETCH_ASSOC);
$children_stmt = $pdo->prepare("SELECT id, name, age FROM children WHERE group_id = ?");
foreach ($guest_groups as &$group) { // use reference to modify array
    $children_stmt->execute([$group['id']]);
    $group['children'] = $children_stmt->fetchAll(PDO::FETCH_ASSOC);
}
$state['data']['guests'] = $guest_groups;

// Tables
$tables = $pdo->query("SELECT * FROM tables")->fetchAll(PDO::FETCH_ASSOC);
$seats_stmt = $pdo->prepare("SELECT id, person_id FROM seats WHERE table_id = ?");
foreach ($tables as &$table) { // use reference to modify array
    $seats_stmt->execute([$table['id']]);
    $table['seats'] = $seats_stmt->fetchAll(PDO::FETCH_ASSOC);
}
$state['data']['tables'] = $tables;

respond($state);
?>