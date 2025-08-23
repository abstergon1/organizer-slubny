<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();
$pdo->beginTransaction();
try {
    // 1. Unassign the dragged person from their original seat, if any
    $sql_unassign = "UPDATE seats SET person_id = NULL WHERE person_id = ?";
    $stmt_unassign = $pdo->prepare($sql_unassign);
    $stmt_unassign->execute([$input['draggedPersonId']]);

    // 2. Unassign the person who was on the target seat, if any
    if ($input['personOnTargetSeatId']) {
        $sql_unassign_target = "UPDATE seats SET person_id = NULL WHERE id = ?";
        $stmt_unassign_target = $pdo->prepare($sql_unassign_target);
        $stmt_unassign_target->execute([$input['targetSeatId']]);
    }

    // 3. Assign the dragged person to the target seat
    $sql_assign = "UPDATE seats SET person_id = ? WHERE id = ?";
    $stmt_assign = $pdo->prepare($sql_assign);
    $stmt_assign->execute([$input['draggedPersonId'], $input['targetSeatId']]);

    // 4. If there was a source seat and a person on the target seat, swap them
    if ($input['sourceSeatId'] && $input['personOnTargetSeatId']) {
        $sql_swap = "UPDATE seats SET person_id = ? WHERE id = ?";
        $stmt_swap = $pdo->prepare($sql_swap);
        $stmt_swap->execute([$input['personOnTargetSeatId'], $input['sourceSeatId']]);
    }

    $pdo->commit();
    respond(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['success' => false, 'message' => $e->getMessage()]);
}
?>