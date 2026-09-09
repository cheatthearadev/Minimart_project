-- =============================================
-- Mini Mart Demo Seed Data
-- Clean, realistic data for client demonstrations.
-- Run after schema.sql / migration.sql:
--   mysql -uroot minimart_db < seed_demo.sql
-- Wipes existing records (products, orders, etc.).
-- =============================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE inventory_log;
TRUNCATE TABLE returns;
TRUNCATE TABLE shifts;
TRUNCATE TABLE deliveries;
TRUNCATE TABLE order_item;
TRUNCATE TABLE orders;
TRUNCATE TABLE discounts;
TRUNCATE TABLE customers;
TRUNCATE TABLE products;
TRUNCATE TABLE suppliers;
TRUNCATE TABLE categories;
TRUNCATE TABLE user;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- USERS  (password stored in plain text in this demo)
-- =============================================
INSERT INTO user (id, username, email, password, auth_provider, role) VALUES
(1, 'admin',      'admin@minimart.demo',      'admin123',   'local', 'admin'),
(2, 'Cheat Theara', 'cheat.theara@minimart.demo', 'theara123', 'local', 'cashier'),
(3, 'Vorn Bomey',   'vorn.bomey@minimart.demo',   'bomey123',  'local', 'cashier'),
(4, 'Sok Veayou',   'sok.veayou@minimart.demo',   'veayou123', 'local', 'cashier'),
(5, 'Som Vandy',    'som.vandy@minimart.demo',    'vandy123',  'local', 'cashier');

-- =============================================
-- CATEGORIES
-- =============================================
INSERT INTO categories (id, name, description, color) VALUES
(1, 'Beverages',              'Soft drinks, water and energy drinks',   '#3b82f6'),
(2, 'Snacks',                 'Chips, biscuits and confectionery',      '#f97316'),
(3, 'Instant Noodles & Food', 'Instant meals, sauces and canned food',  '#ef4444'),
(4, 'Household & Cleaning',   'Soap, detergent and cleaning supplies',  '#6366f1'),
(5, 'Personal Care',          'Shampoo, toothpaste and body care',      '#ec4899'),
(6, 'Dairy & Bakery',         'Milk, bread and fresh bakery items',     '#0ea5e9'),
(7, 'Alcohol',                'Beer and alcoholic beverages',           '#a855f7');

-- =============================================
-- SUPPLIERS
-- =============================================
INSERT INTO suppliers (id, name, phone, email, address, notes) VALUES
(1, 'TCC Beverage Distributor',    '012 345 678', 'sales@tccbeverage.com',    'Street 217, Phnom Penh',            'Primary beverage wholesaler'),
(2, 'Angkor Snack & Beverage Co.', '015 678 912', 'order@angkorsnack.com',    'National Road 3, Kandal',            'Snacks and imported chips'),
(3, 'Mekong Foods Import',         '017 234 567', 'info@mekongfoods.com',     'Russian Market, Phnom Penh',         'Noodles, sauces and canned goods'),
(4, 'HomeCare Wholesale Supplies', '016 789 123', 'support@homecare-kh.com',  'Toul Kork, Phnom Penh',              'Household and personal care');

-- =============================================
-- CUSTOMERS
-- =============================================
INSERT INTO customers (id, name, phone, email, points, total_spent) VALUES
(1, 'Sok Dara',      '012 345 678', 'sokdara@gmail.com',   0, 0.00),
(2, 'Chan Sreymom',  '098 765 432', 'sreymom.c@gmail.com', 0, 0.00),
(3, 'Nhem Piseth',   '015 222 333', NULL,                  0, 0.00),
(4, 'Kim Sotha',     '077 111 222', 'kimsotha@outlook.com',0, 0.00),
(5, 'Chea Bora',     '096 888 777', NULL,                  0, 0.00),
(6, 'Lim Channary',  '012 999 000', NULL,                  0, 0.00),
(7, 'Rithy Kunthea', '088 555 444', NULL,                  0, 0.00),
(8, 'Meas Sovann',   '099 123 456', 'sovann.meas@gmail.com', 0, 0.00),
(9, 'Hong Sokly',    '010 456 789', NULL,                  0, 0.00),
(10, 'Vat Chantha',  '011 234 567', NULL,                  0, 0.00),
(11, 'Ly Panha',     '098 321 654', NULL,                  0, 0.00),
(12, 'Ung Virak',    '092 654 321', NULL,                  0, 0.00);

-- =============================================
-- DISCOUNTS
-- =============================================
INSERT INTO discounts (id, code, type, value, min_order, max_uses, used_count, start_date, end_date, active) VALUES
(1, 'WELCOME10', 'percent', 10.00,  5.00,  0, 0, NULL, NULL, 1),
(2, 'SAVE5',     'fixed',    5.00, 30.00,  0, 0, NULL, NULL, 1),
(3, 'SUMMER15',  'percent', 15.00, 20.00,  0, 0, NULL, NULL, 1),
(4, 'FLAT10',    'fixed',   10.00, 50.00,  0, 0, NULL, NULL, 1);

-- =============================================
-- PRODUCTS
-- =============================================
INSERT INTO products (id, barcode, name, description, price, stock, cost_price, unit, category_id, supplier_id, image, is_favorite, low_stock_threshold) VALUES
-- Beverages
(1,  '5449000000996', 'Coca-Cola Original 1.5L',   'Classic cola, 1.5L bottle',      1.50,  48, 1.05, 'bottle', 1, 1, NULL, 1, 12),
(2,  '5449000001009', 'Coca-Cola Zero 330ml',      'Zero sugar cola, 330ml can',     0.90,  36, 0.62, 'can',    1, 1, NULL, 0, 12),
(3,  '5449000131805', 'Sprite 1.5L',               'Lemon-lime soda, 1.5L bottle',   1.50,  40, 1.05, 'bottle', 1, 1, NULL, 1, 12),
(4,  '5900209000001', 'Pepsi 1.5L',                'Pepsi cola, 1.5L bottle',        1.40,  24, 0.98, 'bottle', 1, 1, NULL, 0, 12),
(5,  '5449000141804', 'Fanta Orange 330ml',        'Orange soda, 330ml can',         0.80,  60, 0.55, 'can',    1, 1, NULL, 0, 12),
(6,  '9002490100070', 'Red Bull 250ml',            'Energy drink, 250ml can',        2.20,   9, 1.40, 'can',    1, 2, NULL, 0, 10),
(7,  '8996001600012', 'Sting Energy 330ml',        'Energy drink, 330ml can',        1.10,  30, 0.75, 'can',    1, 2, NULL, 0, 10),
(8,  '7613034613707', 'Pure Life Water 1.5L',      'Drinking water, 1.5L bottle',    0.60,  96, 0.35, 'bottle', 1, 1, NULL, 0, 24),
-- Alcohol
(9,  '8850011020023', 'Khmer Beer 330ml',          'Local lager, 330ml can',         1.80,  20, 1.20, 'can',    7, 2, NULL, 0, 10),
(10, '8850011020016', 'Angkor Beer 330ml',         'Premium local lager, 330ml',     1.90,  18, 1.25, 'can',    7, 2, NULL, 0, 10),
-- Dairy & Bakery
(11, '8934565420003', 'Fresh Milk 1L',             'Full cream milk, 1L',            2.50,  15, 1.90, 'bottle', 6, 3, NULL, 1, 8),
(12, '8991001103521', 'Yakult 5 Pack',             'Probiotic drink, pack of 5',     1.20,  40, 0.80, 'pack',   6, 3, NULL, 0, 12),
(13, '8930000000001', 'White Bread Loaf 480g',     'Soft white bread loaf',          1.30,  14, 0.90, 'loaf',   6, 3, NULL, 1, 6),
(14, '8930000000002', 'Butter Croissant 60g',      'Fresh butter croissant',         0.85,   0, 0.55, 'piece',  6, 3, NULL, 0, 6),
(15, '8930000000003', 'Sliced Sandwich Bread 300g','Sliced bread for sandwiches',    1.00,  22, 0.65, 'loaf',   6, 3, NULL, 0, 6),
(16, '8930000000004', 'Chocolate Muffin 70g',      'Chocolate chip muffin',          0.90,  18, 0.58, 'piece',  6, 3, NULL, 0, 6),
-- Snacks
(17, '8901498201122', 'Lay''s Classic Chips 70g',  'Classic salted potato chips',    1.20,  50, 0.85, 'pack',   2, 2, NULL, 1, 15),
(18, '7622210449283', 'Oreo Original 138g',        'Chocolate sandwich cookies',     1.80,  28, 1.25, 'pack',   2, 2, NULL, 0, 10),
(19, '4901309259106', 'Pocky Chocolate 48g',       'Chocolate biscuit sticks',       1.00,   5, 0.70, 'pack',   2, 2, NULL, 0, 10),
(20, '8850020000001', 'Khmer Cassava Chips 100g',  'Crispy cassava chips',           1.50,  33, 0.90, 'pack',   2, 2, NULL, 0, 10),
(21, '6901668300000', 'Snickers 50g',              'Peanut caramel chocolate bar',   1.00,  40, 0.65, 'bar',    2, 2, NULL, 0, 12),
(22, '7613037115897', 'KitKat 42g',                'Wafer chocolate bar',            0.90,   0, 0.60, 'bar',    2, 2, NULL, 0, 10),
(23, '8993001300011', 'Twisties Cheese 90g',       'Cheese flavoured corn snacks',   1.10,  42, 0.75, 'pack',   2, 2, NULL, 0, 10),
(24, '8886001000001', 'Peanut Cracker 100g',       'Peanut sandwich crackers',       1.00,  26, 0.68, 'pack',   2, 2, NULL, 0, 10),
-- Instant Noodles & Food
(25, '8801046029548', 'Samyang Spicy Ramen 140g',  'Korean spicy chicken ramen',     1.60,  55, 1.05, 'pack',   3, 3, NULL, 1, 15),
(26, '8850126101064', 'MAMA Instant Noodles 60g',  'Original flavour noodles',       0.35, 200, 0.22, 'pack',   3, 3, NULL, 0, 40),
(27, '8991000298053', 'Indomie Mi Goreng 80g',     'Fried noodles, single pack',     0.40, 180, 0.25, 'pack',   3, 3, NULL, 1, 40),
(28, '8856000200055', 'Tuna in Oil 155g',          'Canned tuna in vegetable oil',   2.10,  22, 1.45, 'can',    3, 3, NULL, 0, 8),
(29, '8850106400130', 'Soy Sauce 500ml',           'Golden soy sauce',               1.50,  30, 1.00, 'bottle', 3, 3, NULL, 0, 8),
(30, '8850305400001', 'Fish Sauce 500ml',          'Premium fish sauce',             1.80,  25, 1.15, 'bottle', 3, 3, NULL, 0, 8),
(31, '8850050000003', 'Rice Vermicelli 400g',      'Dried rice noodles',             1.30,  18, 0.85, 'pack',   3, 3, NULL, 0, 8),
(32, '8934800000005', 'Curry Instant Noodles 85g', 'Curry flavour instant noodles',  0.50, 120, 0.32, 'pack',   3, 3, NULL, 0, 24),
-- Household & Cleaning
(33, '6294001600011', 'Dettol Soap 100g',          'Antibacterial bath soap',        1.20,  35, 0.80, 'bar',    4, 4, NULL, 0, 10),
(34, '6902088351697', 'Lifebuoy Soap 90g',         'Protection soap bar',            1.10,   0, 0.75, 'bar',    4, 4, NULL, 0, 10),
(35, '8999999070001', 'Downy Fabric Softener 900ml','Softener refill bottle',        3.50,  20, 2.60, 'bottle', 4, 4, NULL, 0, 6),
(36, '8850002100822', 'Darlie Toothpaste 135g',    'Herbal mint toothpaste',         1.90,  24, 1.30, 'tube',   4, 4, NULL, 0, 8),
(37, '8999999070002', 'Detergent Powder 1kg',      'High-foam washing powder',       4.20,  16, 3.10, 'pack',   4, 4, NULL, 0, 6),
(38, '8850001000001', 'Dishwashing Liquid 500ml',  'Lemon dishwashing liquid',       2.40,  15, 1.70, 'bottle', 4, 4, NULL, 0, 6),
(39, '8999999070003', 'Laundry Liquid 1.8L',       'Concentrated liquid detergent',  5.50,   8, 4.00, 'bottle', 4, 4, NULL, 0, 5),
-- Personal Care
(40, '4902430443940', 'Pantene Shampoo 360ml',     'Anti-hairfall shampoo',          4.50,  12, 3.30, 'bottle', 5, 4, NULL, 0, 8),
(41, '8850002100823', 'Colgate Total 160g',        'Complete care toothpaste',       2.20,  28, 1.55, 'tube',   5, 4, NULL, 0, 8),
(42, '8850000000001', 'Shampoo Sachet 8ml',        'Single-use shampoo sachet',      0.15, 300, 0.08, 'sachet', 5, 4, NULL, 0, 60),
(43, '8850000000002', 'Deodorant Spray 40ml',      'Body deodorant spray',           1.70,   9, 1.15, 'bottle', 5, 4, NULL, 0, 8),
(44, '4995000000001', 'Razor 5 Pack',              'Disposable razors, 5 pack',      2.90,  20, 2.00, 'pack',   5, 4, NULL, 0, 6),
(45, '8990000000001', 'Cotton Buds 100s',          'Cotton swabs, pack of 100',      0.90,  32, 0.55, 'pack',   5, 4, NULL, 0, 10);

-- =============================================
-- GENERATE ORDERS FOR THE LAST 30 DAYS
-- =============================================
DELIMITER //
CREATE PROCEDURE generate_demo_orders()
BEGIN
  DECLARE v_d INT DEFAULT 30;
  DECLARE v_o INT;
  DECLARE v_od DATE;
  DECLARE v_ord_id INT;
  DECLARE v_item_count INT;
  DECLARE v_it INT;
  DECLARE v_prod_id INT;
  DECLARE v_qty INT;
  DECLARE v_price DECIMAL(10,2);
  DECLARE v_sub DECIMAL(10,2);
  DECLARE v_disc_id INT;
  DECLARE v_disc DECIMAL(10,2);
  DECLARE v_total DECIMAL(10,2);
  DECLARE v_cash DECIMAL(10,2);
  DECLARE v_cust INT;
  DECLARE v_usr INT;
  DECLARE v_otype VARCHAR(20);
  DECLARE v_hour INT;

  WHILE v_d >= 0 DO
    SET v_od = DATE_SUB(CURDATE(), INTERVAL v_d DAY);

    IF v_d = 0 THEN
      SET v_o = 0;
      SET v_o = 10 + FLOOR(RAND() * 7);
    ELSEIF DAYOFWEEK(v_od) IN (1, 7) THEN
      SET v_o = 6 + FLOOR(RAND() * 8);
    ELSE
      SET v_o = 4 + FLOOR(RAND() * 7);
    END IF;

    WHILE v_o > 0 DO
      SET v_o = v_o - 1;
      SET v_cust = IF(RAND() < 0.5, NULL, 1 + FLOOR(RAND() * 12));
      SET v_usr = 2 + FLOOR(RAND() * 4);
      SET v_item_count = 1 + FLOOR(RAND() * 4);
      SET v_sub = 0;
      SET v_disc = 0;
      SET v_disc_id = NULL;
      SET v_hour = 7 + FLOOR(RAND() * 13);
      SET v_otype = ELT(1 + FLOOR(RAND() * 10), 'dine_in', 'dine_in', 'dine_in', 'takeaway', 'takeaway', 'delivery', 'dine_in', 'takeaway', 'dine_in', 'dine_in');

      INSERT INTO orders (invoice_number, order_type, total_amount, cash_received, cash_return, user_id, customer_id, subtotal, discount_amount, status, created_at)
      VALUES (
        CONCAT('INV-', DATE_FORMAT(v_od, '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9000), 4, '0')),
        v_otype, 0, 0, 0, v_usr, v_cust, 0, 0, 'completed',
        CONCAT(v_od, ' ', LPAD(v_hour, 2, '0'), ':', LPAD(FLOOR(RAND() * 60), 2, '0'), ':', LPAD(FLOOR(RAND() * 60), 2, '0'))
      );
      SET v_ord_id = LAST_INSERT_ID();

      SET v_it = 0;
      WHILE v_it < v_item_count DO
        SET v_it = v_it + 1;
        SET v_prod_id = 1 + FLOOR(RAND() * 45);
        SET v_qty = 1 + FLOOR(RAND() * 4);
        SELECT price INTO v_price FROM products WHERE id = v_prod_id;
        SET v_sub = v_sub + (v_price * v_qty);
        INSERT INTO order_item (order_id, product_id, quantity, price) VALUES (v_ord_id, v_prod_id, v_qty, v_price);
      END WHILE;

      IF v_sub > 5 AND RAND() < 0.2 THEN
        SET v_disc_id = 1 + FLOOR(RAND() * 4);
        SELECT value INTO v_disc FROM discounts WHERE id = v_disc_id AND type = 'percent';
        IF v_disc_id = 2 THEN SET v_disc = 5.00; END IF;
        IF v_disc_id = 4 THEN SET v_disc = 10.00; END IF;
        IF v_disc IS NULL OR v_disc > v_sub THEN SET v_disc = 0; END IF;
        UPDATE discounts SET used_count = used_count + 1 WHERE id = v_disc_id;
      END IF;

      SET v_total = v_sub - v_disc;
      SET v_cash = CEIL(v_total / 5) * 5;
      IF v_cash < v_total THEN SET v_cash = v_total; END IF;

      UPDATE orders
      SET subtotal = v_sub, discount_amount = v_disc, total_amount = v_total,
          cash_received = v_cash, cash_return = v_cash - v_total
      WHERE id = v_ord_id;

      IF v_cust IS NOT NULL THEN
        UPDATE customers SET total_spent = total_spent + v_total, points = points + FLOOR(v_total) WHERE id = v_cust;
      END IF;

      IF v_otype = 'delivery' THEN
        INSERT INTO deliveries (order_id, customer_name, customer_phone, delivery_address, delivery_notes, delivery_fee, status, driver_name, driver_phone, estimated_time, created_at)
        VALUES (
          v_ord_id,
          COALESCE((SELECT name FROM customers WHERE id = v_cust), 'Walk-in Customer'),
          CONCAT('09', LPAD(FLOOR(RAND() * 10000000), 7, '0')),
          CONCAT('House ', 1 + FLOOR(RAND() * 200), ', Street ', 1 + FLOOR(RAND() * 60), ', Phnom Penh'),
          'Call before delivery',
          1.50,
          ELT(1 + FLOOR(RAND() * 5), 'delivered', 'delivered', 'delivered', 'in_transit', 'pending'),
          'Sok Dara', '092 222 333', 30,
          CONCAT(v_od, ' ', LPAD(v_hour, 2, '0'), ':20:00')
        );
      END IF;
    END WHILE;

    SET v_d = v_d - 1;
  END WHILE;
END//
DELIMITER ;

CALL generate_demo_orders();
DROP PROCEDURE generate_demo_orders;

-- =============================================
-- SHIFTS (recent days + one active today)
-- =============================================
INSERT INTO shifts (user_id, start_time, end_time, starting_cash, ending_cash, total_sales, status, notes)
SELECT u.id,
       DATE_SUB(CURDATE(), INTERVAL d DAY) + INTERVAL 7 HOUR,
       DATE_SUB(CURDATE(), INTERVAL d DAY) + INTERVAL 17 HOUR,
       50.00,
       50.00 + ROUND(RAND() * 300, 2),
       ROUND(RAND() * 250, 2),
       'closed',
       'Morning to evening shift'
FROM user u
CROSS JOIN (SELECT 1 AS d UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) days
WHERE u.id = 2;

INSERT INTO shifts (user_id, start_time, end_time, starting_cash, ending_cash, total_sales, status, notes)
VALUES (1, NOW() - INTERVAL 3 HOUR, NULL, 50.00, NULL, 0.00, 'active', 'Current shift');

-- =============================================
-- RETURNS (a few recent examples)
-- =============================================
INSERT INTO returns (order_id, product_id, quantity, reason, refund_amount, processed_by, created_at)
SELECT o.id, oi.product_id, 1, 'Item damaged in transit', oi.price, 1, o.created_at
FROM orders o
JOIN order_item oi ON oi.order_id = o.id
JOIN (SELECT id FROM orders ORDER BY id LIMIT 4 OFFSET 6) sel ON sel.id = o.id;

-- =============================================
-- INVENTORY LOG (recent restocks / adjustments)
-- =============================================
INSERT INTO inventory_log (product_id, type, quantity_change, note, created_at)
SELECT p.id, 'restock', 24, 'Weekly supplier restock', DATE_SUB(CURDATE(), INTERVAL 2 DAY)
FROM products p WHERE p.id IN (1, 3, 26);
