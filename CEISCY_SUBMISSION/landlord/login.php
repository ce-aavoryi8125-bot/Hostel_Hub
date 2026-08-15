<?php
require_once __DIR__ . '/../includes/db.php';
session_start();

$pageTitle = 'Landlord Login — Hostel Hub';
$error = '';

if (isset($_SESSION['landlord_id'])) {
    header('Location: dashboard.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        $error = 'Please enter both email and password.';
    } else {
        $stmt = $pdo->prepare("SELECT * FROM landlords WHERE email = ?");
        $stmt->execute([$email]);
        $landlord = $stmt->fetch();

        if ($landlord && password_verify($password, $landlord['password_hash'])) {
            $_SESSION['landlord_id'] = $landlord['id'];
            $_SESSION['landlord_name'] = $landlord['full_name'];
            $_SESSION['landlord_business'] = $landlord['business_name'];
            $_SESSION['landlord_email'] = $landlord['email'];
            
            header('Location: dashboard.php');
            exit;
        } else {
            $error = 'Invalid email or password.';
        }
    }
}

include __DIR__ . '/../includes/header.php';
?>

<div class="auth-page">
    <div class="auth-card" style="max-width: 480px;">
        <div class="auth-header">
            <span class="auth-badge">Commercial Landlord Portal</span>
            <h2>Landlord Sign In</h2>
            <p>Access your hostel management dashboard, bookings, and payouts</p>
        </div>

        <?php if ($error): ?>
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i> <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <div style="background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 0.88rem; color: #1e3a8a;">
            <strong>Demo Landlord Credentials:</strong><br>
            Email: <code>landlord@hostelhub.dev</code><br>
            Password: <code>Landlord@Hub2024!</code>
        </div>

        <form method="POST" action="login.php" class="auth-form">
            <div class="form-group">
                <label for="email">Landlord Email Address</label>
                <input type="email" id="email" name="email" class="form-control" required placeholder="landlord@hostelhub.dev" value="<?= htmlspecialchars($_POST['email'] ?? 'landlord@hostelhub.dev') ?>">
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" class="form-control" required placeholder="••••••••" value="Landlord@Hub2024!">
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg">
                <i class="fas fa-sign-in-alt"></i> Sign In to Landlord Portal
            </button>

            <div class="auth-footer">
                Don't have a landlord account? <a href="register.php">Register Property Manager</a>
            </div>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../includes/footer.php'; ?>
