-- Utwórz bazę danych, jeśli jeszcze jej nie masz
CREATE DATABASE IF NOT EXISTS wedding_organizer;
USE wedding_organizer;

-- Tabela dla zadań
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    owner VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    is_payment_task BOOLEAN DEFAULT FALSE,
    vendor_id INT
);

-- Tabela dla grup gości (par/rodzin)
CREATE TABLE IF NOT EXISTS guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest1_name VARCHAR(255),
    guest2_name VARCHAR(255),
    confirmed BOOLEAN DEFAULT FALSE,
    accommodation INT DEFAULT 0
);

-- Tabela dla dzieci, z kluczem obcym do gości
CREATE TABLE IF NOT EXISTS children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_group_id INT NOT NULL,
    child_name VARCHAR(255) NOT NULL,
    age INT DEFAULT 0,
    FOREIGN KEY (guest_group_id) REFERENCES guests(id) ON DELETE CASCADE
);

-- Tabela dla dostawców/kosztów
CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    deposit DECIMAL(10, 2) DEFAULT 0.00,
    paid_full BOOLEAN DEFAULT FALSE,
    payment_date DATE
);

-- Tabela dla stołów
CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    shape ENUM('rect', 'round') DEFAULT 'rect'
);

-- Tabela dla miejsc przy stołach
CREATE TABLE IF NOT EXISTS table_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    seat_index INT NOT NULL,
    person_type ENUM('guest1', 'guest2', 'child') DEFAULT NULL,
    person_id INT DEFAULT NULL,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- Tabela dla ustawień (np. data ślubu, ceny)
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT
);

-- Tabela dla dodatkowych pozycji cenowych
CREATE TABLE IF NOT EXISTS price_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    scope ENUM('all', 'adults') NOT NULL DEFAULT 'all'
);

-- Początkowe dane dla ustawień (POPRAWIONA SEKCJA)
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('wedding_date', ''),
('price_adult', '0'),
('price_child_older', '0'),
('price_child_younger', '0'),
('price_accommodation', '0');

-- Początkowe dane dla dodatkowych pozycji cenowych
INSERT INTO price_items (label, amount, scope)
SELECT 'Upominek powitalny', 10.00, 'all'
WHERE NOT EXISTS (SELECT 1 FROM price_items WHERE label = 'Upominek powitalny');

INSERT INTO price_items (label, amount, scope)
SELECT 'Toast dla dorosłych', 15.00, 'adults'
WHERE NOT EXISTS (SELECT 1 FROM price_items WHERE label = 'Toast dla dorosłych');

