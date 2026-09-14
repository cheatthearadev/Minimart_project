-- Migration v7: Add audit_log table, tax support, and indexes

CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Helper procedure for safe column addition
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND COLUMN_NAME = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Add tax columns
CALL add_column_if_not_exists('orders', 'tax_rate', 'DECIMAL(5,2) DEFAULT 0 AFTER discount_amount');
CALL add_column_if_not_exists('orders', 'tax_amount', 'DECIMAL(10,2) DEFAULT 0 AFTER tax_rate');

-- Add updated_at columns
CALL add_column_if_not_exists('products', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_not_exists('categories', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_not_exists('suppliers', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_not_exists('customers', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_not_exists('user', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL add_column_if_not_exists('orders', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Helper procedure for safe index creation
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_index_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = p_table
        AND INDEX_NAME = p_index
    ) THEN
        SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, '(', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Performance indexes
CALL add_index_if_not_exists('products', 'idx_products_category', 'category_id');
CALL add_index_if_not_exists('products', 'idx_products_supplier', 'supplier_id');
CALL add_index_if_not_exists('products', 'idx_products_name', 'name');
CALL add_index_if_not_exists('orders', 'idx_orders_created', 'created_at');
CALL add_index_if_not_exists('orders', 'idx_orders_user', 'user_id');
CALL add_index_if_not_exists('orders', 'idx_orders_customer', 'customer_id');
CALL add_index_if_not_exists('orders', 'idx_orders_status', 'status');
CALL add_index_if_not_exists('order_item', 'idx_order_item_product', 'product_id');
CALL add_index_if_not_exists('customers', 'idx_customers_phone', 'phone');
CALL add_index_if_not_exists('customers', 'idx_customers_tier', 'loyalty_tier');
CALL add_index_if_not_exists('deliveries', 'idx_deliveries_status', 'status');

-- Cleanup procedures
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;
