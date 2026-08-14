<?php
/**
 * HOSTEL HUB — Student Homepage & Discovery
 */
$page_title = 'Student Hostel Discovery Tarkwa';
$active_page = 'home';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

$db = getDB();

// Fetch locations for search dropdown
$locationsStmt = $db->query("SELECT id, name FROM locations ORDER BY name ASC");
$locations = $locationsStmt->fetchAll();

// Fetch top featured hostels
$hostelsStmt = $db->query("SELECT h.*, l.name as loc_name FROM hostels h LEFT JOIN locations l ON h.location_id = l.id WHERE h.is_published = 1 ORDER BY h.id ASC LIMIT 6");
$hostels = $hostelsStmt->fetchAll();
?>

<!-- HERO SECTION -->
<section class="hero-section" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #fff; padding: 64px 0 80px; position: relative; overflow: hidden;">
  <div class="container hero-inner" style="max-width: 1200px; margin: 0 auto; padding: 0 24px; text-align: center; position: relative; z-index: 2;">
    
    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(15, 118, 110, 0.2); border: 1px solid rgba(15, 118, 110, 0.4); border-radius: 9999px; padding: 6px 16px; font-size: 13px; font-weight: 700; color: #2DD4BF; margin-bottom: 24px;">
      <span>✨ Official UMaT Tarkwa Student Accommodation Platform</span>
    </div>

    <h1 style="font-size: clamp(32px, 5vw, 56px); font-weight: 900; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 20px; color: #FFFFFF;">
      Find & Book Verified Hostels Near <span style="color: #2DD4BF;">UMaT Tarkwa</span>
    </h1>

    <p style="font-size: clamp(16px, 2vw, 19px); color: #94A3B8; max-width: 720px; margin: 0 auto 40px; line-height: 1.6;">
      Zero agent middleman scams. Browse 100% physically verified student rooms, view annual prices, upload payment proof, and receive instant printable receipts.
    </p>

    <!-- SEARCH & FILTER FORM BAR -->
    <form action="<?= BASE_URL ?>hostels.php" method="GET" style="background: #FFFFFF; padding: 12px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 860px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
      
      <div style="flex: 1 1 240px; text-align: left; padding: 0 12px;">
        <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">Hostel Name or Keyword</label>
        <input type="text" name="q" placeholder="e.g. Banso Royal, Victory..." style="width: 100%; border: none; outline: none; font-size: 15px; font-weight: 600; color: #0F172A; background: transparent;">
      </div>

      <div style="width: 1px; height: 36px; background: #E2E8F0; display: none;" class="desktop-divider"></div>

      <div style="flex: 1 1 200px; text-align: left; padding: 0 12px;">
        <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 4px;">Preferred Location</label>
        <select name="location" style="width: 100%; border: none; outline: none; font-size: 15px; font-weight: 600; color: #0F172A; background: transparent; cursor: pointer;">
          <option value="">All Tarkwa Areas</option>
          <?php foreach ($locations as $loc): ?>
            <option value="<?= sanitize($loc['name']) ?>"><?= sanitize($loc['name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <button type="submit" class="btn btn-primary" style="padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 12px; white-space: nowrap;">
        🔍 Search Hostels
      </button>
    </form>

    <!-- KEY STATS -->
    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 32px; margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.1);">
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #2DD4BF;">15+</div>
        <div style="font-size: 13px; color: #94A3B8; font-weight: 600;">Verified Tarkwa Hostels</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #2DD4BF;">100%</div>
        <div style="font-size: 13px; color: #94A3B8; font-weight: 600;">Verified Room Prices</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #2DD4BF;">GH₵ 0</div>
        <div style="font-size: 13px; color: #94A3B8; font-weight: 600;">Agent Commission Fees</div>
      </div>
    </div>

  </div>
</section>

<!-- FEATURED HOSTELS SECTION -->
<section style="padding: 64px 0; background: #F8FAFC;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
    
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; flex-wrap: wrap; gap: 16px;">
      <div>
        <h2 style="font-size: 28px; font-weight: 900; color: #0F172A; letter-spacing: -0.02em;">Featured Student Hostels</h2>
        <p style="font-size: 15px; color: #64748B; margin-top: 4px;">Top-rated accommodations near UMaT main gate, Ayensu, and Akoon</p>
      </div>
      <a href="<?= BASE_URL ?>hostels.php" class="btn btn-outline">View All Hostels →</a>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
      <?php foreach ($hostels as $h): 
        $photos = array_filter(explode(',', $h['photos']));
        $coverPhoto = !empty($photos) ? trim($photos[0]) : 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80';
        $facList = array_filter(array_map('trim', explode(',', $h['facilities'])));
      ?>
        <div class="card hostel-card-item" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15,23,42,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease;">
          
          <div style="position: relative; height: 200px; background: #CBD5E1; overflow: hidden;">
            <img src="<?= sanitize($coverPhoto) ?>" alt="<?= sanitize($h['name']) ?>" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; top: 12px; left: 12px; background: rgba(15,23,42,0.85); color: #2DD4BF; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">
              📍 <?= sanitize($h['distance_km']) ?> km to campus
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

            <p style="font-size: 13px; color: #64748B; margin-bottom: 14px; display: flex; align-items: center; gap: 4px;">
              <span>📌 <?= sanitize($h['location_name']) ?></span>
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
                <span style="font-size: 11px; color: #94A3B8; font-weight: 700; display: block;">STARTS FROM</span>
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

  </div>
</section>

<!-- WHY HOSTEL HUB SECTION -->
<section style="padding: 64px 0; background: #FFFFFF; border-top: 1px solid #E2E8F0;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 24px; text-align: center;">
    
    <h2 style="font-size: 28px; font-weight: 900; color: #0F172A; margin-bottom: 12px;">Built Specifically for UMaT Students</h2>
    <p style="font-size: 15px; color: #64748B; max-width: 600px; margin: 0 auto 48px;">Direct booking, transparent pricing, and instant payment proof submission.</p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 32px; text-align: left;">
      <div style="padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
        <div style="font-size: 32px; margin-bottom: 12px;">🔒</div>
        <h3 style="font-size: 17px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Direct Hostel Booking</h3>
        <p style="font-size: 14px; color: #64748B; line-height: 1.5;">Book directly without paying middleman agent fees. All listings are 100% verified physically.</p>
      </div>

      <div style="padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
        <div style="font-size: 32px; margin-bottom: 12px;">📄</div>
        <h3 style="font-size: 17px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Printable Official Receipts</h3>
        <p style="font-size: 14px; color: #64748B; line-height: 1.5;">Generate and print official booking receipts instantly for your financial records or bursary clearance.</p>
      </div>

      <div style="padding: 24px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
        <div style="font-size: 32px; margin-bottom: 12px;">📱</div>
        <h3 style="font-size: 17px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Payment Proof Upload</h3>
        <p style="font-size: 14px; color: #64748B; line-height: 1.5;">Easily submit your Mobile Money or Bank deposit payment receipt directly from your phone.</p>
      </div>
    </div>

  </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
