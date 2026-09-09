-- Migration v6: Add full_name, profile_image to user table
-- Run this SQL to upgrade from v5 to v6

-- Add full_name column (skip if already exists)
SET @dbname = DATABASE();
SET @tablename = 'user';
SET @columnname = 'full_name';
SET @pre_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname);
SET @sqlstmt = IF(@pre_count = 0, 'ALTER TABLE user ADD COLUMN full_name VARCHAR(200) NULL AFTER username', 'SELECT "Column full_name already exists" AS status');
PREPARE alter_stmt FROM @sqlstmt;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;

-- Add profile_image column (skip if already exists)
SET @columnname = 'profile_image';
SET @pre_count = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname);
SET @sqlstmt = IF(@pre_count = 0, 'ALTER TABLE user ADD COLUMN profile_image VARCHAR(500) NULL AFTER full_name', 'SELECT "Column profile_image already exists" AS status');
PREPARE alter_stmt FROM @sqlstmt;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;

-- Update existing users with full names from username where full_name is NULL
UPDATE user SET full_name = username WHERE full_name IS NULL;
