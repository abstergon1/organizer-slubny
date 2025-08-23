<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();
// ON DELETE CASCADE zajmie się miejscami
$sql = "DELETE FROM tables WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$input['id']]);
respond(['success' => true]);
?>