<?php
// 💡 ត្រូវប្រាកដថាអក្សរតូចធំត្រូវគ្នាជាមួយ Folder និង File ជាក់ស្តែង
include_once __DIR__ . '/../config/database.php'; 
include_once __DIR__ . '/../Model/User.php'; // 💡 ប្រសិនបើក្នុង Folder ឈ្មោះ User.php (U ធំ)

class AuthController {
    private $db;
    private $user;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        // 💡 ហៅទៅកាន់ Class UserModel ដែលមាននៅក្នុងឯកសារ Model/User.php
        $this->user = new UserModel($this->db); 
    }

    public function authenticate($data) {
        if(!empty($data->username) && !empty($data->password)) {
            $auth = $this->user->login($data->username, $data->password);
            
            if($auth) {
                echo json_encode(array(
                    "message" => "Login successful.",
                    "user" => $auth
                ));
            } else {
                echo json_encode(array("error" => "Username ឬ Password មិនត្រឹមត្រូវឡើយ!"));
            }
        } else {
            echo json_encode(array("error" => "សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់។"));
        }
    }

    public function register($username, $password, $role = 'cashier', $full_name = null, $profile_image = null) {
        return $this->user->register($username, $password, $role, $full_name, $profile_image);
    }
}
?>