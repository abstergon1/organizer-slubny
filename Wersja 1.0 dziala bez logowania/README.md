# Organizer Ślubny PRO+

**Organizer Ślubny PRO+** to kompleksowa aplikacja internetowa zaprojektowana, aby pomóc przyszłym parom młodym w zarządzaniu wszystkimi aspektami organizacji ślubu i wesela. Aplikacja została zbudowana w architekturze Klient-Serwer, wykorzystując PHP do logiki backendowej oraz bazę danych MySQL do przechowywania danych, co zapewnia stabilność, bezpieczeństwo i możliwość przyszłej rozbudowy.

![Wedding Organizer Screenshot](https://i.imgur.com/your-screenshot-url.png)
*(Sugestia: Zrób zrzut ekranu swojej aplikacji i umieść go tutaj, aby README było bardziej atrakcyjne. Powyższy link jest tylko przykładem.)*

---

## ✨ Główne Funkcjonalności

Aplikacja podzielona jest na sześć intuicyjnych modułów, które pokrywają wszystkie kluczowe etapy planowania:

### 1. **Pulpit (Dashboard)**
- **Odliczanie do ślubu:** Dynamiczny licznik pokazujący dni, godziny, minuty i sekundy do ustawionej daty ślubu.
- **Centralne miejsce:** Służy jako strona główna i punkt startowy dla użytkownika.

### 2. **Zadania i Kalendarz**
- **Lista Zadań (To-Do):** Możliwość dodawania zadań z terminem wykonania i przypisaniem osoby odpowiedzialnej.
- **Oznaczanie postępów:** Zadania można oznaczać jako "ukończone".
- **Interaktywny Kalendarz:** Wizualna prezentacja wszystkich zadań w widoku miesięcznym, co ułatwia planowanie w czasie.
- **Automatyczne zadania płatności:** Po dodaniu kosztu z terminem płatności, w kalendarzu automatycznie pojawia się dedykowane zadanie przypominające o zapłacie.

### 3. **Lista Gości**
- **Zarządzanie gośćmi:** Dodawanie gości w grupach (np. pary, rodziny z dziećmi).
- **Potwierdzenia obecności (RSVP):** Możliwość śledzenia, którzy goście potwierdzili swoje przybycie.
- **Zarządzanie noclegami:** Opcja przypisania liczby osób z danej grupy, które będą potrzebowały noclegu.
- **Filtrowanie:** Szybkie filtrowanie listy gości (wszyscy, potwierdzeni, niepotwierdzeni).
- **Automatyczne podsumowania:** Aplikacja na bieżąco zlicza całkowitą liczbę gości, w tym dorosłych i dzieci.

### 4. **Budżet i Koszty**
- **Konfiguracja cennika:** Możliwość zdefiniowania kosztów "za talerzyk" dla dorosłych i dzieci oraz ceny noclegu.
- **Śledzenie kosztów usługodawców:** Dodawanie wydatków na poszczególne usługi (DJ, fotograf, sala, etc.), wraz z informacją o wpłaconej zaliczce i terminie płatności.
- **Dynamiczne podsumowanie budżetu:** Aplikacja automatycznie oblicza:
    - Całkowity koszt wesela (koszt "talerzyka" + noclegi + usługi).
    - Sumę już dokonanych wpłat.
    - Kwotę, która pozostała do zapłaty.

### 5. **Plan Stołów**
- **Graficzny interfejs:** Możliwość tworzenia wirtualnych stołów (okrągłych lub prostokątnych) o określonej liczbie miejsc.
- **Przeciągnij i Upuść (Drag & Drop):** Intuicyjne przypisywanie gości (tylko tych z potwierdzoną obecnością) do konkretnych miejsc przy stołach.
- **Pula gości do usadzenia:** Przejrzysta lista gości, którzy jeszcze nie mają przypisanego miejsca.
- **Wizualizacja obłożenia:** Stoły na bieżąco pokazują, ile miejsc jest już zajętych.

### 6. **Eksport i Zarządzanie Danymi**
- **Generowanie Raportów:** Możliwość wyeksportowania kluczowych danych (listy gości, budżetu, planu stołów) do uniwersalnych formatów:
    - **PDF:** Profesjonalnie sformatowany raport, idealny do wydruku.
    - **Excel (.xlsx):** Dane w formie arkuszy kalkulacyjnych do dalszej analizy.
- **Eksport/Import Danych Aplikacji:** Funkcjonalność zapisu całego stanu organizera do pliku `.json`, co pozwala na tworzenie kopii zapasowych lub przenoszenie danych.

---

## 🛠️ Stos Technologiczny

- **Backend:**
    - **PHP 7.4+** (z rozszerzeniem MySQLi)
    - **MySQL / MariaDB** jako system zarządzania bazą danych
- **Frontend:**
    - **HTML5**
    - **CSS3** (bez dodatkowych frameworków)
    - **JavaScript (ES6+)**
- **Biblioteki JavaScript:**
    - **jsPDF** & **jsPDF-AutoTable** do generowania plików PDF
    - **XLSX (SheetJS)** do generowania plików Excel

---

## 🚀 Instalacja i Uruchomienie

1.  **Sklonuj repozytorium:**
    ```bash
    git clone https://github.com/twoj-uzytkownik/nazwa-repozytorium.git
    cd nazwa-repozytorium
    ```
2.  **Baza danych:**
    - Utwórz nową bazę danych MySQL (np. o nazwie `wedding_organizer`).
    - Zaimportuj schemat bazy danych, wykonując zapytania z pliku `sql_schema.sql`.
3.  **Konfiguracja:**
    - Zmień nazwę pliku `db_connect.example.php` na `db_connect.php`.
    - W pliku `db_connect.php` podaj swoje dane dostępowe do bazy danych (host, nazwa użytkownika, hasło, nazwa bazy).
4.  **Serwer:**
    - Umieść pliki aplikacji na serwerze WWW obsługującym PHP i MySQL (np. XAMPP, WAMP, lub dowolny hosting).
5.  **Uruchomienie:**
    - Otwórz aplikację w przeglądarce, przechodząc pod odpowiedni adres URL.

---

## 💡 Możliwości Dalszego Rozwoju

- Implementacja systemu uwierzytelniania dla wielu użytkowników.
- Automatyczne powiadomienia e-mail o nadchodzących zadaniach i płatnościach.
- Zaawansowane statystyki i wizualizacje danych na pulpicie.
- Moduł zarządzania preferencjami żywieniowymi gości.
- Galeria inspiracji i notatki przypisane do poszczególnych usługodawców.