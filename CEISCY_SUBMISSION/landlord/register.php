<?php
require_once __DIR__ . '/../includes/db.php';
session_start();

$pageTitle = 'Landlord Registration — Hostel Hub';
$error = '';
$success = '';

if (isset($_SESSION['landlord_id'])) {
    header('Location: dashboard.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = trim($_POST['full_name'] ?? '');
    $businessName = trim($_POST['business_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $ghanaCard = trim($_POST['ghana_card_number'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    $payoutMethod = trim($_POST['payout_method'] ?? 'MTN Mobile Money');
    $payoutAccount = trim($_POST['payout_account_number'] ?? '');

    if (empty($fullName) || empty($businessName) || empty($email) || empty($phone) || empty($password)) {
        $error = 'Please fill in all required fields.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } elseif ($password !== $confirmPassword) {
        $error = 'Passwords do not match.';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters long.';
    } else {
        $stmt = $pdo->prepare("SELECT id FROM landlords WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $error = 'An account with this email already exists.';
        } else {
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $insertStmt = $pdo->prepare("INSERT INTO landlords (full_name, business_name, email, password_hash, phone, ghana_card_number, payout_method, payout_account_number, kyc_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified')");
            if ($insertStmt->execute([$fullName, $businessName, $email, $passwordHash, $phone, $ghanaCard, $payoutMethod, $payoutAccount])) {
                $_SESSION['landlord_id'] = $pdo->lastInsertId();
                $_SESSION['landlord_name'] = $fullName;
                $_SESSION['landlord_business'] = $businessName;
                $_SESSION['landlord_email'] = $email;
                
                header('Location: dashboard.php?registered=1');
                exit;
            } else {
                $error = 'Registration failed. Please try again.';
            }
        }
    }
}

include __DIR__ . '/../includes/header.php';
?>

<div class="auth-page">
    <div class="auth-card" style="max-width: 600px;">
        <div class="auth-header">
            <span class="auth-badge">Commercial Landlord Portal</span>
            <h2>List Your Student Hostel</h2>
            <p>Register as a verified hostel owner or property manager in Tarkwa</p>
        </div>

        <?php if ($error): ?>
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="register.php" class="auth-form">
            <div class="form-row" style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="full_name">Full Manager Name *</label>
                    <input type="text" id="full_name" name="full_name" class="form-control" required placeholder="e.g. Kwame Mensah" value="<?= htmlspecialchars($_POST['full_name'] ?? '') ?>">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="business_name">Business / Enterprise Name *</label>
                    <input type="text" id="business_name" name="business_name" class="form-control" required placeholder="e.g. Banso Royal Housing Ltd" value="<?= htmlspecialchars($_POST['business_name'] ?? '') ?>">
                </div>
            </div>

            <div class="form-row" style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="email">Email Address *</label>
                    <input type="email" id="email" name="email" class="form-control" required placeholder="landlord@hostelhub.dev" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="phone">Phone Number (WhatsApp) *</label>
                    <input type="text" id="phone" name="phone" class="form-control" required placeholder="0244123456" value="<?= htmlspecialchars($_POST['phone'] ?? '') ?>">
                </div>
            </div>

            <div class="form-row" style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="ghana_card_number">Ghana Card ID Number (KYC)</label>
                    <input type="text" id="ghana_card_number" name="ghana_card_number" class="form-control" placeholder="GHA-729183921-4" value="<?= htmlspecialchars($_POST['ghana_card_number'] ?? '') ?>">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="payout_method">Preferred Payout Method</label>
                    <select id="payout_method" name="payout_method" class="form-control">
                        <option value="MTN Mobile Money">MTN Mobile Money</option>
                        <option value="Telecel Cash">Telecel Cash</option>
                        <option value="Bank Direct Transfer">Bank Direct Transfer</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label for="payout_account_number">MoMo Number / Bank Account Number</label>
                <input type="text" id="payout_account_number" name="payout_account_number" class="form-control" placeholder="0244123456" value="<?= htmlspecialchars($_POST['payout_account_number'] ?? '') ?>">
            </div>

            <div class="form-row" style="display: flex; gap: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="password">Password *</label>
                    <input type="password" id="password" name="password" class="form-control" required placeholder="••••••••">
                </div>
                <div class="form-group" style="flex: 1;">
                    <label for="confirm_password">Confirm Password *</label>
                    <input type="password" id="confirm_password" name="confirm_password" class="form-control" required placeholder="••••••••">
                </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg">
                <i class="fas fa-building"></i> Register Landlord Account
            </button>

            <div class="auth-footer">
                Already have a landlord account? <a href="login.php">Sign In to Landlord Portal</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
