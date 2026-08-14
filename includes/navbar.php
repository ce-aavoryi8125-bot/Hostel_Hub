<?php
/**
 * HOSTEL HUB — Navigation Bar Component (Student Only)
 */
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/functions.php';

$student = get_logged_in_student();
$unread = $student ? get_unread_notifications_count($student['id']) : 0;
$activePage = $active_page ?? 'home';
?>
<header class="app-header">
  <div class="header-inner">
    <!-- Brand Logo -->
    <a href="<?= BASE_URL ?>index.php" class="brand">
      <div class="brand-icon">🏠</div>
      <div class="brand-text">
        <span class="brand-title">Hostel<span class="brand-accent">Hub</span></span>
        <span class="brand-subtitle">UMaT Tarkwa</span>
      </div>
    </a>

    <!-- Navigation Links -->
    <nav class="nav-links">
      <a href="<?= BASE_URL ?>index.php" class="nav-link <?= $activePage === 'home' ? 'active' : '' ?>">Home</a>
      <a href="<?= BASE_URL ?>hostels.php" class="nav-link <?= $activePage === 'hostels' ? 'active' : '' ?>">Browse Hostels</a>
      <?php if ($student): ?>
        <a href="<?= BASE_URL ?>bookings.php" class="nav-link <?= $activePage === 'bookings' ? 'active' : '' ?>">My Bookings</a>
        <a href="<?= BASE_URL ?>notifications.php" class="nav-link <?= $activePage === 'notifications' ? 'active' : '' ?>">
          Notifications
          <?php if ($unread > 0): ?>
            <span class="nav-badge"><?= $unread ?></span>
          <?php endif; ?>
        </a>
      <?php endif; ?>
    </nav>

    <!-- User Action Controls -->
    <div class="header-actions">
      <?php if ($student): ?>
        <div class="user-menu">
          <a href="<?= BASE_URL ?>profile.php" class="user-pill" title="View Profile">
            <span class="user-avatar">🎓</span>
            <span class="user-name"><?= sanitize($student['name']) ?></span>
          </a>
          <a href="<?= BASE_URL ?>logout.php" class="btn btn-outline btn-sm">Sign Out</a>
        </div>
      <?php else: ?>
        <a href="<?= BASE_URL ?>login.php" class="btn btn-ghost">Sign In</a>
        <a href="<?= BASE_URL ?>register.php" class="btn btn-primary">Create Account</a>
      <?php endif; ?>
    </div>
  </div>
</header>
