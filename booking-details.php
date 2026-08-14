<?php
/**
 * HOSTEL HUB — Printable Student Booking & Payment Receipt
 */
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/functions.php';

require_student_login();
$student = get_logged_in_student();
$db = getDB();

$bookingId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($bookingId <= 0) {
    set_flash('error', 'Invalid booking receipt requested.');
    header('Location: ' . BASE_URL . 'bookings.php');
    exit;
}

$stmt = $db->prepare("SELECT b.*, h.name as hostel_name, h.location_name, h.address, h.distance_km FROM bookings b JOIN hostels h ON b.hostel_id = h.id WHERE b.id = :id AND b.student_id = :sid");
$stmt->execute([':id' => $bookingId, ':sid' => $student['id']]);
$b = $stmt->fetch();

if (!$b) {
    set_flash('error', 'Booking record not found.');
    header('Location: ' . BASE_URL . 'bookings.php');
    exit;
}

$page_title = 'Receipt — ' . $b['booking_reference'];
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';
?>

<style>
@media print {
  .app-header, .app-footer, .no-print, .flash-container {
    display: none !important;
  }
  body {
    background: #FFFFFF !important;
    color: #000000 !important;
  }
  .receipt-card {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
}
</style>

<div class="no-print" style="background: #0F172A; color: #FFFFFF; padding: 24px 0;">
  <div class="container" style="max-width: 800px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
    <div>
      <h1 style="font-size: 22px; font-weight: 900;">Official Student Booking Receipt</h1>
      <p style="color: #94A3B8; font-size: 13px;">Reference: <?= sanitize($b['booking_reference']) ?></p>
    </div>
    <div style="display: flex; gap: 10px;">
      <a href="<?= BASE_URL ?>bookings.php" class="btn btn-outline btn-sm" style="color: #FFF; border-color: rgba(255,255,255,0.3);">← Back to Bookings</a>
      <button id="printReceiptBtn" class="btn btn-primary btn-sm" style="padding: 8px 18px; font-weight: 700;">🖨️ Print Receipt</button>
    </div>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC; min-height: 80vh;">
  <div class="container" style="max-width: 800px; margin: 0 auto; padding: 0 24px;">
    
    <div class="receipt-card" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(15,23,42,0.06); position: relative;">
      
      <!-- RECEIPT HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #0F172A; margin-bottom: 28px; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <div style="width: 36px; height: 36px; background: #0F766E; border-radius: 8px; display: grid; place-items: center; font-size: 18px; color: #FFF;">🏠</div>
            <span style="font-size: 20px; font-weight: 900; color: #0F172A; letter-spacing: -0.02em;">Hostel<span style="color: #0F766E;">Hub</span> UMaT</span>
          </div>
          <p style="font-size: 12px; color: #64748B; font-weight: 700;">University of Mines and Technology • Tarkwa, Ghana</p>
          <p style="font-size: 12px; color: #64748B;">Official Verified Accommodation Receipt</p>
        </div>

        <div style="text-align: right;">
          <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; display: block;">RECEIPT NUMBER</span>
          <span style="font-size: 18px; font-weight: 900; font-family: monospace; color: #0F172A; display: block; margin-bottom: 4px;"><?= sanitize($b['booking_reference']) ?></span>
          <span style="font-size: 12px; color: #64748B;">Date Issued: <?= date('d F Y', strtotime($b['created_at'])) ?></span>
        </div>
      </div>

      <!-- STATUS WATERMARK SEAL -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; display: block;">BOOKING STATUS</span>
          <strong style="font-size: 16px; color: <?= $b['status'] === 'confirmed' ? '#047857' : '#B45309' ?>; text-transform: uppercase;">
            <?= $b['status'] === 'confirmed' ? '✓ CONFIRMED RESERVATION' : '⏳ PENDING VERIFICATION' ?>
          </strong>
        </div>

        <div style="text-align: right;">
          <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; display: block;">PAYMENT STATUS</span>
          <strong style="font-size: 16px; color: <?= $b['payment_status'] === 'paid' ? '#047857' : '#1D4ED8' ?>; text-transform: uppercase;">
            <?= $b['payment_status'] === 'paid' ? '● FULLY PAID' : '⏳ UNDER REVIEW' ?>
          </strong>
        </div>
      </div>

      <!-- STUDENT DETAILS GRID -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #F1F5F9;">
        <div>
          <h4 style="font-size: 12px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em;">Student Details</h4>
          <p style="font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 4px;"><?= sanitize($student['name']) ?></p>
          <p style="font-size: 13px; color: #475569; margin-bottom: 2px;">Index: <strong><?= sanitize($student['student_index'] ?: 'UMaT Student') ?></strong></p>
          <p style="font-size: 13px; color: #475569; margin-bottom: 2px;">Email: <?= sanitize($student['email']) ?></p>
          <p style="font-size: 13px; color: #475569;">Phone: <?= sanitize($student['phone']) ?></p>
        </div>

        <div>
          <h4 style="font-size: 12px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.05em;">Academic Period</h4>
          <p style="font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 4px;"><?= sanitize($b['check_in_period']) ?></p>
          <p style="font-size: 13px; color: #475569; margin-bottom: 2px;">Institution: <strong>UMaT Tarkwa</strong></p>
          <p style="font-size: 13px; color: #475569; margin-bottom: 2px;">Department: <?= sanitize($student['department']) ?></p>
          <p style="font-size: 13px; color: #475569;">Level: <?= sanitize($student['level']) ?></p>
        </div>
      </div>

      <!-- ACCOMMODATION & PAYMENT BREAKDOWN TABLE -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
        <thead>
          <tr style="background: #0F172A; color: #FFFFFF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; text-align: left;">
            <th style="padding: 12px 16px; border-radius: 8px 0 0 8px;">Description</th>
            <th style="padding: 12px 16px;">Room Type</th>
            <th style="padding: 12px 16px;">Payment Method</th>
            <th style="padding: 12px 16px; text-align: right; border-radius: 0 8px 8px 0;">Amount (GH₵)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #E2E8F0; font-size: 14px; color: #0F172A;">
            <td style="padding: 16px;">
              <strong><?= sanitize($b['hostel_name']) ?></strong>
              <span style="display: block; font-size: 12px; color: #64748B; margin-top: 2px;"><?= sanitize($b['address']) ?> (<?= sanitize($b['location_name']) ?>)</span>
            </td>
            <td style="padding: 16px; text-transform: capitalize; font-weight: 600;"><?= sanitize($b['room_type']) ?></td>
            <td style="padding: 16px; color: #475569;"><?= sanitize($b['payment_method']) ?></td>
            <td style="padding: 16px; text-align: right; font-weight: 800; font-size: 16px; color: #0F766E;"><?= number_format($b['amount'], 2) ?></td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 16px; text-align: right; font-weight: 800; font-size: 15px; color: #0F172A;">Total Amount Paid / Reserved:</td>
            <td style="padding: 16px; text-align: right; font-weight: 900; font-size: 22px; color: #0F766E;"><?= format_currency($b['amount']) ?></td>
          </tr>
        </tfoot>
      </table>

      <!-- FOOTER STAMP / SIGNATURE -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; border-top: 1px dashed #CBD5E1; font-size: 12px; color: #64748B;">
        <div>
          <p style="font-weight: 700; color: #0F172A; margin-bottom: 4px;">Hostel Hub Verification System</p>
          <p>Zero Agent Fees • 100% Verified Accommodation</p>
        </div>

        <div style="text-align: right;">
          <div style="border-bottom: 1px solid #0F172A; width: 180px; margin-bottom: 4px;"></div>
          <p style="font-weight: 700; color: #0F172A;">Authorized Clearance Stamp</p>
        </div>
      </div>

    </div>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
