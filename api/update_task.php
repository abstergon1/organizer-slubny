<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();

$sql = "UPDATE tasks SET completed = ?, completionDate = ? WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute([$input['completed'], $input['completionDate'], $input['id']]);

respond(['success' => true]);
?>```
--- END OF FILE api/update_task.php ---

--- START OF FILE api/delete_task.php ---
```php
<?php
require '../config.php';
$input = getInput();
$pdo = getPDO();

$stmt_check = $pdo->prepare("SELECT isPaymentTask FROM tasks WHERE id = ?");
$stmt_check->execute([$input['id']]);
$task = $stmt_check->fetch();

if ($task && $task['isPaymentTask']) {
    respond(['success' => false, 'message' => 'Tego zadania nie można usunąć ręcznie.']);
} else {
    $stmt_delete = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt_delete->execute([$input['id']]);
    respond(['success' => true]);
}
?>