<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once __DIR__ . '/../config/database.php';

try {
    $stmt = $conn->prepare("SELECT id, username, password FROM user");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $updated = 0;
    foreach ($users as $user) {
        // Skip if already hashed
        if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
            $hashed = password_hash($user['password'], PASSWORD_DEFAULT);
            $update = $conn->prepare("UPDATE user SET password = :password WHERE id = :id");
            $update->bindParam(":password", $hashed);
            $update->bindParam(":id", $user['id'], PDO::PARAM_INT);
            $update->execute();
            $updated++;
        }
    }

    echo json_encode(["success" => true, "message" => "Migrated $updated passwords"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
