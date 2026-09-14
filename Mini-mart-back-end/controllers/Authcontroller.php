<?php
include_once __DIR__ . '/../config/database.php';
include_once __DIR__ . '/../config/jwt.php';
include_once __DIR__ . '/../Model/User.php';

class AuthController {
    private $db;
    private $user;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user = new UserModel($this->db);
    }

    public function authenticate($data) {
        if (!empty($data->username) && !empty($data->password)) {
            $auth = $this->user->login($data->username, $data->password);

            if ($auth) {
                $token = JWT::encode([
                    'user_id' => $auth['id'],
                    'username' => $auth['username'],
                    'role' => $auth['role']
                ]);

                echo json_encode(array(
                    "message" => "Login successful.",
                    "token" => $token,
                    "user" => $auth
                ));
            } else {
                http_response_code(401);
                echo json_encode(array("error" => "Invalid username or password."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("error" => "Please provide username and password."));
        }
    }

    public function register($username, $password, $role = 'cashier', $full_name = null, $profile_image = null) {
        return $this->user->register($username, $password, $role, $full_name, $profile_image);
    }
}
?>
