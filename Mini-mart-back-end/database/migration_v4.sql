-- Mini Mart Database Migration v4
-- Customer Loyalty Tier feature
-- Adds loyalty_tier to customers and backfills based on total_spent
--
-- Tier thresholds:
--   bronze   : $0 - $49.99
--   silver   : $50 - $99.99
--   gold     : $100 - $199.99
--   platinum : $200+
--
-- MySQL 8 compatible (idempotent - safe to run more than once)

-- Add the loyalty_tier column only if it does not exist yet
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'loyalty_tier'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE customers ADD COLUMN loyalty_tier ENUM(''bronze'', ''silver'', ''gold'', ''platinum'') DEFAULT ''bronze'' AFTER total_spent',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill loyalty_tier for existing customers based on their lifetime total_spent
UPDATE customers
SET loyalty_tier = CASE
    WHEN total_spent >= 200.00 THEN 'platinum'
    WHEN total_spent >= 100.00 THEN 'gold'
    WHEN total_spent >= 50.00 THEN 'silver'
    ELSE 'bronze'
END;
