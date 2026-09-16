<?php

function apiResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function apiError($message, $statusCode = 400) {
    apiResponse(['error' => $message], $statusCode);
}

function apiSuccess($data = null, $message = null) {
    $response = [];
    if ($message) $response['message'] = $message;
    if ($data !== null) $response = array_merge($response, is_array($data) ? $data : ['data' => $data]);
    apiResponse($response);
}

function handleDbError($e) {
    $msg = $e->getMessage();
    error_log("Database error: " . $msg);

    if (strpos($msg, 'Unknown column') !== false) {
        apiError("Database schema outdated. Please run /setup.php to update.", 500);
    } elseif (strpos($msg, 'Table') !== false && strpos($msg, 'doesn\'t exist') !== false) {
        apiError("Database table missing. Please run /setup.php to initialize.", 500);
    } elseif (strpos($msg, 'MySQL server has gone away') !== false || strpos($msg, 'Connection') !== false) {
        apiError("Database connection lost", 500);
    } else {
        apiError("Database error occurred", 500);
    }
}

function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data->$field) || $data->$field === '' || $data->$field === null) {
            apiError("Field '$field' is required");
        }
    }
}

function sanitizeString($str) {
    if ($str === null) return null;
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

function validateEmail($email) {
    if ($email === null) return true;
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validatePositiveNumber($value, $fieldName = 'value') {
    if ($value === null || $value === '') return;
    if (!is_numeric($value) || floatval($value) < 0) {
        apiError("$fieldName must be a positive number");
    }
}
