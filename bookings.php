<?php
/**
 * HOSTEL HUB — Student My Bookings & History Page
 */
$page_title = 'My Hostel Bookings';
$active_page = 'bookings';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

require_student_login();
$student = get_logged_in_student();
$db = getDB();

// Fetch student's bookings
$stmt = $db->prepare("SELECT b.*, h.name as hostel_name, h.location_name, h.photos FROM bookings b JOIN hostels h ON b.hostel_id = h.id WHERE b.student_id = :sid ORDER BY b.id DESC");
$stmt->execute([':sid' => $student['id']]);
$bookings = $stmt->fetchAll();
?>

<div style="background: #0F172A; color: #FFFFFF; padding: 36px 0;">
  <div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0 24px;">
    <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.02em;">My Hostel Bookings & Receipts</h1>
    <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">Manage your accommodation reservations and printable payment receipts.</p>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC; min-height: 75vh;">
  <div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0 24px;">
    
    <?php if (empty($bookings)): ?>
      <div style="text-align: center; padding: 64px 20px; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 16px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🏠</div>
        <h3 style="font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">No Active Room Bookings Found</h3>
        <p style="color: #64748B; font-size: 14px; margin-bottom: 24px;">You haven't reserved any hostel room yet for the upcoming academic year.</p>
        <a href="<?= BASE_URL ?>hostels.php" class="btn btn-primary">Browse Available Hostels →</a>
      </div>
    <?php else: ?>
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <?php foreach ($bookings as $b): 
          $photos = array_filter(explode(',', $b['photos']));
          $coverPhoto = !empty($photos) ? trim($photos[0]) : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80';
          
          $statusBg = $b['status'] === 'confirmed' ? '#ECFDF5' : ($b['status'] === 'pending' ? '#FEF3C7' : '#FEF2F2');
          $statusColor = $b['status'] === 'confirmed' ? '#047857' : ($b['status'] === 'pending' ? '#B45309' : '#B91C1C');

          $payBg = $b['payment_status'] === 'paid' ? '#ECFDF5' : ($b['payment_status'] === 'pending_verification' ? '#EFF6FF' : '#FEF2F2');
          $payColor = $b['payment_status'] === 'paid' ? '#047857' : ($b['payment_status'] === 'pending_verification' ? '#1D4ED8' : '#B91C1C');
        ?>
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
            
            <div style="display: flex; gap: 16px; align-items: center; flex: 1 1 320px;">
              <img src="<?= sanitize($coverPhoto) ?>" alt="Hostel" style="width: 90px; height: 90px; object-fit: cover; border-radius: 12px; border: 1px solid #E2E8F0;">
              
              <div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 12px; font-weight: 800; font-family: monospace; background: #F1F5F9; color: #0F172A; padding: 3px 8px; border-radius: 6px;">
                    <?= sanitize($b['booking_reference']) ?>
                  </span>
                  <span style="font-size: 11px; font-weight: 800; background: <?= $statusBg ?>; color: <?= $statusColor ?>; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase;">
                    <?= sanitize($b['status']) ?>
                  </span>
                </div>

                <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">
                  <?= sanitize($b['hostel_name']) ?>
                </h3>
                
                <p style="font-size: 13px; color: #64748B;">
                  📍 <?= sanitize($b['location_name']) ?> • <strong style="color: #0F172A; text-transform: capitalize;"><?= sanitize($b['room_type']) ?></strong>
                </p>
                
                <span style="font-size: 12px; color: #94A3B8; display: block; margin-top: 4px;">
                  Booked on <?= date('d M Y, h:i A', strtotime($b['created_at'])) ?>
                </span>
              </div>
            </div>

            <!-- PAYMENT STATUS & ACTION BUTTONS -->
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 12px; flex: 0 0 auto;">
              <div style="text-align: right;">
                <span style="font-size: 20px; font-weight: 900; color: #0F766E; display: block;"><?= format_currency($b['amount']) ?></span>
                <span style="font-size: 11px; font-weight: 800; background: <?= $payBg ?>; color: <?= $payColor ?>; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
                  Payment: <?= str_replace('_', ' ', sanitize($b['payment_status'])) ?>
                </span>
              </div>

              <div style="display: flex; gap: 8px;">
                <?php if ($b['payment_status'] === 'unpaid' || $b['payment_status'] === 'pending_verification'): ?>
                  <a href="<?= BASE_URL ?>payment.php?booking_id=<?= $b['id'] ?>" class="btn btn-primary btn-sm" style="padding: 8px 14px; font-size: 13px; font-weight: 700; border-radius: 8px;">
                    <?= $b['payment_status'] === 'pending_verification' ? 'Re-upload Proof' : 'Upload Payment Proof' ?>
                  </a>
                <?php endif; ?>

                <a href="<?= BASE_URL ?>booking-details.php?id=<?= $b['id'] ?>" class="btn btn-outline btn-sm" style="padding: 8px 14px; font-size: 13px; font-weight: 700; border-radius: 8px;">
                  📄 Print Receipt
                </a>
              </div>
            </div>

          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
