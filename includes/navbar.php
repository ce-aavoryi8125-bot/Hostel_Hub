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
  <div class="header-inner container">
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
      <a href="<?= BASE_URL ?>index.php" class="nav-link <?= $activePage === 'home' ? 'active' : '' ?>">
        <span>Home</span>
      </a>
      <a href="<?= BASE_URL ?>hostels.php" class="nav-link <?= $activePage === 'hostels' ? 'active' : '' ?>">
        <span>Browse Hostels</span>
      </a>
      <?php if ($student): ?>
        <a href="<?= BASE_URL ?>bookings.php" class="nav-link <?= $activePage === 'bookings' ? 'active' : '' ?>">
          <span>My Bookings</span>
        </a>
        <a href="<?= BASE_URL ?>notifications.php" class="nav-link <?= $activePage === 'notifications' ? 'active' : '' ?>">
          <span>Notifications</span>
          <?php if ($unread > 0): ?>
            <span class="nav-badge"><?= $unread ?></span>
          <?php endif; ?>
        </a>
      <?php endif; ?>
    </nav>

    <!-- User Action Controls -->
    <div class="header-actions">
      <?php if (isset($_SESSION['landlord_id'])): ?>
        <a href="<?= BASE_URL ?>landlord/dashboard.php" class="btn btn-primary btn-sm">
          <span>🏢 Landlord Dashboard</span>
        </a>
        <a href="<?= BASE_URL ?>landlord/logout.php" class="btn btn-outline btn-sm">Sign Out</a>
      <?php elseif ($student): ?>
        <div class="user-menu">
          <a href="<?= BASE_URL ?>profile.php" class="user-pill" title="View Student Profile">
            <span class="user-avatar">🎓</span>
            <span class="user-name"><?= sanitize($student['name']) ?></span>
          </a>
          <a href="<?= BASE_URL ?>logout.php" class="btn btn-outline btn-sm btn-logout">Sign Out</a>
        </div>
      <?php else: ?>
        <a href="<?= BASE_URL ?>landlord/login.php" class="btn btn-ghost" style="color: var(--color-primary); font-weight: 600;">Landlords</a>
        <a href="<?= BASE_URL ?>login.php" class="btn btn-ghost">Sign In</a>
        <a href="<?= BASE_URL ?>register.php" class="btn btn-primary">Create Account</a>
      <?php endif; ?>
    </div>
  </div>
</header>
