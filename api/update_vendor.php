<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();
$pdo->beginTransaction();
try {
    $sql = "UPDATE vendors SET name=?, cost=?, deposit=?, paid_full=?, payment_date=? WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$input['name'], $input['cost'], $input['deposit'], $input['paidFull'], $input['paymentDate'] ?: null, $input['id']]);

    // Sync payment task
    $taskStmt = $pdo->prepare("SELECT id FROM tasks WHERE vendor_id = ?");
    $taskStmt->execute([$input['id']]);
    $existingTask = $taskStmt->fetch();

    if ($input['paymentDate']) {
        if ($existingTask) {
            $updateTask = $pdo->prepare("UPDATE tasks SET name=?, date=? WHERE id=?");
            $updateTask->execute(["Zapłać dla: " . $input['name'], $input['paymentDate'], $existingTask['id']]);
        } else {
            $insertTask = $pdo->prepare("INSERT INTO tasks (name, date, owner, isPaymentTask, vendor_id) VALUES (?, ?, ?, ?, ?)");
            $insertTask->execute(["Zapłać dla: " . $input['name'], $input['paymentDate'], 'Para Młoda', true, $input['id']]);
        }
    } else {
        if ($existingTask) {
            $deleteTask = $pdo->prepare("DELETE FROM tasks WHERE id=?");
            $deleteTask->execute([$existingTask['id']]);
        }
    }
    $pdo->commit();
    respond(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['success' => false, 'message' => $e->getMessage()]);
}
?>