<?php
/**
 * HOSTEL HUB — Browse & Filter All Hostels
 */
$page_title = 'Browse All Hostels';
$active_page = 'hostels';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

$db = getDB();

// Inputs
$searchQ    = trim($_GET['q'] ?? '');
$searchLoc  = trim($_GET['location'] ?? '');
$maxPrice   = !empty($_GET['price']) ? (float)$_GET['price'] : 20000;

// Query
$sql = "SELECT h.*, l.name as loc_name FROM hostels h LEFT JOIN locations l ON h.location_id = l.id WHERE h.is_published = 1";
$params = [];

if ($searchQ !== '') {
    $sql .= " AND (h.name LIKE :q OR h.description LIKE :q OR h.facilities LIKE :q OR h.location_name LIKE :q)";
    $params[':q'] = "%$searchQ%";
}

if ($searchLoc !== '') {
    $sql .= " AND (h.location_name LIKE :loc OR l.name LIKE :loc)";
    $params[':loc'] = "%$searchLoc%";
}

if ($maxPrice > 0) {
    $sql .= " AND h.price_per_year <= :maxp";
    $params[':maxp'] = $maxPrice;
}

$sql .= " ORDER BY h.id ASC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$hostels = $stmt->fetchAll();

// Fetch locations for filter
$locationsStmt = $db->query("SELECT id, name FROM locations ORDER BY name ASC");
$locations = $locationsStmt->fetchAll();
?>

<div style="background: #0F172A; color: #FFFFFF; padding: 40px 0;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -0.02em;">Browse Student Hostels</h1>
    <p style="color: #94A3B8; font-size: 15px; margin-top: 4px;">Explore 100% verified student accommodations around UMaT Tarkwa campus.</p>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC; min-height: 70vh;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    
    <!-- FILTER BAR -->
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; margin-bottom: 32px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
      <form action="<?= BASE_URL ?>hostels.php" method="GET" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end;">
        
        <!-- Search Input -->
        <div style="flex: 1 1 240px;">
          <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">Search Keyword</label>
          <input type="text" id="hostelSearchInput" name="q" value="<?= sanitize($searchQ) ?>" placeholder="Search name, facilities..." style="width: 100%; padding: 10px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none;">
        </div>

        <!-- Location Filter -->
        <div style="flex: 1 1 200px;">
          <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">Location</label>
          <select id="locationSelect" name="location" style="width: 100%; padding: 10px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; font-weight: 600; outline: none; background: #FFF;">
            <option value="">All Locations</option>
            <?php foreach ($locations as $loc): ?>
              <option value="<?= sanitize($loc['name']) ?>" <?= $searchLoc === $loc['name'] ? 'selected' : '' ?>>
                <?= sanitize($loc['name']) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>

        <!-- Price Filter -->
        <div style="flex: 1 1 200px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="font-size: 12px; font-weight: 700; color: #475569;">Max Annual Price</label>
            <span id="priceDisplay" style="font-size: 12px; font-weight: 800; color: #0F766E;">GH₵ <?= number_format($maxPrice) ?></span>
          </div>
          <input type="range" id="priceRange" name="price" min="2000" max="12000" step="500" value="<?= $maxPrice ?>" style="width: 100%; cursor: pointer;">
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 8px;">
          <button type="submit" class="btn btn-primary" style="padding: 10px 20px; font-size: 14px; font-weight: 700; border-radius: 10px;">Filter</button>
          <a href="<?= BASE_URL ?>hostels.php" class="btn btn-outline" style="padding: 10px 16px; font-size: 14px; font-weight: 700; border-radius: 10px;">Reset</a>
        </div>
      </form>
    </div>

    <!-- HOSTELS LIST GRID -->
    <?php if (empty($hostels)): ?>
      <div id="noResultsMessage" style="text-align: center; padding: 64px 20px; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 16px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">No Hostels Matched Your Criteria</h3>
        <p style="color: #64748B; font-size: 14px; margin-bottom: 20px;">Try adjusting your location or price range filter.</p>
        <a href="<?= BASE_URL ?>hostels.php" class="btn btn-primary">View All Available Hostels</a>
      </div>
    <?php else: ?>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
        <?php foreach ($hostels as $h): 
          $photos = array_filter(explode(',', $h['photos']));
          $coverPhoto = !empty($photos) ? trim($photos[0]) : 'assets/images/hostels/hostel-1a.jpg';
          if (strpos($coverPhoto, 'http') !== 0) { $coverPhoto = BASE_URL . ltrim($coverPhoto, '/'); }
          $facList = array_filter(array_map('trim', explode(',', $h['facilities'])));
        ?>
          <div class="card hostel-card-item" data-name="<?= sanitize($h['name']) ?>" data-location="<?= sanitize($h['location_name']) ?>" data-price="<?= $h['price_per_year'] ?>" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.06);">
            
            <div style="position: relative; height: 200px; background: #CBD5E1; overflow: hidden;">
              <img src="<?= sanitize($coverPhoto) ?>" alt="<?= sanitize($h['name']) ?>" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80';">
              <div style="position: absolute; top: 12px; left: 12px; background: rgba(15,23,42,0.85); color: #2DD4BF; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">
                📍 <?= sanitize($h['distance_km']) ?> km to UMaT
              </div>
              <div style="position: absolute; top: 12px; right: 12px; background: #059669; color: #FFF; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
                ✓ Verified
              </div>
            </div>

            <div style="padding: 20px;">
              <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin-bottom: 6px;">
                <a href="<?= BASE_URL ?>hostel-details.php?id=<?= $h['id'] ?>" style="color: inherit; text-decoration: none;">
                  <?= sanitize($h['name']) ?>
                </a>
              </h3>

              <p style="font-size: 13px; color: #64748B; margin-bottom: 14px;">
                📌 <?= sanitize($h['location_name']) ?>
              </p>

              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;">
                <?php foreach (array_slice($facList, 0, 4) as $fac): ?>
                  <span style="font-size: 11px; font-weight: 700; background: #F1F5F9; color: #475569; padding: 3px 8px; border-radius: 6px;">
                    <?= sanitize($fac) ?>
                  </span>
                <?php endforeach; ?>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #F1F5F9;">
                <div>
                  <span style="font-size: 11px; color: #94A3B8; font-weight: 700; display: block;">PRICE FROM</span>
                  <span style="font-size: 18px; font-weight: 900; color: #0F766E;"><?= format_currency($h['price_per_year']) ?></span>
                  <span style="font-size: 12px; color: #64748B;">/yr</span>
                </div>
                <a href="<?= BASE_URL ?>hostel-details.php?id=<?= $h['id'] ?>" class="btn btn-primary btn-sm" style="padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 8px;">
                  View Rooms →
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
