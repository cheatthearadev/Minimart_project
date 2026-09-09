-- Mini Mart Database Migration
-- Run this SQL to upgrade from v1 to v2 with all new features

-- =============================================
-- ALTER EXISTING TABLES
-- =============================================

-- Products: add category, supplier, unit, cost_price
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT NULL AFTER stock;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id INT NULL AFTER category_id;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'piece' AFTER supplier_id;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0.00 AFTER unit;

-- Orders: add customer, discount, user tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER cash_return;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INT NULL AFTER user_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_id INT NULL AFTER customer_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0.00 AFTER discount_id;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER subtotal;

-- =============================================
-- NEW TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    points INT DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
    value DECIMAL(10,2) NOT NULL,
    min_order DECIMAL(10,2) DEFAULT 0.00,
    max_uses INT DEFAULT 0,
    used_count INT DEFAULT 0,
    start_date DATE,
    end_date DATE,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    reason TEXT,
    refund_amount DECIMAL(10,2) NOT NULL,
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,
    starting_cash DECIMAL(10,2) DEFAULT 0.00,
    ending_cash DECIMAL(10,2) NULL,
    total_sales DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'closed') DEFAULT 'active',
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS inventory_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    type ENUM('sale', 'return', 'adjustment', 'restock') NOT NULL,
    quantity_change INT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Add foreign keys for new columns
ALTER TABLE products ADD FOREIGN KEY IF NOT EXISTS (category_id) REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD FOREIGN KEY IF NOT EXISTS (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD FOREIGN KEY IF NOT EXISTS (user_id) REFERENCES user(id) ON DELETE SET NULL;
ALTER TABLE orders ADD FOREIGN KEY IF NOT EXISTS (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Insert default category
INSERT IGNORE INTO categories (id, name, description, color) VALUES
(1, 'General', 'Uncategorized products', '#6366f1');

-- =============================================
-- DELIVERY FEATURE
-- =============================================

-- Add order_type to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type ENUM('dine_in', 'takeaway', 'delivery') DEFAULT 'dine_in' AFTER invoice_number;

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_notes TEXT,
    delivery_fee DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
    driver_name VARCHAR(100),
    driver_phone VARCHAR(30),
    estimated_time INT DEFAULT 30,
    actual_delivery_time DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
