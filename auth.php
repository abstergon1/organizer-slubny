<?php
<<<<<<< Updated upstream
// auth.php (WERSJA OSTATECZNA, POPRAWIONA)
session_start();
require_once 'db_connect.php';

// Krok 1: Sprawdź, czy użytkownik jest zalogowany
if (!isset($_SESSION['user_id'])) {
    // Jeśli to żądanie AJAX, zwróć błąd JSON, w przeciwnym razie przekieruj
=======
// auth.php (WERSJA Z WBUDOWANYM DIAGNOSTĄ)
session_start();
require_once 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
>>>>>>> Stashed changes
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Brak autoryzacji.']);
    } else {
        header("Location: login.php");
    }
    exit;
}

<<<<<<< Updated upstream
// Krok 2: Zainicjuj wszystkie zmienne z domyślnymi wartościami
$user_id = $_SESSION['user_id'];
$organizer_id = null;
$permission_level = null;
$is_admin = false; // ZAWSZE inicjujemy zmienną jako false

// Krok 3: Sprawdź, czy zalogowany użytkownik ma uprawnienia administratora
=======
$user_id = $_SESSION['user_id'];
$organizer_id = null;
$permission_level = null;
$is_admin = false;

>>>>>>> Stashed changes
$stmt_admin = $conn->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt_admin->bind_param("i", $user_id);
$stmt_admin->execute();
$admin_result = $stmt_admin->get_result()->fetch_assoc();

<<<<<<< Updated upstream
// Jeśli zapytanie się powiodło i is_admin to 1, ustaw zmienną na true
=======
>>>>>>> Stashed changes
if ($admin_result && $admin_result['is_admin'] == 1) {
    $is_admin = true;
}

<<<<<<< Updated upstream
// Krok 4: Pobierz pierwszy organizer, do którego użytkownik ma dostęp
// (W przyszłości można tu dodać logikę wyboru organizera)
=======
>>>>>>> Stashed changes
$stmt_org = $conn->prepare("SELECT organizer_id, permission_level FROM organizer_users WHERE user_id = ? ORDER BY id ASC LIMIT 1");
$stmt_org->bind_param("i", $user_id);
$stmt_org->execute();
$result_org = $stmt_org->get_result();

if ($row = $result_org->fetch_assoc()) {
    $organizer_id = $row['organizer_id'];
    $permission_level = $row['permission_level'];
}
<<<<<<< Updated upstream
// Jeśli użytkownik nie ma przypisanego organizera, zmienne $organizer_id i $permission_level pozostaną null,
// co jest oczekiwanym zachowaniem dla admina bez organizera.

/**
 * Funkcja pomocnicza sprawdzająca, czy użytkownik ma uprawnienia do edycji.
 * @param string|null $level - Poziom uprawnień ('owner', 'editor', 'viewer')
 * @return bool
 */
=======

// ======================= SEKCJA DIAGNOSTYCZNA =======================
// Ten kod wyświetli kluczowe zmienne i zatrzyma aplikację.
// Po rozwiązaniu problemu, należy usunąć ten fragment.
echo "<pre style='font-family: monospace; background: #f5f5f5; padding: 20px; border: 1px solid #ccc;'>";
echo "<b>WYNIKI DIAGNOSTYCZNE (z pliku auth.php)</b>\n\n";

echo "ID Zalogowanego Użytkownika (user_id): ";
var_dump($user_id);

echo "Czy jest Administratorem (is_admin): ";
var_dump($is_admin);

echo "ID Organizera (organizer_id): ";
var_dump($organizer_id);

echo "Poziom Uprawnień (permission_level): ";
var_dump($permission_level);

echo "\n<b>PROSZĘ SKOPIOWAĆ CAŁĄ TĘ ZAWARTOŚĆ I WKLEIĆ W ODPOWIEDZI.</b>";
echo "</pre>";
die(); // ZATRZYMUJEMY WYKONYWANIE APLIKACJI TUTAJ
// =================================================================

>>>>>>> Stashed changes
function can_edit($level) {
    return $level === 'owner' || $level === 'editor';
}