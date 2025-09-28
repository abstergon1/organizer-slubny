CREATE DATABASE IF NOT EXISTS wedding_organizer;
USE wedding_organizer;

-- Usunięcie starych tabel w poprawnej kolejności, aby uniknąć błędów kluczy obcych
DROP TABLE IF EXISTS table_seats, tables, children, guests, vendor_payments, tasks, vendors, settings, organizer_users, organizers, users;
-- ZMIANA: Dodano vendor_payments do listy DROP

-- Tabela `users` przechowuje dane logowania.
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela `organizers` reprezentuje pojedynczy "projekt ślubny".
CREATE TABLE organizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_user_id INT NOT NULL,
    organizer_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela `organizer_users` łączy użytkowników z organizerami (dla funkcji współdzielenia).
CREATE TABLE organizer_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    user_id INT NOT NULL,
    permission_level ENUM('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (organizer_id, user_id)
);

-- Tabela dla dostawców/kosztów z usuniętymi kolumnami 'deposit' i 'paid_full'
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    -- USUNIĘTO: deposit DECIMAL(10, 2) DEFAULT 0.00,
    -- USUNIĘTO: paid_full BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
);

-- NOWA TABELA: vendor_payments
CREATE TABLE vendor_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Tabela dla zadań z dodaną kolumną `organizer_id`
-- ZMIANA: Usunięcie vendor_id z tasks, jeśli chcemy to całkowicie usunąć, 
-- ALE zostawiamy, aby móc śledzić zadania płatności.
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    owner VARCHAR(100),
    completed BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    is_payment_task BOOLEAN DEFAULT FALSE,
    vendor_id INT, -- Zostawiamy do powiązania zadania z dostawcą.
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL -- Dodano powiązanie
);

-- Tabela dla grup gości z dodaną kolumną `organizer_id`
CREATE TABLE guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    guest1_name VARCHAR(255),
    guest2_name VARCHAR(255),
    confirmed BOOLEAN DEFAULT FALSE,
    accommodation INT DEFAULT 0,
    -- NOWE KOLUMNY DLA RSVP
    rsvp_token VARCHAR(32) UNIQUE,
    rsvp_status ENUM('unconfirmed', 'pending', 'confirmed', 'rejected') NOT NULL DEFAULT 'unconfirmed',
    rsvp_date DATETIME DEFAULT NULL,
	notes VARCHAR(500) DEFAULT NULL,
	after_party TINYINT DEFAULT 0,
	confirmed_adults TINYINT DEFAULT 0;
	confirmed_children TINYINT DEFAULT 0;
	FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
);

-- Tabela dla dzieci (bez zmian, jest powiązana przez `guests`)
CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_group_id INT NOT NULL,
    child_name VARCHAR(255) NOT NULL,
    age INT DEFAULT 0,
    FOREIGN KEY (guest_group_id) REFERENCES guests(id) ON DELETE CASCADE
);

-- Tabela dla stołów z dodaną kolumną `organizer_id`
CREATE TABLE tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    shape ENUM('rect', 'round') DEFAULT 'rect',
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
);

-- Tabela dla miejsc przy stołach (bez zmian, powiązana przez `tables`)
CREATE TABLE table_seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_id INT NOT NULL,
    seat_index INT NOT NULL,
    person_type ENUM('guest1', 'guest2', 'child') DEFAULT NULL,
    person_id INT DEFAULT NULL,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- Tabela dla ustawień z dodaną kolumną `organizer_id`
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    UNIQUE KEY (organizer_id, setting_key),
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE
);

<<<<<<< Updated upstream
-- Początkowe dane dla ustawień (POPRAWIONA SEKCJA)
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('wedding_date', ''),
('price_adult', '0'),
('price_child_older', '0'),
('price_child_younger', '0'),
('price_accommodation', '0');
=======

>>>>>>> Stashed changes
