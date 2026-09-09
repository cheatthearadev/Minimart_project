-- Mini Mart Database Migration v3
-- Online Storefront support
-- Adds payment_method tracking to orders (MySQL 8 compatible)

-- Add the column only if it does not exist yet
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_method'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE orders ADD COLUMN payment_method ENUM(''cash'', ''wing'') DEFAULT ''cash'' AFTER discount_amount',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill payment_method for existing orders based on stored amounts
-- (wing orders were recorded with cash_received = total, indistinguishable from exact cash,
--  so existing records default to 'cash' - new orders store the real method)
UPDATE orders SET payment_method = 'cash' WHERE payment_method IS NULL;