<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();
$pdo->beginTransaction();
try {
    $sql = "INSERT INTO tables (name, capacity, shape) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$input['name'], $input['capacity'], $input['shape']]);
    $tableId = $pdo->lastInsertId();

    $seatSql = "INSERT INTO seats (table_id) VALUES (?)";
    $seatStmt = $pdo->prepare($seatSql);
    for ($i = 0; $i < $input['capacity']; $i++) {
        $seatStmt->execute([$tableId]);
    }
    $pdo->commit();
    respond(['success' => true, 'id' => $tableId]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['success' => false, 'message' => $e->getMessage()]);
}
?>