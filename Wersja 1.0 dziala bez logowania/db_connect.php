<?php
// db_connect.php
$servername = "localhost"; // Zazwyczaj "localhost"
$username = "root";        // Twój użytkownik bazy danych (np. root) - ZMIEŃ JEŚLI POTRZEBNE
$password = "";            // Twoje hasło do bazy danych - ZMIEŃ JEŚLI POTRZEBNE
$dbname = "wedding_organizer"; // Nazwa bazy danych, którą utworzyłeś

// Tworzenie połączenia
$conn = new mysqli($servername, $username, $password, $dbname);

// Sprawdzenie połączenia
if ($conn->connect_error) {
    die("Błąd połączenia z bazą danych: " . $conn->connect_error);
}

// Ustawienie kodowania na UTF-8
$conn->set_charset("utf8mb4");
?>