# Wedding Organizer PRO+

**W pełni funkcjonalna aplikacja webowa PHP (Vanilla PHP + AJAX/JS/MySQL) do zarządzania weselem, gośćmi, budżetem i planem stołów.**

Ta wersja jest wynikiem rozbudowy podstawowego projektu, wzbogaconego o zaawansowane funkcje RSVP, dynamiczne obliczenia budżetowe i ulepszoną wizualizację planu stołów.

## 🌟 Kluczowe Funkcjonalności

Aplikacja oferuje kompleksowy zestaw narzędzi do zarządzania weselem:

### 🤵 Lista Gości i Zaawansowany System RSVP
*   **Samodzielne Potwierdzenie Obecności (RSVP):** Automatyczne generowanie unikalnego linku i kodu QR na zaproszenie dla każdej grupy gości (np. `yourdomain.com/rsvp.php?token=...`).
*   **Dynamiczna Strona RSVP:** Goście widzą informacje o swoim statusie, usadzeniu przy stole oraz mogą edytować liczbę osób na nocleg i poprawiny, a także zostawić uwagi/diety.
*   **Centralny CMS dla Gości:** Możliwość zarządzania informacjami o harmonogramie, menu, mapach Google (kościoła i sali) i kontaktach z poziomu aplikacji (Sekcja "Info dla Gości").
*   **Statusy RSVP:** Obsługa statusów: `Oczekuje na odpowiedź`, `Oczekuje na akceptację Panny/Pana Młodego`, `Zatwierdzony` oraz `Rezygnacja`.
*   **Edytowalna Lista Finalna:** Administrator może ręcznie edytować finalną liczbę potwierdzonych Dorosłych i Dzieci.

### 💰 Budżet i Finanse
*   **Elastyczny System Płatności:** Możliwość rejestrowania **wielu częściowych wpłat** dla każdego dostawcy (zastępuje prosty system Zaliczka/Całość).
*   **Dynamiczne Obliczanie Kosztów "Talerzyka":** Koszt gości jest precyzyjnie obliczany na podstawie **dynamicznie ustawianych widełek wiekowych** i faktycznej liczby potwierdzonych gości (dorośli, dzieci 4-10, dzieci 0-3).
*   **Centralne Zarządzanie Widełkami:** Widełki wiekowe dzieci i ceny są edytowalne z poziomu panelu Budżetu.

### 🛋️ Plan Stołów (Usadzanie Gości)
*   **Ulepszona Wizualizacja:** Nowy, **wyraźny widok** stołów prostokątnych (pionowy układ z miejscami po obu stronach) i okrągłych, z priorytetem na czytelność pełnych nazwisk.
*   **Większe Strefy Upuszczania:** Poprawiona ergonomia Drag & Drop dzięki większym polom na usadzenie gości.
*   **Szybkie Zarządzanie:** Przycisk "Wyczyść Usadzenie" do szybkiego usuwania wszystkich gości ze stołu.

### 🛠️ Inne Ulepszenia
*   **Pełny podział (MVC-Light):** Logika PHP (Kontroler `index.php`) oddzielona od widoków (`views/dashboard.php`).
*   **Podsumowanie Zaproszonych:** Stopka tabeli gości wyświetla wskaźnik odpowiedzi, porównując **Zaproszonych** (suma max) z **Potwierdzonymi (final)**.

## ⚙️ Wymagania Techniczne

*   PHP 7.4+
*   MySQL / MariaDB
*   Serwer WWW (Apache/Nginx, XAMPP/WAMP/MAMP)

## 🚀 Instalacja i Pierwsze Uruchomienie

1.  **Klonowanie/Pobranie:** Pobierz pliki projektu do katalogu serwera (np. `htdocs/organizer`).
2.  **Konfiguracja DB:** Utwórz bazę danych (np. `wedding_organizer`).
3.  **Import Schematu:** Użyj pliku `sql_schema.sql` do stworzenia początkowych tabel.
4.  **Połączenie z DB:** Upewnij się, że plik `db_connect.php` (niezałączony w opisie, ale wymagany) zawiera poprawne dane logowania.
5.  **Logowanie:** Aplikacja wymaga systemu logowania i autoryzacji (pliki `auth.php`, `login.php` nie są częścią tego opisu, ale są wymagane). Po zalogowaniu możesz używać aplikacji.

### ⚠️ Migracja Istniejącej Bazy Danych

Jeśli aktualizujesz starszą wersję bazy danych, musisz wykonać następujące skrypty SQL, aby wprowadzić nowe kolumny i dostosować strukturę:

```sql
-- 1. ZMIANA STRUKTURY DLA WIELU PŁATNOŚCI
-- A) Dodanie tabeli płatności
CREATE TABLE vendor_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);
-- B) Usunięcie starych kolumn z vendors
ALTER TABLE vendors 
DROP COLUMN deposit,
DROP COLUMN paid_full;


-- 2. ZMIANA STRUKTURY DLA RSVP I FINALNYCH LICZB
-- A) Aktualizacja statusów RSVP
ALTER TABLE guests MODIFY COLUMN rsvp_status ENUM('unconfirmed', 'pending', 'confirmed', 'rejected') NOT NULL DEFAULT 'unconfirmed';
-- B) Dodanie kolumn dla uwag i finalnej liczby gości
ALTER TABLE guests ADD COLUMN notes VARCHAR(500) DEFAULT NULL;
ALTER TABLE guests ADD COLUMN confirmed_adults TINYINT DEFAULT 0;
ALTER TABLE guests ADD COLUMN confirmed_children TINYINT DEFAULT 0;

-- 3. OPCJONALNA MIGRACJA DANYCH
-- Jeśli chcesz, aby stary 'deposit' stał się pierwszą płatnością:
/*
INSERT INTO vendor_payments (vendor_id, amount, payment_date, description)
SELECT id, deposit, CURDATE(), 'Zaliczka (migracja)'
FROM vendors
WHERE deposit > 0;
*/
```