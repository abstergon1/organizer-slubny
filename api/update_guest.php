<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();
$pdo->beginTransaction();
try {
    $sql = "UPDATE guest_groups SET guest1=?, guest2=?, confirmed=?, accommodation=? WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['guest1'], $input['guest2'], $input['confirmed'],
        $input['accommodation'], $input['id']
    ]);

    // Delete old children and insert new ones
    $stmt_del = $pdo->prepare("DELETE FROM children WHERE group_id = ?");
    $stmt_del->execute([$input['id']]);

    if (!empty($input['children'])) {
        $sql_child = "INSERT INTO children (group_id, name, age) VALUES (?, ?, ?)";
        $stmt_child = $pdo->prepare($sql_child);
        foreach ($input['children'] as $child) {
            if (!empty($child['name'])) {
                $stmt_child->execute([$input['id'], $child['name'], $child['age']]);
            }
        }
    }
    $pdo->commit();
    respond(['success' => true]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['success' => false, 'message' => $e->getMessage()]);
}
?>