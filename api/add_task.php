<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();

$sql = "INSERT INTO tasks (name, date, owner) VALUES (?, ?, ?)";
$stmt = $pdo->prepare($sql);
$stmt->execute([$input['name'], $input['date'], $input['owner']]);

respond(['success' => true, 'id' => $pdo->lastInsertId()]);
?>