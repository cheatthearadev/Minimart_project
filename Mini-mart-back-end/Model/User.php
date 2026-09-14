<?php
class UserModel {
    private $conn;
    private $table_name = "user"; 

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($username, $password) {
        $query = "SELECT id, username, full_name, password, role, profile_image FROM " . $this->table_name . " WHERE username = :username LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $storedPassword = $row['password'];

            $matched = false;
            if(strpos($storedPassword, '$2y$') === 0 || strpos($storedPassword, '$2a$') === 0 || strpos($storedPassword, '$2b$') === 0) {
                $matched = password_verify($password, $storedPassword);
            } else {
                $matched = ($storedPassword === $password);
                if($matched) {
                    $newHash = password_hash($password, PASSWORD_DEFAULT);
                    $update = $this->conn->prepare("UPDATE " . $this->table_name . " SET password = :pw WHERE id = :id");
                    $update->bindParam(":pw", $newHash);
                    $update->bindParam(":id", $row['id']);
                    $update->execute();
                }
            }

            if($matched) {
                return array(
                    "id" => $row['id'],
                    "username" => $row['username'],
                    "full_name" => $row['full_name'],
                    "role" => $row['role'],
                    "profile_image" => $row['profile_image']
                );
            }
        }
        return false;
    }

    public function register($username, $password, $role = 'cashier', $full_name = null, $profile_image = null) {
        $check = "SELECT id FROM " . $this->table_name . " WHERE username = :username LIMIT 0,1";
        $stmt = $this->conn->prepare($check);
        $stmt->bindParam(":username", $username);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return array("error" => "Username already exists!");
        }

        $query = "INSERT INTO " . $this->table_name . " (username, password, role, full_name, profile_image) VALUES (:username, :password, :role, :full_name, :profile_image)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $username);
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":full_name", $full_name);
        $stmt->bindParam(":profile_image", $profile_image);

        if($stmt->execute()) {
            return array(
                "id" => $this->conn->lastInsertId(),
                "username" => $username,
                "full_name" => $full_name,
                "role" => $role,
                "profile_image" => $profile_image
            );
        }
        return array("error" => "Registration failed!");
    }
}
?>
