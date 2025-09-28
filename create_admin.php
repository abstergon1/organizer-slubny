<?php
// create_admin.php

// =============== USTAWIENIA ==================
$admin_email = 'twoj@email.com'; // <-- WPISZ SWÓJ E-MAIL TUTAJ
$admin_password = 'TwojeSuperTajneHaslo123!'; // <-- WPISZ SWOJE HASŁO TUTAJ
// =============================================

require_once 'db_connect.php';

echo "<pre>"; // Używamy <pre> dla lepszej czytelności

// Krok 1: Haszuj hasło w bezpieczny sposób
$password_hash = password_hash($admin_password, PASSWORD_DEFAULT);
echo "Wygenerowany hash hasła: " . htmlspecialchars($password_hash) . "\n\n";

$conn->begin_transaction();

try {
    // Krok 2: Utwórz konto administratora
    $stmt_user = $conn->prepare("INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)");
    $stmt_user->bind_param("ss", $admin_email, $password_hash);
    $stmt_user->execute();
    $admin_user_id = $conn->insert_id;
    echo "1. Utworzono użytkownika z ID: " . $admin_user_id . "\n";

    // Krok 3: Utwórz domyślny organizer dla tego administratora
    $stmt_org = $conn->prepare("INSERT INTO organizers (owner_user_id, organizer_name) VALUES (?, 'Organizer Administratora')");
    $stmt_org->bind_param("i", $admin_user_id);
    $stmt_org->execute();
    $admin_organizer_id = $conn->insert_id;
    echo "2. Utworzono organizer z ID: " . $admin_organizer_id . "\n";

    // Krok 4: Połącz konto admina z jego organizerem
    $stmt_perm = $conn->prepare("INSERT INTO organizer_users (organizer_id, user_id, permission_level) VALUES (?, ?, 'owner')");
    $stmt_perm->bind_param("ii", $admin_organizer_id, $admin_user_id);
    $stmt_perm->execute();
    echo "3. Powiązano użytkownika z organizerem.\n\n";

    $conn->commit();
    echo "<b> sukces! Konto administratora zostało pomyślnie utworzone w bazie danych.</b>\n";

} catch (Exception $e) {
    $conn->rollback();
    echo "<b>BŁĄD! Coś poszło nie tak.</b>\n";
    echo "Wiadomość błędu: " . $e->getMessage() . "\n";
}

echo "</pre>";
echo "<b>WAŻNE: Po pomyślnym utworzeniu konta, usuń ten plik (create_admin.php) z serwera!</b>";