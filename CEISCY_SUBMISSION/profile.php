<?php
/**
 * HOSTEL HUB — Student Profile & Settings Page
 */
$page_title = 'My Student Profile';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

require_student_login();
$student = get_logged_in_student();
$db = getDB();

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name         = trim($_POST['name'] ?? '');
    $phone        = trim($_POST['phone'] ?? '');
    $studentIndex = trim($_POST['student_index'] ?? '');
    $faculty      = trim($_POST['faculty'] ?? '');
    $department   = trim($_POST['department'] ?? '');
    $level        = trim($_POST['level'] ?? '');

    $newPassword  = $_POST['new_password'] ?? '';

    if (empty($name) || empty($phone)) {
        $error = 'Name and phone number are required.';
    } else {
        $sql = "UPDATE students SET name = :name, phone = :phone, student_index = :sindex, faculty = :faculty, department = :dept, level = :level WHERE id = :id";
        $params = [
            ':name'   => $name,
            ':phone'  => $phone,
            ':sindex' => $studentIndex,
            ':faculty'=> $faculty,
            ':dept'   => $department,
            ':level'  => $level,
            ':id'     => $student['id']
        ];

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Optional password update
        if (!empty($newPassword)) {
            if (strlen($newPassword) < 6) {
                $error = 'New password must be at least 6 characters.';
            } else {
                $hash = password_hash($newPassword, PASSWORD_BCRYPT);
                $pwdStmt = $db->prepare("UPDATE students SET password_hash = :hash WHERE id = :id");
                $pwdStmt->execute([':hash' => $hash, ':id' => $student['id']]);
            }
        }

        if (empty($error)) {
            $_SESSION['student_name'] = $name;
            $success = 'Profile updated successfully!';
            $student = get_logged_in_student();
        }
    }
}
?>

<div style="background: #0F172A; color: #FFFFFF; padding: 32px 0;">
  <div class="container" style="max-width: 760px; margin: 0 auto; padding: 0 24px;">
    <h1 style="font-size: 26px; font-weight: 900;">Student Profile Settings</h1>
    <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">Update your student information & academic credentials</p>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC; min-height: 75vh;">
  <div class="container" style="max-width: 760px; margin: 0 auto; padding: 0 24px;">
    
    <?php if (!empty($error)): ?>
      <div style="background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
        ❌ <?= sanitize($error) ?>
      </div>
    <?php endif; ?>

    <?php if (!empty($success)): ?>
      <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
        ✅ <?= sanitize($success) ?>
      </div>
    <?php endif; ?>

    <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(15,23,42,0.05);">
      
      <form action="<?= BASE_URL ?>profile.php" method="POST">
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #F1F5F9;">
          <div style="width: 56px; height: 56px; background: #0F766E; border-radius: 50%; display: grid; place-items: center; font-size: 28px; color: #FFF;">
            🎓
          </div>
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: #0F172A;"><?= sanitize($student['name']) ?></h2>
            <span style="font-size: 13px; color: #64748B;"><?= sanitize($student['email']) ?> • UMaT Tarkwa</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Full Name *</label>
            <input type="text" name="name" required value="<?= sanitize($student['name']) ?>" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Phone Number *</label>
            <input type="text" name="phone" required value="<?= sanitize($student['phone']) ?>" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Student Index Number</label>
            <input type="text" name="student_index" value="<?= sanitize($student['student_index']) ?>" placeholder="e.g. UMaT/2024/0001" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Academic Level</label>
            <select name="level" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; font-weight: 600;">
              <option value="Level 100" <?= $student['level'] === 'Level 100' ? 'selected' : '' ?>>Level 100</option>
              <option value="Level 200" <?= $student['level'] === 'Level 200' ? 'selected' : '' ?>>Level 200</option>
              <option value="Level 300" <?= $student['level'] === 'Level 300' ? 'selected' : '' ?>>Level 300</option>
              <option value="Level 400" <?= $student['level'] === 'Level 400' ? 'selected' : '' ?>>Level 400</option>
              <option value="Postgraduate" <?= $student['level'] === 'Postgraduate' ? 'selected' : '' ?>>Postgraduate</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Faculty</label>
            <input type="text" name="faculty" value="<?= sanitize($student['faculty']) ?>" placeholder="e.g. Faculty of Engineering" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">Department</label>
            <input type="text" name="department" value="<?= sanitize($student['department']) ?>" placeholder="e.g. Mining Engineering" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
        </div>

        <div style="padding-top: 20px; border-top: 1px solid #F1F5F9; margin-bottom: 24px;">
          <h3 style="font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 12px;">Change Password (Optional)</h3>
          <div>
            <label style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px;">New Password</label>
            <input type="password" name="new_password" placeholder="Leave blank to keep current password" style="width: 100%; padding: 12px; border: 1px solid #CBD5E1; border-radius: 10px; font-size: 14px; outline: none;">
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 15px; font-weight: 700; border-radius: 10px;">
          Save Profile Changes →
        </button>
      </form>

    </div>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
