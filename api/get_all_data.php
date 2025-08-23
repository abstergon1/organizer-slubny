<?php
require '../config.php';

$state = [
    'meta' => ['version' => 1, 'loadedAt' => date('c')],
    'data' => [
        'tasks' => [],
        'guests' => [],
        'vendors' => [],
        'tables' => [],
        'weddingDate' => null,
        'prices' => []
    ]
];

// Pobierz ustawienia
$stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
$settings = $stmt->fetch();
$state['data']['weddingDate'] = $settings['wedding_date'];
$state['data']['prices'] = [
    'adult' => $settings['price_adult'],
    'childOlder' => $settings['price_child_older'],
    'childYounger' => $settings['price_child_younger'],
    'accommodation' => $settings['price_accommodation']
];

// Pobierz zadania
$state['data']['tasks'] = $pdo->query("SELECT * FROM tasks ORDER BY task_date ASC")->fetchAll();

// Pobierz usługodawców
$state['data']['vendors'] = $pdo->query("SELECT * FROM vendors")->fetchAll();

// Pobierz gości i dzieci
$guest_groups = $pdo->query("SELECT * FROM guest_groups")->fetchAll();
$children_stmt = $pdo->prepare("SELECT * FROM children WHERE group_id = ?");

foreach ($guest_groups as $group) {
    $children_stmt->execute([$group['id']]);
    $group['children'] = $children_stmt->fetchAll();
    $state['data']['guests'][] = $group;
}

// Pobierz stoły i miejsca
$tables = $pdo->query("SELECT * FROM tables")->fetchAll();
$seats_stmt = $pdo->prepare("SELECT * FROM seats WHERE table_id = ?");

foreach ($tables as $table) {
    $seats_stmt->execute([$table['id']]);
    $table['seats'] = $seats_stmt->fetchAll();
    $state['data']['tables'][] = $table;
}

echo json_encode($state);