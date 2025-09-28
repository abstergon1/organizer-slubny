-- Migration: Add price_items table
CREATE TABLE IF NOT EXISTS price_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    scope ENUM('all', 'adults') NOT NULL DEFAULT 'all'
);

INSERT INTO price_items (label, amount, scope)
SELECT 'Upominek powitalny', 10.00, 'all'
WHERE NOT EXISTS (SELECT 1 FROM price_items WHERE label = 'Upominek powitalny');

INSERT INTO price_items (label, amount, scope)
SELECT 'Toast dla dorosłych', 15.00, 'adults'
WHERE NOT EXISTS (SELECT 1 FROM price_items WHERE label = 'Toast dla dorosłych');


