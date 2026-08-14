<?php
/**
 * HOSTEL HUB — Logout Handler
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/auth.php';

$_SESSION = array();
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

session_start();
set_flash('info', 'You have been signed out.');
header('Location: ' . BASE_URL . 'login.php');
exit;
