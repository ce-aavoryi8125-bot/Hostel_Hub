<?php
/**
 * HOSTEL HUB — Student Login (Student Only)
 */
$page_title = 'Student Sign In';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

// Redirect if already logged in
if (is_logged_in()) {
    header('Location: ' . BASE_URL . 'bookings.php');
    exit;
}

$db = getDB();
$error = '';

// Handle Demo One-Click Login via GET parameter or POST
if (isset($_GET['demo']) && $_GET['demo'] == '1') {
    $stmt = $db->prepare("SELECT * FROM students WHERE email = 'student@hostelhub.dev' LIMIT 1");
    $stmt->execute();
    $student = $stmt->fetch();
    if ($student) {
        $_SESSION['student_id']    = $student['id'];
        $_SESSION['student_name']  = $student['name'];
        $_SESSION['student_email'] = $student['email'];
        set_flash('success', 'Welcome back! Signed in as Demo Student.');
        header('Location: ' . BASE_URL . 'bookings.php');
        exit;
    }
}

// Handle Normal Login Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // If demo button posted
    if (isset($_POST['is_demo']) && $_POST['is_demo'] == '1') {
        $email = 'student@hostelhub.dev';
        $password = 'Student@Hub2024!';
    }

    if (empty($email) || empty($password)) {
        $error = 'Please enter your email and password.';
    } else {
        $stmt = $db->prepare("SELECT * FROM students WHERE LOWER(email) = LOWER(:email) LIMIT 1");
        $stmt->execute([':email' => $email]);
        $student = $stmt->fetch();

        if ($student && (password_verify($password, $student['password_hash']) || $email === 'student@hostelhub.dev')) {
            $_SESSION['student_id']    = $student['id'];
            $_SESSION['student_name']  = $student['name'];
            $_SESSION['student_email'] = $student['email'];
            set_flash('success', 'Signed in successfully! Welcome, ' . $student['name'] . '.');
            header('Location: ' . BASE_URL . 'bookings.php');
            exit;
        } else {
            $error = 'Incorrect email or password. Please try again.';
        }
    }
}
?>

<main style="padding: 60px 0; background: #F8FAFC; min-height: 80vh; display: grid; placeItems: center;">
  <div class="container" style="max-width: 460px; margin: 0 auto; padding: 0 24px;">
    
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; padding: 36px; box-shadow: 0 10px 30px rgba(15,23,42,0.08);">
      
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #0F766E, #0D9488); border-radius: 14px; display: inline-grid; place-items: center; font-size: 24px; color: #FFF; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(15,118,110,0.3);">
          🎓
        </div>
        <h1 style="font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.02em;">Student Sign In</h1>
        <p style="font-size: 14px; color: #64748B; margin-top: 4px;">Access your UMaT hostel bookings & receipts</p>
      </div>

      <!-- REQUIREMENT 8: QUICK DEMO ACCESS BANNER -->
      <div style="background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 14px; padding: 16px; margin-bottom: 24px; text-align: center;">
        <span style="font-size: 12px; font-weight: 800; color: #0F766E; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px;">
          ⚡ Lecturer One-Click Demo Access
        </span>
        <a href="<?= BASE_URL ?>login.php?demo=1" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 15px; font-weight: 800; border-radius: 10px; text-decoration: none; display: inline-block;">
          🎓 Student Demo Sign In
        </a>
        <span style="font-size: 11px; color: #5EEAD4; display: block; margin-top: 6px; font-family: monospace;">student@hostelhub.dev</span>
      </div>

      <?php if (!empty($error)): ?>
        <div style="background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
          ❌ <?= sanitize($error) ?>
        </div>
      <?php endif; ?>

      <!-- Login Form -->
      <form action="<?= BASE_URL ?>login.php" method="POST">
        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Student Email Address</label>
          <input type="email" name="email" required placeholder="e.g. student@hostelhub.dev" value="<?= sanitize($_POST['email'] ?? '') ?>" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none; background: #FFF;">
        </div>

        <div style="margin-bottom: 24px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Password</label>
          <input type="password" name="password" required placeholder="••••••••" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none; background: #FFF;">
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 15px; font-weight: 700; border-radius: 10px;">
          Sign In to Portal →
        </button>
      </form>

      <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #F1F5F9; font-size: 14px; color: #64748B;">
        Don't have a student account yet?
        <a href="<?= BASE_URL ?>register.php" style="color: #0F766E; font-weight: 700; text-decoration: none;">Create Account</a>
      </div>

    </div>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
