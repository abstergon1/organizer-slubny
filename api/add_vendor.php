<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();
$pdo->beginTransaction();
try {
    $sql = "INSERT INTO vendors (name, cost, deposit, paid_full, payment_date) VALUES (?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$input['name'], $input['cost'], $input['deposit'], $input['paidFull'], $input['paymentDate'] ?: null]);
    $vendorId = $pdo->lastInsertId();

    if ($input['paymentDate']) {
        $taskSql = "INSERT INTO tasks (name, date, owner, isPaymentTask, vendor_id) VALUES (?, ?, ?, ?, ?)";
        $taskStmt = $pdo->prepare($taskSql);
        $taskStmt->execute(["Zapłać dla: " . $input['name'], $input['paymentDate'], 'Para Młoda', true, $vendorId]);
    }
    $pdo->commit();
    respond(['success' => true, 'id' => $vendorId]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['success' => false, 'message' => $e->getMessage()]);
}
?>