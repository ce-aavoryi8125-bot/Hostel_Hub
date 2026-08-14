<?php
/**
 * HOSTEL HUB — Room Booking Form & Action Handler
 */
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

require_student_login();
$student = get_logged_in_student();
$db = getDB();

$hostelId = isset($_REQUEST['hostel_id']) ? (int)$_REQUEST['hostel_id'] : 0;
$roomType = isset($_REQUEST['type']) ? trim($_REQUEST['type']) : '2-in-a-room';
$price    = isset($_REQUEST['price']) ? (float)$_REQUEST['price'] : 0;

if ($hostelId <= 0) {
    set_flash('error', 'Please select a valid hostel to book.');
    header('Location: ' . BASE_URL . 'hostels.php');
    exit;
}

$stmt = $db->prepare("SELECT * FROM hostels WHERE id = :id AND is_published = 1");
$stmt->execute([':id' => $hostelId]);
$hostel = $stmt->fetch();

if (!$hostel) {
    set_flash('error', 'Requested hostel is unavailable.');
    header('Location: ' . BASE_URL . 'hostels.php');
    exit;
}

// Fallback price from hostel if not specified
if ($price <= 0) {
    $price = (float)$hostel['price_per_year'];
}

$error = '';

// Handle Booking Form Submission (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm_booking'])) {
    $selectedRoomType = trim($_POST['room_type'] ?? $roomType);
    $checkInPeriod    = trim($_POST['check_in_period'] ?? '2026/2027 Academic Year');
    $paymentMethod    = trim($_POST['payment_method'] ?? 'MTN Mobile Money');

    $bookingRef = generate_booking_ref();

    $ins = $db->prepare("INSERT INTO bookings (booking_reference, student_id, hostel_id, room_type, amount, status, payment_status, payment_method, check_in_period, created_at) VALUES (:ref, :sid, :hid, :rtype, :amt, 'pending', 'unpaid', :pmethod, :period, NOW())");
    $ok = $ins->execute([
        ':ref'    => $bookingRef,
        ':sid'    => $student['id'],
        ':hid'    => $hostel['id'],
        ':rtype'  => $selectedRoomType,
        ':amt'    => $price,
        ':pmethod'=> $paymentMethod,
        ':period' => $checkInPeriod
    ]);

    if ($ok) {
        $bookingId = $db->lastInsertId();

        // Create notification
        add_notification(
            $student['id'],
            'Room Booking Initiated',
            "Your booking reference {$bookingRef} for " . $hostel['name'] . " (" . $selectedRoomType . ") has been initiated. Please upload your payment proof to complete verification.",
            'info'
        );

        set_flash('success', 'Booking reserved! Please upload your payment proof below.');
        header('Location: ' . BASE_URL . 'payment.php?booking_id=' . $bookingId);
        exit;
    } else {
        $error = 'Failed to process booking. Please try again.';
    }
}

$page_title = 'Reserve Room at ' . $hostel['name'];
?>

<div style="background: #0F172A; color: #FFFFFF; padding: 32px 0;">
  <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 24px;">
    <h1 style="font-size: 28px; font-weight: 900;">Reserve Your Student Room</h1>
    <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;"><?= sanitize($hostel['name']) ?> • UMaT Tarkwa</p>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC; min-height: 75vh;">
  <div class="container" style="max-width: 900px; margin: 0 auto; padding: 0 24px;">
    
    <?php if (!empty($error)): ?>
      <div style="background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; padding: 14px; border-radius: 12px; margin-bottom: 24px;">
        ❌ <?= sanitize($error) ?>
      </div>
    <?php endif; ?>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start;" class="booking-layout-grid">
      
      <!-- LEFT: BOOKING DETAILS FORM -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(15,23,42,0.05);">
        <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 20px;">Confirm Student Booking</h2>

        <form action="<?= BASE_URL ?>book.php" method="POST">
          <input type="hidden" name="hostel_id" value="<?= $hostel['id'] ?>">
          <input type="hidden" name="confirm_booking" value="1">

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px;">Student Full Name</label>
            <input type="text" value="<?= sanitize($student['name']) ?>" readonly style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 10px; background: #F8FAFC; color: #0F172A; font-weight: 700;">
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px;">Student Index Number</label>
            <input type="text" value="<?= sanitize($student['student_index'] ?: 'UMaT Student') ?>" readonly style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 10px; background: #F8FAFC; color: #0F172A; font-weight: 600;">
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px;">Selected Room Type</label>
            <input type="text" name="room_type" value="<?= sanitize($roomType) ?>" readonly style="width: 100%; padding: 12px; border: 1px solid #E2E8F0; border-radius: 10px; background: #F8FAFC; color: #0F172A; font-weight: 700; text-transform: capitalize;">
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px;">Check-In Period</label>
            <select name="check_in_period" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-weight: 600;">
              <option value="2026/2027 Academic Year">2026/2027 Academic Year (Full Year)</option>
              <option value="First Semester Only">First Semester Only</option>
            </select>
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px;">Payment Method</label>
            <select name="payment_method" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-weight: 600;">
              <option value="MTN Mobile Money">MTN Mobile Money (MoMo)</option>
              <option value="Telecel Cash">Telecel Cash</option>
              <option value="Bank Direct Deposit">Bank Direct Deposit / Transfer</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 15px; font-weight: 700; border-radius: 12px;">
            Confirm Reservation & Proceed →
          </button>
        </form>

      </div>

      <!-- RIGHT: SUMMARY CARD -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(15,23,42,0.05);">
        <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9;">
          Reservation Summary
        </h3>

        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 14px; color: #475569; margin-bottom: 24px;">
          <div>
            <span style="font-size: 12px; color: #94A3B8; font-weight: 700; display: block;">HOSTEL</span>
            <strong style="font-size: 16px; color: #0F172A;"><?= sanitize($hostel['name']) ?></strong>
          </div>

          <div>
            <span style="font-size: 12px; color: #94A3B8; font-weight: 700; display: block;">LOCATION</span>
            <strong style="color: #0F172A;"><?= sanitize($hostel['location_name']) ?></strong>
          </div>

          <div>
            <span style="font-size: 12px; color: #94A3B8; font-weight: 700; display: block;">ROOM TYPE</span>
            <strong style="color: #0F172A; text-transform: capitalize;"><?= sanitize($roomType) ?></strong>
          </div>

          <div style="padding-top: 14px; border-top: 1px dashed #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; font-weight: 700; color: #0F172A;">Total Annual Fee:</span>
            <span style="font-size: 22px; font-weight: 900; color: #0F766E;"><?= format_currency($price) ?></span>
          </div>
        </div>

        <div style="background: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 12px; padding: 14px; font-size: 13px; color: #0F766E; line-height: 1.5;">
          <strong>🛡️ Zero Middleman Guarantee:</strong> No registration fees or hidden agent charges. After confirming, you will receive your official printable receipt.
        </div>
      </div>

    </div>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
