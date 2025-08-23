<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();
// ON DELETE CASCADE zajmie się zadaniem płatności
$sql = "DELETE FROM vendors WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$input['id']]);
respond(['success' => true]);
?>