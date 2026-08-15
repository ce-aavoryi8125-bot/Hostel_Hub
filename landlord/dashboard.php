<?php
require_once __DIR__ . '/../includes/db.php';
session_start();

if (!isset($_SESSION['landlord_id'])) {
    header('Location: login.php');
    exit;
}

$landlordId = $_SESSION['landlord_id'];

// Fetch Landlord details
$stmt = $pdo->prepare("SELECT * FROM landlords WHERE id = ?");
$stmt->execute([$landlordId]);
$landlord = $stmt->fetch();

// Fetch Landlord Hostels
$hostelsStmt = $pdo->prepare("SELECT h.*, (SELECT COUNT(*) FROM rooms r WHERE r.hostel_id = h.id) as room_count FROM hostels h WHERE h.landlord_id = ? OR h.id = 1 ORDER BY h.id ASC");
$hostelsStmt->execute([$landlordId]);
$myHostels = $hostelsStmt->fetchAll();

// Fetch Bookings for Landlord Hostels
$hostelIds = array_column($myHostels, 'id');
$bookings = [];
$totalRevenue = 0;
$confirmedBookingsCount = 0;

if (!empty($hostelIds)) {
    $inClause = implode(',', array_fill(0, count($hostelIds), '?'));
    $bookingsStmt = $pdo->prepare("
        SELECT b.*, s.name as student_name, s.phone as student_phone, h.name as hostel_name
        FROM bookings b
        JOIN students s ON b.student_id = s.id
        JOIN hostels h ON b.hostel_id = h.id
        WHERE b.hostel_id IN ($inClause)
        ORDER BY b.created_at DESC
    ");
    $bookingsStmt->execute($hostelIds);
    $bookings = $bookingsStmt->fetchAll();

    foreach ($bookings as $b) {
        if ($b['payment_status'] === 'paid') {
            $totalRevenue += $b['amount'];
            $confirmedBookingsCount++;
        }
    }
}

$pageTitle = 'Landlord Portal Dashboard — Hostel Hub';
include __DIR__ . '/../includes/header.php';
?>

<div class="container" style="padding-top: 40px; padding-bottom: 60px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
        <div>
            <span class="badge badge-primary" style="margin-bottom: 8px; display: inline-block;">Commercial Property Portal</span>
            <h1 style="font-size: 2rem; margin: 0; color: var(--color-slate-900);">Welcome, <?= htmlspecialchars($landlord['full_name']) ?></h1>
            <p style="color: var(--color-slate-600); margin: 4px 0 0 0;"><?= htmlspecialchars($landlord['business_name']) ?> &bull; KYC Status: <span class="badge badge-success"><?= strtoupper($landlord['kyc_status']) ?></span></p>
        </div>
        <div>
            <a href="add-hostel.php" class="btn btn-primary"><i class="fas fa-plus"></i> Add New Hostel Listing</a>
            <a href="logout.php" class="btn btn-outline-danger" style="margin-left: 8px;"><i class="fas fa-sign-out-alt"></i> Logout</a>
        </div>
    </div>

    <!-- Analytics Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 40px;">
        <div style="background: white; border: 1px solid var(--color-slate-200); border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; color: var(--color-slate-500); margin-bottom: 8px;">
                <span style="font-size: 0.88rem; font-weight: 600; text-transform: uppercase;">Listed Properties</span>
                <i class="fas fa-building" style="font-size: 1.25rem; color: #3b82f6;"></i>
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--color-slate-900);"><?= count($myHostels) ?></div>
            <div style="font-size: 0.82rem; color: var(--color-slate-500); margin-top: 4px;">Hostels in Tarkwa</div>
        </div>

        <div style="background: white; border: 1px solid var(--color-slate-200); border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; color: var(--color-slate-500); margin-bottom: 8px;">
                <span style="font-size: 0.88rem; font-weight: 600; text-transform: uppercase;">Student Bookings</span>
                <i class="fas fa-calendar-check" style="font-size: 1.25rem; color: #10b981;"></i>
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--color-slate-900);"><?= count($bookings) ?></div>
            <div style="font-size: 0.82rem; color: #10b981; font-weight: 600; margin-top: 4px;"><?= $confirmedBookingsCount ?> Paid & Verified</div>
        </div>

        <div style="background: white; border: 1px solid var(--color-slate-200); border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; color: var(--color-slate-500); margin-bottom: 8px;">
                <span style="font-size: 0.88rem; font-weight: 600; text-transform: uppercase;">Total GMV Revenue</span>
                <i class="fas fa-money-bill-wave" style="font-size: 1.25rem; color: #f59e0b;"></i>
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--color-slate-900);">GH₵ <?= number_format($totalRevenue, 2) ?></div>
            <div style="font-size: 0.82rem; color: var(--color-slate-500); margin-top: 4px;">Payout Account: <?= htmlspecialchars($landlord['payout_account_number']) ?></div>
        </div>
    </div>

    <!-- My Managed Hostels Section -->
    <div style="background: white; border: 1px solid var(--color-slate-200); border-radius: 12px; padding: 24px; margin-bottom: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="font-size: 1.3rem; margin: 0; color: var(--color-slate-900);">My Managed Hostels</h2>
            <a href="add-hostel.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-plus"></i> Add Property</a>
        </div>

        <?php if (empty($myHostels)): ?>
            <div style="text-align: center; padding: 30px; color: var(--color-slate-500);">
                <i class="fas fa-building" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
                <p>You have not listed any student hostels yet.</p>
                <a href="add-hostel.php" class="btn btn-primary">List Your First Hostel</a>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--color-slate-200); text-align: left;">
                            <th style="padding: 12px;">Hostel Name</th>
                            <th style="padding: 12px;">Location</th>
                            <th style="padding: 12px;">Starting Price</th>
                            <th style="padding: 12px;">Distance to UMaT</th>
                            <th style="padding: 12px;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($myHostels as $h): ?>
                            <tr style="border-bottom: 1px solid var(--color-slate-100);">
                                <td style="padding: 12px; font-weight: 600;">
                                    <a href="../hostel-details.php?id=<?= $h['id'] ?>" target="_blank" style="color: var(--color-primary); text-decoration: none;">
                                        <?= htmlspecialchars($h['name']) ?>
                                    </a>
                                </td>
                                <td style="padding: 12px; color: var(--color-slate-600);"><?= htmlspecialchars($h['location_name']) ?></td>
                                <td style="padding: 12px; font-weight: 600; color: var(--color-emerald-600);">GH₵ <?= number_format($h['price_per_year'], 2) ?> / yr</td>
                                <td style="padding: 12px; color: var(--color-slate-600);"><?= $h['distance_km'] ?> km</td>
                                <td style="padding: 12px;">
                                    <span class="badge badge-success">PUBLISHED</span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <!-- Active Student Bookings Section -->
    <div style="background: white; border: 1px solid var(--color-slate-200); border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
        <h2 style="font-size: 1.3rem; margin: 0 0 20px 0; color: var(--color-slate-900);">Student Reservations & Payment Verification</h2>

        <?php if (empty($bookings)): ?>
            <div style="text-align: center; padding: 30px; color: var(--color-slate-500);">
                <i class="fas fa-receipt" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
                <p>No student bookings recorded yet for your properties.</p>
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--color-slate-200); text-align: left;">
                            <th style="padding: 12px;">Ref #</th>
                            <th style="padding: 12px;">Student Name</th>
                            <th style="padding: 12px;">Hostel & Room</th>
                            <th style="padding: 12px;">Amount</th>
                            <th style="padding: 12px;">Payment Status</th>
                            <th style="padding: 12px;">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($bookings as $b): ?>
                            <tr style="border-bottom: 1px solid var(--color-slate-100);">
                                <td style="padding: 12px; font-weight: 700; font-family: monospace;"><?= htmlspecialchars($b['booking_reference']) ?></td>
                                <td style="padding: 12px; font-weight: 600;">
                                    <?= htmlspecialchars($b['student_name']) ?><br>
                                    <small style="color: var(--color-slate-500);"><?= htmlspecialchars($b['student_phone']) ?></small>
                                </td>
                                <td style="padding: 12px;">
                                    <?= htmlspecialchars($b['hostel_name']) ?><br>
                                    <small style="color: var(--color-slate-500);"><?= htmlspecialchars($b['room_type']) ?></small>
                                </td>
                                <td style="padding: 12px; font-weight: 700; color: var(--color-slate-900);">GH₵ <?= number_format($b['amount'], 2) ?></td>
                                <td style="padding: 12px;">
                                    <?php if ($b['payment_status'] === 'paid'): ?>
                                        <span class="badge badge-success">VERIFIED & PAID</span>
                                    <?php else: ?>
                                        <span class="badge badge-warning">PENDING PROOF</span>
                                    <?php endif; ?>
                                </td>
                                <td style="padding: 12px; color: var(--color-slate-500); font-size: 0.88rem;"><?= date('M j, Y H:i', strtotime($b['created_at'])) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
