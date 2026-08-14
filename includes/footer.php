<?php
/**
 * HOSTEL HUB — Footer Component
 */
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/auth.php';

$flashes = get_flashes();
?>
  <!-- Flash Alert Messages Banner -->
  <?php if (!empty($flashes)): ?>
    <div class="flash-container">
      <?php foreach ($flashes as $type => $msg): ?>
        <div class="flash-toast flash-<?= sanitize($type) ?> animate-fadeIn">
          <span class="flash-icon"><?= $type === 'success' ? '✅' : ($type === 'error' ? '❌' : 'ℹ️') ?></span>
          <span class="flash-msg"><?= sanitize($msg) ?></span>
          <button class="flash-close" onclick="this.parentElement.remove()">×</button>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <footer class="app-footer">
    <div class="footer-inner container">
      <div class="footer-col brand-col">
        <div class="brand">
          <div class="brand-icon">🏠</div>
          <div class="brand-text">
            <span class="brand-title">Hostel<span class="brand-accent">Hub</span></span>
            <span class="brand-subtitle">UMaT Tarkwa</span>
          </div>
        </div>
        <p class="footer-desc">
          Official student accommodation and hostel booking platform for University of Mines and Technology students in Tarkwa, Ghana.
        </p>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Quick Links</h4>
        <ul class="footer-links">
          <li><a href="<?= BASE_URL ?>index.php">Home Discovery</a></li>
          <li><a href="<?= BASE_URL ?>hostels.php">Browse All Hostels</a></li>
          <li><a href="<?= BASE_URL ?>bookings.php">My Bookings</a></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Student Support</h4>
        <ul class="footer-links">
          <li><a href="<?= BASE_URL ?>login.php">Student Sign In</a></li>
          <li><a href="<?= BASE_URL ?>register.php">Create Account</a></li>
          <li><a href="mailto:support@hostelhub.dev">support@hostelhub.dev</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>© <?= date('Y') ?> Hostel Hub UMaT Tarkwa. All rights reserved.</p>
        <p class="footer-tagline">100% Physically Verified Student Hostels</p>
      </div>
    </div>
  </footer>

  <script src="<?= BASE_URL ?>assets/js/app.js"></script>
</body>
</html>
