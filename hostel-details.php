<?php
/**
 * HOSTEL HUB — Single Hostel Detail & Room Selection
 */
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

$db = getDB();
$hostelId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($hostelId <= 0) {
    set_flash('error', 'Invalid hostel requested.');
    header('Location: ' . BASE_URL . 'hostels.php');
    exit;
}

$stmt = $db->prepare("SELECT h.*, l.name as loc_name FROM hostels h LEFT JOIN locations l ON h.location_id = l.id WHERE h.id = :id AND h.is_published = 1");
$stmt->execute([':id' => $hostelId]);
$hostel = $stmt->fetch();

if (!$hostel) {
    set_flash('error', 'Hostel not found.');
    header('Location: ' . BASE_URL . 'hostels.php');
    exit;
}

// Fetch room options for this hostel
$roomsStmt = $db->prepare("SELECT * FROM rooms WHERE hostel_id = :hid ORDER BY price_per_year ASC");
$roomsStmt->execute([':hid' => $hostelId]);
$rooms = $roomsStmt->fetchAll();

$page_title = $hostel['name'];
$photos = array_filter(array_map('trim', explode(',', $hostel['photos'])));
$mainPhoto = !empty($photos) ? $photos[0] : 'assets/images/hostels/hostel-1a.jpg';
if (strpos($mainPhoto, 'http') !== 0) { $mainPhoto = BASE_URL . ltrim($mainPhoto, '/'); }
$facilities = array_filter(array_map('trim', explode(',', $hostel['facilities'])));
?>

<div style="background: #0F172A; color: #FFFFFF; padding: 24px 0 16px;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <div style="display: flex; gap: 8px; font-size: 13px; color: #94A3B8; margin-bottom: 12px;">
      <a href="<?= BASE_URL ?>index.php" style="color: #94A3B8; text-decoration: none;">Home</a> /
      <a href="<?= BASE_URL ?>hostels.php" style="color: #94A3B8; text-decoration: none;">Hostels</a> /
      <span style="color: #2DD4BF;"><?= sanitize($hostel['name']) ?></span>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 8px;"><?= sanitize($hostel['name']) ?></h1>
        <p style="color: #CBD5E1; font-size: 15px; display: flex; align-items: center; gap: 6px;">
          <span>📍 <?= sanitize($hostel['address']) ?> (<?= sanitize($hostel['location_name']) ?>)</span>
          <span style="color: #2DD4BF; font-weight: 700;">• <?= sanitize($hostel['distance_km']) ?> km to UMaT</span>
        </p>
      </div>

      <div style="background: rgba(15,118,110,0.2); border: 1px solid rgba(15,118,110,0.4); padding: 8px 16px; border-radius: 12px; text-align: right;">
        <span style="font-size: 11px; color: #2DD4BF; font-weight: 800; text-transform: uppercase; display: block;">VERIFIED ACCOMMODATION</span>
        <span style="font-size: 18px; font-weight: 900; color: #FFFFFF;"><?= format_currency($hostel['price_per_year']) ?></span>
        <span style="font-size: 12px; color: #CBD5E1;">/year</span>
      </div>
    </div>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px; align-items: start;" class="details-layout-grid">
      
      <!-- LEFT COLUMN: PHOTOS & DESCRIPTION & ROOMS -->
      <div>
        <!-- Photo Gallery Header -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 16px; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.05);">
          <div style="height: 380px; border-radius: 12px; overflow: hidden; background: #CBD5E1; margin-bottom: 12px;">
            <img src="<?= sanitize($mainPhoto) ?>" id="activeGalleryImage" alt="<?= sanitize($hostel['name']) ?>" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80';">
          </div>
          
          <?php if (count($photos) > 1): ?>
            <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px;">
              <?php foreach ($photos as $p): 
                $pUrl = (strpos($p, 'http') === 0) ? $p : BASE_URL . ltrim($p, '/');
              ?>
                <img src="<?= sanitize($pUrl) ?>" onclick="document.getElementById('activeGalleryImage').src=this.src" style="width: 80px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid #E2E8F0; transition: border-color 0.2s;" onmouseover="this.style.borderColor='#0F766E'" onmouseout="this.style.borderColor='#E2E8F0'">
              <?php endforeach; ?>
            </div>
          <?php endif; ?>
        </div>

        <!-- Description Block -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 28px; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.05);">
          <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 12px;">About <?= sanitize($hostel['name']) ?></h2>
          <p style="font-size: 15px; color: #475569; line-height: 1.7; white-space: pre-line;"><?= sanitize($hostel['description']) ?></p>

          <h3 style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 24px 0 12px;">Hostel Facilities & Amenities</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <?php foreach ($facilities as $fac): ?>
              <span style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700;">
                ✓ <?= sanitize($fac) ?>
              </span>
            <?php endforeach; ?>
          </div>
        </div>

        <!-- ROOM OPTIONS & BOOKING SECTION -->
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(15,23,42,0.05);">
          <h2 style="font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 6px;">Available Room Options</h2>
          <p style="font-size: 14px; color: #64748B; margin-bottom: 24px;">Select your preferred room type to reserve your place for the 2026/2027 academic year.</p>

          <?php if (empty($rooms)): ?>
            <!-- Fallback standard room types if empty in table -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #E2E8F0; border-radius: 12px; background: #F8FAFC;">
                <div>
                  <h4 style="font-size: 16px; font-weight: 800; color: #0F172A;">2-in-a-Room Standard Room</h4>
                  <span style="font-size: 13px; color: #64748B;">Capacity: 2 Students • Available: 6 Rooms</span>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 18px; font-weight: 900; color: #0F766E;"><?= format_currency($hostel['price_per_year']) ?></div>
                  <a href="<?= BASE_URL ?>book.php?hostel_id=<?= $hostel['id'] ?>&type=2-in-a-room&price=<?= $hostel['price_per_year'] ?>" class="btn btn-primary btn-sm" style="margin-top: 6px;">Book Room</a>
                </div>
              </div>
            </div>
          <?php else: ?>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <?php foreach ($rooms as $room): ?>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px; border: 1px solid #E2E8F0; border-radius: 12px; background: #F8FAFC; flex-wrap: wrap; gap: 12px;">
                  <div>
                    <h4 style="font-size: 17px; font-weight: 800; color: #0F172A; text-transform: capitalize;"><?= sanitize($room['room_type']) ?></h4>
                    <div style="display: flex; gap: 12px; font-size: 13px; color: #64748B; margin-top: 4px;">
                      <span>👥 Max Capacity: <?= $room['capacity'] ?></span>
                      <span>🟢 Available: <?= $room['available_count'] ?> rooms</span>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="text-align: right;">
                      <span style="font-size: 20px; font-weight: 900; color: #0F766E; display: block;"><?= format_currency($room['price_per_year']) ?></span>
                      <span style="font-size: 11px; color: #94A3B8; font-weight: 700;">PER ACADEMIC YEAR</span>
                    </div>
                    
                    <a href="<?= BASE_URL ?>book.php?hostel_id=<?= $hostel['id'] ?>&room_id=<?= $room['id'] ?>&type=<?= urlencode($room['room_type']) ?>&price=<?= $room['price_per_year'] ?>" class="btn btn-primary" style="padding: 10px 20px; font-size: 14px; font-weight: 700; border-radius: 10px;">
                      Book Room
                    </a>
                  </div>
                </div>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>

        </div>
      </div>

      <!-- RIGHT COLUMN: SUMMARY & QUICK ACTIONS -->
      <div>
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(15,23,42,0.05); position: sticky; top: 90px;">
          <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #F1F5F9;">
            Booking Summary
          </h3>

          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; color: #475569; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Institution:</span>
              <strong style="color: #0F172A;">UMaT Tarkwa</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Distance:</span>
              <strong style="color: #0F172A;"><?= sanitize($hostel['distance_km']) ?> km</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Verification:</span>
              <strong style="color: #059669;">100% Physically Verified</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Agent Fee:</span>
              <strong style="color: #059669;">GH₵ 0.00 (Zero Fee)</strong>
            </div>
          </div>

          <div style="background: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 12px; padding: 14px; font-size: 13px; color: #0F766E; margin-bottom: 20px; line-height: 1.5;">
            <strong>💡 How to Book:</strong> Click "Book Room", review your student details, submit payment proof, and view your official receipt immediately.
          </div>

          <a href="<?= BASE_URL ?>book.php?hostel_id=<?= $hostel['id'] ?>&type=2-in-a-room&price=<?= $hostel['price_per_year'] ?>" class="btn btn-primary" style="width: 100%; padding: 14px; text-align: center; font-size: 15px; font-weight: 700; border-radius: 12px;">
            Reserve Room Now
          </a>
        </div>
      </div>

    </div>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
