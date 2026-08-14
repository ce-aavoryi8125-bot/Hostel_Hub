<?php
/**
 * HOSTEL HUB — Shared Header Component
 */
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/functions.php';

$pageTitle = isset($page_title) ? $page_title . ' | ' . APP_NAME : APP_NAME . ' — Student Accommodation Tarkwa';
$unreadCount = is_logged_in() ? get_unread_notifications_count($_SESSION['student_id']) : 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= sanitize($pageTitle) ?></title>
  <meta name="description" content="Official student hostel discovery, booking, and room reservation platform for UMaT Tarkwa, Ghana. Zero agent fees.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/styles.css">
</head>
<body data-base-url="<?= BASE_URL ?>">
