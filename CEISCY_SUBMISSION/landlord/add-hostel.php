<?php
require_once __DIR__ . '/../includes/db.php';
session_start();

if (!isset($_SESSION['landlord_id'])) {
    header('Location: login.php');
    exit;
}

$landlordId = $_SESSION['landlord_id'];
$error = '';
$success = '';

// Fetch locations for dropdown
$locationsStmt = $pdo->query("SELECT * FROM locations ORDER BY name ASC");
$locations = $locationsStmt->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $locationId = intval($_POST['location_id'] ?? 1);
    $locationName = trim($_POST['location_name'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $pricePerYear = floatval($_POST['price_per_year'] ?? 0);
    $distanceKm = floatval($_POST['distance_km'] ?? 1.0);
    $facilities = trim($_POST['facilities'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $photos = trim($_POST['photos'] ?? 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80');

    if (empty($name) || empty($address) || $pricePerYear <= 0) {
        $error = 'Please fill in all required hostel details (Name, Address, Price).';
    } else {
        $insertStmt = $pdo->prepare("
            INSERT INTO hostels (landlord_id, location_id, name, location_name, address, price_per_year, distance_km, facilities, description, photos, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ");
        if ($insertStmt->execute([$landlordId, $locationId, $name, $locationName, $address, $pricePerYear, $distanceKm, $facilities, $description, $photos])) {
            $newHostelId = $pdo->lastInsertId();

            // Insert Default Room Types
            $roomStmt = $pdo->prepare("INSERT INTO rooms (hostel_id, room_type, capacity, available_count, price_per_year) VALUES (?, ?, ?, ?, ?)");
            $roomStmt->execute([$newHostelId, '2-in-a-room', 2, 8, $pricePerYear]);
            $roomStmt->execute([$newHostelId, '4-in-a-room', 4, 12, round($pricePerYear * 0.75, 2)]);

            header('Location: dashboard.php?added=1');
            exit;
        } else {
            $error = 'Failed to create hostel listing.';
        }
    }
}

$pageTitle = 'Add New Hostel Property — Landlord Portal';
include __DIR__ . '/../includes/header.php';
?>

<div class="container" style="padding-top: 40px; padding-bottom: 60px; max-width: 800px;">
    <div style="margin-bottom: 30px;">
        <a href="dashboard.php" class="btn btn-outline-primary btn-sm" style="margin-bottom: 12px;"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>
        <h1 style="font-size: 2rem; margin: 0; color: var(--color-slate-900);">Add New Student Hostel</h1>
        <p style="color: var(--color-slate-600); margin-top: 4px;">Publish a new verified student accommodation listing for UMaT Tarkwa students</p>
    </div>

    <?php if ($error): ?>
        <div class="alert alert-error">
            <i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?>
        </div>
    <?php endif; ?>

    <div style="background: white; border: 1px solid var(--color-slate-200); border-radius: 12px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
        <form method="POST" action="add-hostel.php">
            <div class="form-group">
                <label for="name">Hostel / Property Name *</label>
                <input type="text" id="name" name="name" class="form-control" required placeholder="e.g. Royal Gold Student Lodge" value="<?= htmlspecialchars($_POST['name'] ?? '') ?>">
            </div>

            <div class="form-row" style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="location_id">Target Area / Suburb *</label>
                    <select id="location_id" name="location_id" class="form-control" onchange="document.getElementById('location_name').value = this.options[this.selectedIndex].text;">
                        <?php foreach ($locations as $loc): ?>
                            <option value="<?= $loc['id'] ?>"><?= htmlspecialchars($loc['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                    <input type="hidden" id="location_name" name="location_name" value="<?= htmlspecialchars($locations[0]['name'] ?? 'Banso (Main Gate), Tarkwa') ?>">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="distance_km">Distance to UMaT Campus (km) *</label>
                    <input type="number" step="0.1" id="distance_km" name="distance_km" class="form-control" required placeholder="0.5" value="<?= htmlspecialchars($_POST['distance_km'] ?? '0.8') ?>">
                </div>
            </div>

            <div class="form-group">
                <label for="address">Full Physical Address *</label>
                <input type="text" id="address" name="address" class="form-control" required placeholder="Plot 18, UMaT Main Road, Banso, Tarkwa" value="<?= htmlspecialchars($_POST['address'] ?? '') ?>">
            </div>

            <div class="form-group">
                <label for="price_per_year">Starting Price Per Academic Year (GH₵) *</label>
                <input type="number" step="0.01" id="price_per_year" name="price_per_year" class="form-control" required placeholder="4500.00" value="<?= htmlspecialchars($_POST['price_per_year'] ?? '4800.00') ?>">
            </div>

            <div class="form-group">
                <label for="facilities">Hostel Facilities & Amenities (Comma Separated)</label>
                <input type="text" id="facilities" name="facilities" class="form-control" placeholder="Wi-Fi, Generator, 24/7 Water Supply, Security Guard, Study Room" value="<?= htmlspecialchars($_POST['facilities'] ?? 'Wi-Fi, Generator, 24/7 Water Supply, Security Guard, Study Room') ?>">
            </div>

            <div class="form-group">
                <label for="description">Detailed Hostel Description</label>
                <textarea id="description" name="description" class="form-control" rows="4" placeholder="Describe room features, security details, surrounding quiet environment, proximity to lecture halls..."><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
            </div>

            <div class="form-group">
                <label for="photos">Hostel Photo URLs (Comma Separated Image Links)</label>
                <input type="text" id="photos" name="photos" class="form-control" placeholder="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80" value="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=80">
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 20px;">
                <i class="fas fa-check-circle"></i> Publish Student Hostel Listing
            </button>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
