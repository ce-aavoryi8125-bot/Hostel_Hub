<?php
/**
 * HOSTEL HUB — Student Account Registration
 */
$page_title = 'Create Student Account';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

if (is_logged_in()) {
    header('Location: ' . BASE_URL . 'bookings.php');
    exit;
}

$db = getDB();
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name         = trim($_POST['name'] ?? '');
    $email        = trim(strtolower($_POST['email'] ?? ''));
    $phone        = trim($_POST['phone'] ?? '');
    $studentIndex = trim($_POST['student_index'] ?? '');
    $password     = $_POST['password'] ?? '';
    $passwordConfirm = $_POST['password_confirm'] ?? '';

    if (empty($name) || empty($email) || empty($phone) || empty($password)) {
        $error = 'Please fill in all required fields.';
    } elseif ($password !== $passwordConfirm) {
        $error = 'Passwords do not match. Please re-enter.';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters long.';
    } else {
        // Check if email exists
        $chk = $db->prepare("SELECT id FROM students WHERE LOWER(email) = LOWER(:email)");
        $chk->execute([':email' => $email]);
        if ($chk->fetch()) {
            $error = 'A student account with this email address already exists.';
        } else {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $db->prepare("INSERT INTO students (name, email, password_hash, phone, student_index, created_at) VALUES (:name, :email, :hash, :phone, :sindex, NOW())");
            $ok = $stmt->execute([
                ':name'   => $name,
                ':email'  => $email,
                ':hash'   => $hash,
                ':phone'  => $phone,
                ':sindex' => $studentIndex
            ]);

            if ($ok) {
                $newId = $db->lastInsertId();
                $_SESSION['student_id']    = $newId;
                $_SESSION['student_name']  = $name;
                $_SESSION['student_email'] = $email;

                add_notification($newId, 'Welcome to Hostel Hub UMaT', 'Your student account has been created successfully. Browse hostels and reserve rooms with zero agent fees.', 'success');

                set_flash('success', 'Account created successfully! Welcome to Hostel Hub.');
                header('Location: ' . BASE_URL . 'bookings.php');
                exit;
            } else {
                $error = 'Failed to create student account. Please try again.';
            }
        }
    }
}
?>

<main style="padding: 50px 0; background: #F8FAFC; min-height: 80vh; display: grid; placeItems: center;">
  <div class="container" style="max-width: 520px; margin: 0 auto; padding: 0 24px;">
    
    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; padding: 36px; box-shadow: 0 10px 30px rgba(15,23,42,0.08);">
      
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #0F766E, #0D9488); border-radius: 14px; display: inline-grid; place-items: center; font-size: 24px; color: #FFF; margin-bottom: 12px;">
          📝
        </div>
        <h1 style="font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.02em;">Create Student Account</h1>
        <p style="font-size: 14px; color: #64748B; margin-top: 4px;">Join UMaT Tarkwa student hostel platform</p>
      </div>

      <?php if (!empty($error)): ?>
        <div style="background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
          ❌ <?= sanitize($error) ?>
        </div>
      <?php endif; ?>

      <form action="<?= BASE_URL ?>register.php" method="POST">
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Full Name *</label>
          <input type="text" name="name" required placeholder="e.g. Kwesi Mensah" value="<?= sanitize($_POST['name'] ?? '') ?>" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Email Address *</label>
            <input type="email" name="email" required placeholder="student@umat.edu.gh" value="<?= sanitize($_POST['email'] ?? '') ?>" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Phone Number *</label>
            <input type="text" name="phone" required placeholder="+233 24 123 4567" value="<?= sanitize($_POST['phone'] ?? '') ?>" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Student Index Number (Optional)</label>
          <input type="text" name="student_index" placeholder="e.g. UMaT/2026/0481" value="<?= sanitize($_POST['student_index'] ?? '') ?>" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Password *</label>
            <input type="password" name="password" required placeholder="••••••••" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Confirm Password *</label>
            <input type="password" name="password_confirm" required placeholder="••••••••" style="width: 100%; padding: 12px 14px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 15px; font-weight: 700; border-radius: 10px;">
          Create Student Account →
        </button>
      </form>

      <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #F1F5F9; font-size: 14px; color: #64748B;">
        Already have a student account?
        <a href="<?= BASE_URL ?>login.php" style="color: #0F766E; font-weight: 700; text-decoration: none;">Sign In</a>
      </div>

    </div>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
