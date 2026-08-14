<?php
/**
 * HOSTEL HUB — Authentication & Session Management (Student Only)
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

function is_logged_in() {
    return isset($_SESSION['student_id']) && !empty($_SESSION['student_id']);
}

function get_logged_in_student() {
    if (!is_logged_in()) {
        return null;
    }
    $db = getDB();
    $stmt = $db->prepare("SELECT id, name, email, phone, student_index, institution, faculty, department, level, created_at FROM students WHERE id = :id");
    $stmt->execute([':id' => $_SESSION['student_id']]);
    return $stmt->fetch() ?: null;
}

function require_student_login() {
    if (!is_logged_in()) {
        $_SESSION['flash_error'] = 'Please sign in to access your student portal.';
        header('Location: ' . BASE_URL . 'login.php');
        exit;
    }
}

function set_flash($type, $message) {
    $_SESSION['flash_' . $type] = $message;
}

function get_flashes() {
    $flashes = [];
    foreach (['success', 'error', 'info', 'warning'] as $t) {
        if (isset($_SESSION['flash_' . $t])) {
            $flashes[$t] = $_SESSION['flash_' . $t];
            unset($_SESSION['flash_' . $t]);
        }
    }
    return $flashes;
}
