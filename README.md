# Organizer Ślubny PRO+

**Organizer Ślubny PRO+** to aplikacja webowa wspierająca pary młode w planowaniu wesela.  
Działa całkowicie w przeglądarce (bez konieczności instalacji) i zapisuje dane lokalnie w pamięci przeglądarki.  

## 📌 Funkcjonalności

- **Pulpit** – ustawienie daty ślubu i automatyczne odliczanie czasu.
- **Zadania i kalendarz** – tworzenie zadań z terminami, przypisywanie odpowiedzialnych osób, podgląd w formie listy i kalendarza miesięcznego.
- **Lista gości** – dodawanie par, rodzin z dziećmi, oznaczanie potwierdzenia obecności i noclegu.
- **Budżet** – kalkulacja kosztów „talerzyka”, noclegów i usługodawców (np. DJ, fotograf). Obsługa zaliczek i terminów płatności.
- **Plan stołów** – graficzne rozmieszczanie gości przy stołach (okrągłych i prostokątnych) metodą „drag & drop”.
- **Eksport danych**:
  - Raporty w formacie **PDF** i **Excel** (goście, budżet, plan stołów).
  - Eksport/Import wszystkich danych do pliku `.json` (łatwe przenoszenie pomiędzy komputerami).

## 🚀 Uruchomienie

1. Pobierz wszystkie pliki projektu:
   - `index.html`  
   - `style.css`  
   - `script.js`  
   - `LICENSE`  

2. Otwórz plik **index.html** w dowolnej nowoczesnej przeglądarce (np. Chrome, Firefox, Edge).

3. Wszystkie dane zapisywane są **lokalnie w przeglądarce** (LocalStorage).  
   Możesz je wyeksportować do pliku i później ponownie wczytać.

## 📂 Struktura projektu

```
├── index.html      # Główna strona aplikacji
├── style.css       # Stylizacja (kolorystyka, układ, animacje)
├── script.js       # Logika aplikacji (zarządzanie zadaniami, gośćmi, budżetem, planem stołów)
├── LICENSE         # Licencja projektu
```

## 🛠️ Wymagania techniczne

- Nowoczesna przeglądarka internetowa z obsługą **JavaScript ES6**.  
- Brak potrzeby instalacji serwera – działa jako aplikacja statyczna.  
- Do eksportu raportów wykorzystywane są zewnętrzne biblioteki:
  - [jsPDF](https://cdnjs.com/libraries/jspdf) + [AutoTable](https://cdnjs.com/libraries/jspdf-autotable)
  - [SheetJS (xlsx)](https://cdnjs.com/libraries/xlsx)

## 📖 Licencja

Projekt dostępny na licencji określonej w pliku **LICENSE**.  
