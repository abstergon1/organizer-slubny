<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();

$pdo->beginTransaction();
try {
    $sql = "INSERT INTO guest_groups (guest1, guest2, confirmed, accommodation) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$input['guest1'], $input['guest2'], false, 0]);
    $groupId = $pdo->lastInsertId();

    if (!empty($input['children'])) {
        $sql_child = "INSERT INTO children (group_id, name, age) VALUES (?, ?, ?)";
        $stmt_child = $pdo->prepare($sql_child);
        foreach ($input['children'] as $child) {
            if (!empty($child['name'])) {
                $stmt_child->execute([$groupId, $child['name'], $child['age']]);
            }
        }
    }
    $pdo->commit();
    respond(['success' => true, 'id' => $groupId]);
} catch (Exception $e) {
    $pdo->rollBack();
    respond(['success' => false, 'message' => $e->getMessage()]);
}
?>