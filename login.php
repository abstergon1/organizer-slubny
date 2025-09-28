<?php
session_start();
require_once 'db_connect.php';

// Jeśli użytkownik jest już zalogowany, przekieruj go do aplikacji
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$error_message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        $error_message = 'Wszystkie pola są wymagane.';
    } else {
        $stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            if (password_verify($password, $user['password_hash'])) {
                // Logowanie pomyślne, zapisz ID użytkownika w sesji
                $_SESSION['user_id'] = $user['id'];
                header("Location: index.php");
                exit;
            }
        }
        $error_message = 'Nieprawidłowy e-mail lub hasło.';
    }
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Logowanie - Organizer Ślubny</title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        body.auth-page { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9f9f9; }
        .auth-container { width: 100%; max-width: 400px; }
    </style>
</head>
<body class="auth-page">
    <div class="auth-container">
        <section>
            <h2>Zaloguj się</h2>
            <form method="POST" action="login.php">
                <?php if ($error_message): ?>
                    <p style="color: red; background: #ffebee; padding: 10px; border-radius: 4px;"><?php echo htmlspecialchars($error_message); ?></p>
                <?php endif; ?>
                <label for="email">E-mail:</label>
                <input type="email" id="email" name="email" required>
                <label for="password">Hasło:</label>
                <input type="password" id="password" name="password" required>
                <button type="submit" style="width: 100%; margin-top: 20px;">Zaloguj</button>
            </form>
        </section>
    </div>
</body>
</html>