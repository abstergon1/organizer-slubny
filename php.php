<?php
// Ustaw raportowanie błędów na potrzeby deweloperskie
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// --- USTAWIENIA BAZY DANYCH ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'twoja_baza_danych'); // ZMIEŃ
define('DB_USER', 'twoj_uzytkownik');   // ZMIEŃ
define('DB_PASS', 'twoje_haslo');         // ZMIEŃ
// -----------------------------

header('Content-Type: application/json');

function getPDO() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Błąd połączenia z bazą danych.']);
            exit;
        }
    }
    return $pdo;
}

function respond($data) {
    echo json_encode($data);
    exit;
}

function getInput() {
    return json_decode(file_get_contents('php://input'), true);
}
?>