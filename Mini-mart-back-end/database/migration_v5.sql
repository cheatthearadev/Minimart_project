-- Mini Mart Database Migration v5
-- Coupons feature (separate from existing discounts)
-- Creates the coupons table and adds coupon columns to orders
--
-- MySQL 8 compatible (idempotent - safe to run more than once)

-- =============================================
-- COUPONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) NULL,
    max_uses INT NULL,
    used_count INT NOT NULL DEFAULT 0,
    expires_at DATE NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- =============================================
-- ORDERS: coupon columns
-- =============================================

-- Add coupon_code only if it does not exist yet
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'coupon_code'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) NULL AFTER discount_id',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;