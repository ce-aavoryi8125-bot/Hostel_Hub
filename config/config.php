<?php
/**
 * HOSTEL HUB — Application Configuration
 * Shared PHP / MySQL Hosting Environment
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Environment Constants
define('APP_NAME', 'Hostel Hub UMaT');
define('INSTITUTION_NAME', 'University of Mines and Technology (UMaT)');
define('INSTITUTION_SHORT', 'UMaT');
define('TARGET_CITY', 'Tarkwa, Ghana');

// Base URL calculation (supports subdirectory /hostelhub/ or root)
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$basePath  = rtrim($scriptDir, '/') . '/';
if ($basePath === '//') {
    $basePath = '/';
}
define('BASE_URL', $basePath);

// Upload Directories
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('PAYMENT_PROOF_DIR', __DIR__ . '/../uploads/payment-proofs/');
