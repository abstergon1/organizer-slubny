<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();

$sql = "UPDATE settings SET 
            wedding_date = :wedding_date,
            price_adult = :price_adult,
            price_child_older = :price_child_older,
            price_child_younger = :price_child_younger,
            price_accommodation = :price_accommodation
        WHERE id = 1";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':wedding_date' => $input['weddingDate'] ?: null,
    ':price_adult' => $input['prices']['adult'] ?: 0,
    ':price_child_older' => $input['prices']['childOlder'] ?: 0,
    ':price_child_younger' => $input['prices']['childYounger'] ?: 0,
    ':price_accommodation' => $input['prices']['accommodation'] ?: 0,
]);

respond(['success' => true]);
?>