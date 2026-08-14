<?php
/**
 * HOSTEL HUB — Shared Footer Component
 */
require_once __DIR__ . '/../config/config.php';
?>
<footer class="app-footer">
  <div class="footer-inner">
    <!-- Column 1: Brand & Tagline -->
    <div class="footer-col brand-col">
      <a href="<?= BASE_URL ?>index.php" class="brand">
        <div class="brand-icon">🏠</div>
        <div class="brand-text">
          <span class="brand-title">Hostel<span class="brand-accent">Hub</span></span>
          <span class="brand-subtitle">UMaT Tarkwa</span>
        </div>
      </a>
      <p class="footer-desc">
        Official student hostel discovery and room reservation platform for University of Mines and Technology (UMaT), Tarkwa, Ghana.
      </p>
    </div>

    <!-- Column 2: Quick Links -->
    <div class="footer-col">
      <h4 class="footer-heading">Quick Links</h4>
      <ul class="footer-links">
        <li><a href="<?= BASE_URL ?>index.php">Home Discovery</a></li>
        <li><a href="<?= BASE_URL ?>hostels.php">Browse All Hostels</a></li>
        <li><a href="<?= BASE_URL ?>bookings.php">My Bookings</a></li>
      </ul>
    </div>

    <!-- Column 3: Student Support & Media Licensing -->
    <div class="footer-col">
      <h4 class="footer-heading">Student Support & Media</h4>
      <ul class="footer-links">
        <li><a href="<?= BASE_URL ?>login.php">Student Sign In</a></li>
        <li><a href="<?= BASE_URL ?>register.php">Create Account</a></li>
        <li><a href="mailto:support@hostelhub.dev">support@hostelhub.dev</a></li>
        <li><span style="font-size: 11px; color: #64748B; display: inline-block; margin-top: 4px;">Representative Imagery: CC BY-SA 4.0 / Open Access</span></li>
      </ul>
    </div>
  </div>

  <div class="footer-bottom">
    <div class="footer-bottom-inner">
      <p>© <?= date('Y') ?> HostelHub UMaT Tarkwa. All rights reserved.</p>
      <p class="footer-tagline">100% Physically Verified Student Hostels • Zero Agent Fees</p>
    </div>
  </div>
</footer>
