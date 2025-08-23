-- Ustawienia ogólne i cennik (zawsze tylko jeden wiersz)
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  wedding_date DATE NULL,
  price_adult DECIMAL(10, 2) DEFAULT 0.00,
  price_child_older DECIMAL(10, 2) DEFAULT 0.00,
  price_child_younger DECIMAL(10, 2) DEFAULT 0.00,
  price_accommodation DECIMAL(10, 2) DEFAULT 0.00
);

-- Usługodawcy
CREATE TABLE vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  deposit DECIMAL(10, 2) DEFAULT 0.00,
  payment_date DATE NULL,
  paid_full BOOLEAN DEFAULT FALSE
);

-- Zadania
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  task_date DATE NOT NULL,
  owner VARCHAR(255),
  completed BOOLEAN DEFAULT FALSE,
  completion_date DATE NULL,
  is_payment_task BOOLEAN DEFAULT FALSE,
  vendor_id INT NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Grupy gości (rodziny/pary)
CREATE TABLE guest_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest1 VARCHAR(255),
  guest2 VARCHAR(255),
  confirmed BOOLEAN DEFAULT FALSE,
  accommodation INT DEFAULT 0
);

-- Dzieci przypisane do grup gości
CREATE TABLE children (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES guest_groups(id) ON DELETE CASCADE
);

-- Stoły
CREATE TABLE tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  shape VARCHAR(50) NOT NULL -- 'round' or 'rect'
);

-- Miejsca przy stołach i ich przypisanie
CREATE TABLE seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_id INT NOT NULL,
  -- Unikalny identyfikator osoby w formacie: person-ID_GRUPY-klucz
  -- np. 'person-15-guest1' lub 'person-15-child0'
  person_id VARCHAR(255) NULL, 
  FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- Wstawienie domyślnego wiersza ustawień
INSERT INTO settings (id) VALUES (1);