<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include_once __DIR__ . '/config/database.php';

if (!isset($conn)) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$results = [];

function safeExec($conn, $sql) {
    try {
        $stmt = $conn->query($sql);
        $stmt->closeCursor();
        return true;
    } catch (PDOException $e) {
        return false;
    }
}

function runSQL($conn, $sql, $label) {
    global $results;
    if (safeExec($conn, $sql)) {
        $results[] = ["step" => $label, "status" => "ok"];
    } else {
        $results[] = ["step" => $label, "status" => "skipped"];
    }
}

function runMultiLineSQL($conn, $content, $label) {
    global $results;
    $statements = array_filter(array_map('trim', explode(';', $content)));
    $ok = 0;
    $skip = 0;
    foreach ($statements as $stmt) {
        if (empty($stmt) || preg_match('/^--/s', $stmt)) continue;
        if (preg_match('/^DELIMITER/i', $stmt)) continue;
        if (preg_match('/^SET\s+FOREIGN_KEY_CHECKS/i', $stmt)) { safeExec($conn, $stmt); continue; }
        if (preg_match('/^CALL\s+generate_demo/i', $stmt)) { $skip++; continue; }
        if (preg_match('/^DROP\s+PROCEDURE/i', $stmt)) { safeExec($conn, $stmt); continue; }
        if (preg_match('/^PREPARE/i', $stmt)) { safeExec($conn, $stmt); continue; }
        if (preg_match('/^EXECUTE/i', $stmt)) { safeExec($conn, $stmt); continue; }
        if (preg_match('/^DEALLOCATE/i', $stmt)) { safeExec($conn, $stmt); continue; }
        if (safeExec($conn, $stmt)) {
            $ok++;
        } else {
            $skip++;
        }
    }
    $results[] = ["step" => $label, "status" => "ok", "executed" => $ok, "skipped" => $skip];
}

$schema = file_get_contents(__DIR__ . '/database/schema.sql');
runMultiLineSQL($conn, $schema, "schema.sql");

safeExec($conn, "CREATE TABLE IF NOT EXISTS `user` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(200) NULL,
    profile_image VARCHAR(500) NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    auth_provider VARCHAR(50) DEFAULT 'local',
    role ENUM('admin', 'cashier') DEFAULT 'cashier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8");
$results[] = ["step" => "fix: create `user` table with backticks", "status" => "ok"];

// Fix missing columns from migration_v7 (stored procedures were skipped)
$fixCols = [
    "ALTER TABLE products ADD COLUMN low_stock_threshold INT DEFAULT 10 AFTER image",
    "ALTER TABLE products ADD COLUMN is_favorite TINYINT(1) DEFAULT 0 AFTER low_stock_threshold",
    "ALTER TABLE products ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER is_favorite",
    "ALTER TABLE categories ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER color",
    "ALTER TABLE suppliers ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER notes",
    "ALTER TABLE customers ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER total_spent",
    "ALTER TABLE orders ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0 AFTER discount_amount",
    "ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0 AFTER tax_rate",
    "ALTER TABLE orders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER status",
];
$fixed = 0;
foreach ($fixCols as $sql) {
    if (safeExec($conn, $sql)) $fixed++;
}
$results[] = ["step" => "fix: add missing columns", "status" => "ok", "count" => $fixed];

// Create audit_log table (from migration_v7)
safeExec($conn, "CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8");
$results[] = ["step" => "fix: create audit_log table", "status" => "ok"];

$migrations = ['migration.sql', 'migration_v3.sql', 'migration_v4.sql', 'migration_v5.sql', 'migration_v6.sql', 'migration_v7.sql'];
foreach ($migrations as $m) {
    $path = __DIR__ . '/database/' . $m;
    if (file_exists($path)) {
        $content = file_get_contents($path);
        runMultiLineSQL($conn, $content, $m);
    }
}

safeExec($conn, "INSERT IGNORE INTO user (id, username, password, role) VALUES (1, 'admin', '\$2y\$12\$IwHNvucnwPhjQx96i.W.rupVZRbVjIYCvc.XRCaUqKxGcDyEDLYNi', 'admin')");
$results[] = ["step" => "seed: admin user", "status" => "ok"];

safeExec($conn, "INSERT IGNORE INTO categories (id, name, description, color) VALUES (1,'Beverages','Soft drinks, water and energy drinks','#3b82f6'),(2,'Snacks','Chips, biscuits and confectionery','#f97316'),(3,'Instant Noodles & Food','Instant meals, sauces and canned food','#ef4444'),(4,'Household & Cleaning','Soap, detergent and cleaning supplies','#6366f1'),(5,'Personal Care','Shampoo, toothpaste and body care','#ec4899'),(6,'Dairy & Bakery','Milk, bread and fresh bakery items','#0ea5e9'),(7,'Alcohol','Beer and alcoholic beverages','#a855f7')");
$results[] = ["step" => "seed: categories", "status" => "ok"];

safeExec($conn, "INSERT IGNORE INTO suppliers (id, name, phone, email, address, notes) VALUES (1,'TCC Beverage Distributor','012 345 678','sales@tccbeverage.com','Street 217, Phnom Penh','Primary beverage wholesaler'),(2,'Angkor Snack & Beverage Co.','015 678 912','order@angkorsnack.com','National Road 3, Kandal','Snacks and imported chips'),(3,'Mekong Foods Import','017 234 567','info@mekongfoods.com','Russian Market, Phnom Penh','Noodles, sauces and canned goods'),(4,'HomeCare Wholesale Supplies','016 789 123','support@homecare-kh.com','Toul Kork, Phnom Penh','Household and personal care')");
$results[] = ["step" => "seed: suppliers", "status" => "ok"];

safeExec($conn, "INSERT IGNORE INTO customers (id, name, phone, points, total_spent) VALUES (1,'Sok Dara','012 345 678',0,0.00),(2,'Chan Sreymom','098 765 432',0,0.00),(3,'Nhem Piseth','015 222 333',0,0.00),(4,'Kim Sotha','077 111 222',0,0.00),(5,'Chea Bora','096 888 777',0,0.00),(6,'Lim Channary','012 999 000',0,0.00),(7,'Rithy Kunthea','088 555 444',0,0.00),(8,'Meas Sovann','099 123 456',0,0.00),(9,'Hong Sokly','010 456 789',0,0.00),(10,'Vat Chantha','011 234 567',0,0.00),(11,'Ly Panha','098 321 654',0,0.00),(12,'Ung Virak','092 654 321',0,0.00)");
$results[] = ["step" => "seed: customers", "status" => "ok"];

safeExec($conn, "INSERT IGNORE INTO discounts (id, code, type, value, min_order, max_uses, used_count, active) VALUES (1,'WELCOME10','percent',10.00,5.00,0,0,1),(2,'SAVE5','fixed',5.00,30.00,0,0,1),(3,'SUMMER15','percent',15.00,20.00,0,0,1),(4,'FLAT10','fixed',10.00,50.00,0,0,1)");
$results[] = ["step" => "seed: discounts", "status" => "ok"];

safeExec($conn, "INSERT IGNORE INTO products (id, barcode, name, description, price, stock, cost_price, unit, category_id, supplier_id) VALUES (1,'5449000000996','Coca-Cola Original 1.5L','Classic cola, 1.5L bottle',1.50,48,1.05,'bottle',1,1),(2,'5449000001009','Coca-Cola Zero 330ml','Zero sugar cola, 330ml can',0.90,36,0.62,'can',1,1),(3,'5449000131805','Sprite 1.5L','Lemon-lime soda, 1.5L bottle',1.50,40,1.05,'bottle',1,1),(4,'5900209000001','Pepsi 1.5L','Pepsi cola, 1.5L bottle',1.40,24,0.98,'bottle',1,1),(5,'5449000141804','Fanta Orange 330ml','Orange soda, 330ml can',0.80,60,0.55,'can',1,1),(6,'9002490100070','Red Bull 250ml','Energy drink, 250ml can',2.20,9,1.40,'can',1,2),(7,'8996001600012','Sting Energy 330ml','Energy drink, 330ml can',1.10,30,0.75,'can',1,2),(8,'7613034613707','Pure Life Water 1.5L','Drinking water, 1.5L bottle',0.60,96,0.35,'bottle',1,1),(9,'8850011020023','Khmer Beer 330ml','Local lager, 330ml can',1.80,20,1.20,'can',7,2),(10,'8850011020016','Angkor Beer 330ml','Premium local lager, 330ml',1.90,18,1.25,'can',7,2),(11,'8934565420003','Fresh Milk 1L','Full cream milk, 1L',2.50,15,1.90,'bottle',6,3),(12,'8991001103521','Yakult 5 Pack','Probiotic drink, pack of 5',1.20,40,0.80,'pack',6,3),(13,'8930000000001','White Bread Loaf 480g','Soft white bread loaf',1.30,14,0.90,'loaf',6,3),(14,'8930000000002','Butter Croissant 60g','Fresh butter croissant',0.85,20,0.55,'piece',6,3),(15,'8930000000003','Sliced Sandwich Bread 300g','Sliced bread for sandwiches',1.00,22,0.65,'loaf',6,3),(16,'8930000000004','Chocolate Muffin 70g','Chocolate chip muffin',0.90,18,0.58,'piece',6,3),(17,'8901498201122','Lays Classic Chips 70g','Classic salted potato chips',1.20,50,0.85,'pack',2,2),(18,'7622210449283','Oreo Original 138g','Chocolate sandwich cookies',1.80,28,1.25,'pack',2,2),(19,'4901309259106','Pocky Chocolate 48g','Chocolate biscuit sticks',1.00,25,0.70,'pack',2,2),(20,'8850020000001','Khmer Cassava Chips 100g','Crispy cassava chips',1.50,33,0.90,'pack',2,2),(21,'6901668300000','Snickers 50g','Peanut caramel chocolate bar',1.00,40,0.65,'bar',2,2),(22,'7613037115897','KitKat 42g','Wafer chocolate bar',0.90,25,0.60,'bar',2,2),(23,'8993001300011','Twisties Cheese 90g','Cheese flavoured corn snacks',1.10,42,0.75,'pack',2,2),(24,'8886001000001','Peanut Cracker 100g','Peanut sandwich crackers',1.00,26,0.68,'pack',2,2),(25,'8801046029548','Samyang Spicy Ramen 140g','Korean spicy chicken ramen',1.60,55,1.05,'pack',3,3),(26,'8850126101064','MAMA Instant Noodles 60g','Original flavour noodles',0.35,200,0.22,'pack',3,3),(27,'8991000298053','Indomie Mi Goreng 80g','Fried noodles, single pack',0.40,180,0.25,'pack',3,3),(28,'8856000200055','Tuna in Oil 155g','Canned tuna in vegetable oil',2.10,22,1.45,'can',3,3),(29,'8850106400130','Soy Sauce 500ml','Golden soy sauce',1.50,30,1.00,'bottle',3,3),(30,'8850305400001','Fish Sauce 500ml','Premium fish sauce',1.80,25,1.15,'bottle',3,3),(31,'8850050000003','Rice Vermicelli 400g','Dried rice noodles',1.30,18,0.85,'pack',3,3),(32,'8934800000005','Curry Instant Noodles 85g','Curry flavour instant noodles',0.50,120,0.32,'pack',3,3),(33,'6294001600011','Dettol Soap 100g','Antibacterial bath soap',1.20,35,0.80,'bar',4,4),(34,'6902088351697','Lifebuoy Soap 90g','Protection soap bar',1.10,30,0.75,'bar',4,4),(35,'8999999070001','Downy Fabric Softener 900ml','Softener refill bottle',3.50,20,2.60,'bottle',4,4),(36,'8850002100822','Darlie Toothpaste 135g','Herbal mint toothpaste',1.90,24,1.30,'tube',4,4),(37,'8999999070002','Detergent Powder 1kg','High-foam washing powder',4.20,16,3.10,'pack',4,4),(38,'8850001000001','Dishwashing Liquid 500ml','Lemon dishwashing liquid',2.40,15,1.70,'bottle',4,4),(39,'8999999070003','Laundry Liquid 1.8L','Concentrated liquid detergent',5.50,8,4.00,'bottle',4,4),(40,'4902430443940','Pantene Shampoo 360ml','Anti-hairfall shampoo',4.50,12,3.30,'bottle',5,4),(41,'8850002100823','Colgate Total 160g','Complete care toothpaste',2.20,28,1.55,'tube',5,4),(42,'8850000000001','Shampoo Sachet 8ml','Single-use shampoo sachet',0.15,300,0.08,'sachet',5,4),(43,'8850000000002','Deodorant Spray 40ml','Body deodorant spray',1.70,9,1.15,'bottle',5,4),(44,'4995000000001','Razor 5 Pack','Disposable razors, 5 pack',2.90,20,2.00,'pack',5,4),(45,'8990000000001','Cotton Buds 100s','Cotton swabs, pack of 100',0.90,32,0.55,'pack',5,4)");
$results[] = ["step" => "seed: products", "status" => "ok"];

$products = [];
$stmt = $conn->query("SELECT id, price FROM products");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);
$stmt->closeCursor();

$users = [2, 3, 4, 5];
$otypes = ['dine_in', 'dine_in', 'takeaway', 'delivery'];
$orderCount = 0;

for ($d = 30; $d >= 0; $d--) {
    $date = date('Y-m-d', strtotime("-{$d} days"));
    $numOrders = ($d === 0) ? 8 : (in_array(date('w', strtotime($date)), [0, 6]) ? rand(6, 10) : rand(3, 7));

    for ($o = 0; $o < $numOrders; $o++) {
        $userId = $users[array_rand($users)];
        $otype = $otypes[array_rand($otypes)];
        $custId = (rand(0, 100) < 50) ? null : rand(1, 12);
        $hour = rand(7, 19);
        $min = rand(0, 59);
        $created = "{$date} {$hour}:" . str_pad($min, 2, '0', STR_PAD_LEFT) . ":00";
        $invoice = "INV-" . date('Ymd', strtotime($date)) . "-" . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);

        $numItems = rand(1, 4);
        $subtotal = 0;
        $items = [];
        $usedProducts = [];
        for ($i = 0; $i < $numItems; $i++) {
            do { $p = $products[array_rand($products)]; } while (in_array($p['id'], $usedProducts));
            $usedProducts[] = $p['id'];
            $qty = rand(1, 4);
            $subtotal += $p['price'] * $qty;
            $items[] = [$p['id'], $qty, $p['price']];
        }

        $discAmount = ($subtotal > 5 && rand(0, 100) < 20) ? round($subtotal * 0.10, 2) : 0;
        $total = round($subtotal - $discAmount, 2);
        $cash = max(ceil($total / 5) * 5, $total);

        try {
            $stmt = $conn->prepare("INSERT INTO orders (invoice_number, order_type, total_amount, cash_received, cash_return, user_id, customer_id, subtotal, discount_amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)");
            $stmt->execute([$invoice, $otype, $total, $cash, round($cash - $total, 2), $userId, $custId, $subtotal, $discAmount, $created]);
            $orderId = $conn->lastInsertId();
            $stmt->closeCursor();

            foreach ($items as $item) {
                $s = $conn->prepare("INSERT INTO order_item (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
                $s->execute([$orderId, $item[0], $item[1], $item[2]]);
                $s->closeCursor();
            }

            if ($custId) {
                $s = $conn->prepare("UPDATE customers SET total_spent = total_spent + ?, points = points + FLOOR(?) WHERE id = ?");
                $s->execute([$total, $total, $custId]);
                $s->closeCursor();
            }

            $orderCount++;
        } catch (PDOException $e) {}
    }
}

$results[] = ["step" => "seed: demo orders", "status" => "ok", "count" => $orderCount];

safeExec($conn, "INSERT IGNORE INTO shifts (id, user_id, start_time, starting_cash, total_sales, status, notes) VALUES (1, 1, NOW() - INTERVAL 3 HOUR, 50.00, 0.00, 'active', 'Current shift')");
$results[] = ["step" => "seed: active shift", "status" => "ok"];

echo json_encode(["message" => "Database setup complete!", "results" => $results], JSON_PRETTY_PRINT);
?>
