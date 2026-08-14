<?php
/**
 * HOSTEL HUB — Payment Proof Upload Page
 */
$page_title = 'Upload Payment Proof';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

require_student_login();
$student = get_logged_in_student();
$db = getDB();

$bookingId = isset($_REQUEST['booking_id']) ? (int)$_REQUEST['booking_id'] : 0;

if ($bookingId <= 0) {
    set_flash('error', 'Please select a valid booking to upload payment proof.');
    header('Location: ' . BASE_URL . 'bookings.php');
    exit;
}

$stmt = $db->prepare("SELECT b.*, h.name as hostel_name FROM bookings b JOIN hostels h ON b.hostel_id = h.id WHERE b.id = :id AND b.student_id = :sid");
$stmt->execute([':id' => $bookingId, ':sid' => $student['id']]);
$booking = $stmt->fetch();

if (!$booking) {
    set_flash('error', 'Booking record not found.');
    header('Location: ' . BASE_URL . 'bookings.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $paymentMethod  = trim($_POST['payment_method'] ?? 'MTN Mobile Money');
    $transactionRef = trim($_POST['transaction_ref'] ?? '');

    // Handle File Upload
    $fileName = '';
    if (isset($_FILES['proof_file']) && $_FILES['proof_file']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['proof_file']['tmp_name'];
        $originalName = $_FILES['proof_file']['name'];
        $fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        $allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
        if (!in_array($fileExtension, $allowedExtensions)) {
            $error = 'Invalid file type. Only JPG, PNG, and PDF files are allowed.';
        } else {
            $newFileName = 'proof_' . $booking['id'] . '_' . time() . '.' . $fileExtension;
            if (!is_dir(PAYMENT_PROOF_DIR)) {
                mkdir(PAYMENT_PROOF_DIR, 0755, true);
            }
            $destPath = PAYMENT_PROOF_DIR . $newFileName;
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                $fileName = $newFileName;
            } else {
                $error = 'Failed to save uploaded file. Please try again.';
            }
        }
    }

    if (empty($error)) {
        if (empty($fileName)) {
            $fileName = $booking['payment_proof'] ?: 'sample_proof.png';
        }

        // Update Booking
        $upd = $db->prepare("UPDATE bookings SET payment_status = 'pending_verification', payment_method = :pm, payment_proof = :pf, transaction_ref = :tref WHERE id = :id");
        $upd->execute([
            ':pm'   => $paymentMethod,
            ':pf'   => $fileName,
            ':tref' => $transactionRef,
            ':id'   => $booking['id']
        ]);

        // Insert Payment Record
        $payRef = generate_payment_ref();
        $insP = $db->prepare("INSERT INTO payments (payment_reference, booking_id, student_id, amount, payment_method, proof_file, status, created_at) VALUES (:pref, :bid, :sid, :amt, :pm, :pf, 'pending', NOW())");
        $insP->execute([
            ':pref' => $payRef,
            ':bid'  => $booking['id'],
            ':sid'  => $student['id'],
            ':amt'  => $booking['amount'],
            ':pm'   => $paymentMethod,
            ':pf'   => $fileName
        ]);

        // Create Notification
        add_notification(
            $student['id'],
            'Payment Proof Uploaded',
            "Payment proof for booking {$booking['booking_reference']} ({$booking['hostel_name']}) was submitted successfully. Verification status is now Pending.",
            'info'
        );

        set_flash('success', 'Payment proof submitted successfully! Status: Pending Verification.');
        header('Location: ' . BASE_URL . 'bookings.php');
        exit;
    }
}
?>

<div style="background: #0F172A; color: #FFFFFF; padding: 32px 0;">
  <div class="container" style="max-width: 680px; margin: 0 auto; padding: 0 24px;">
    <h1 style="font-size: 26px; font-weight: 900;">Upload Payment Proof</h1>
    <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">Booking Reference: <?= sanitize($booking['booking_reference']) ?></p>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC; min-height: 75vh;">
  <div class="container" style="max-width: 680px; margin: 0 auto; padding: 0 24px;">
    
    <?php if (!empty($error)): ?>
      <div style="background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
        ❌ <?= sanitize($error) ?>
      </div>
    <?php endif; ?>

    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.05);">
      
      <!-- Booking Summary Box -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #64748B;">Hostel:</span>
          <strong style="font-size: 15px; color: #0F172A;"><?= sanitize($booking['hostel_name']) ?></strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 13px; color: #64748B;">Room Type:</span>
          <strong style="font-size: 14px; color: #0F172A; text-transform: capitalize;"><?= sanitize($booking['room_type']) ?></strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px dashed #CBD5E1;">
          <span style="font-size: 14px; font-weight: 700; color: #0F172A;">Amount Payable:</span>
          <strong style="font-size: 18px; font-weight: 900; color: #0F766E;"><?= format_currency($booking['amount']) ?></strong>
        </div>
      </div>

      <!-- Payment Instructions -->
      <div style="background: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #0F766E; line-height: 1.6;">
        <strong style="display: block; font-size: 14px; margin-bottom: 6px;">📱 Payment Transfer Instructions:</strong>
        Send mobile money or bank transfer of <strong><?= format_currency($booking['amount']) ?></strong> to:
        <ul style="margin: 6px 0 0 18px;">
          <li><strong>MTN MoMo:</strong> 059 245 1533 (Name: Hostel Hub UMaT)</li>
          <li><strong>GCB Bank:</strong> Account 1029384756 (Hostel Hub Ventures)</li>
        </ul>
      </div>

      <form action="<?= BASE_URL ?>payment.php" method="POST" enctype="multipart/form-data">
        <input type="hidden" name="booking_id" value="<?= $booking['id'] ?>">

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Payment Method Used *</label>
          <select name="payment_method" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; font-weight: 600;">
            <option value="MTN Mobile Money">MTN Mobile Money</option>
            <option value="Telecel Cash">Telecel Cash</option>
            <option value="Bank Direct Deposit">Bank Direct Deposit / Transfer</option>
          </select>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Transaction / Reference ID (Optional)</label>
          <input type="text" name="transaction_ref" placeholder="e.g. MM-89320194" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
        </div>

        <div style="margin-bottom: 24px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Upload Payment Screenshot / Receipt (PNG, JPG, PDF)</label>
          <input type="file" name="proof_file" accept=".jpg,.jpeg,.png,.pdf" style="width: 100%; padding: 10px; border: 1px dashed #CBD5E1; border-radius: 10px; background: #F8FAFC; cursor: pointer;">
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 15px; font-weight: 700; border-radius: 10px;">
          Submit Payment Proof →
        </button>
      </form>

    </div>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
