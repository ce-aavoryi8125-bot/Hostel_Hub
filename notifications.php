<?php
/**
 * HOSTEL HUB — Student Notifications Center
 */
$page_title = 'Notifications';
$active_page = 'notifications';

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navbar.php';

require_student_login();
$student = get_logged_in_student();
$db = getDB();

// Handle Mark All Read Action
if (isset($_GET['action']) && $_GET['action'] === 'read_all') {
    $db->prepare("UPDATE notifications SET is_read = 1 WHERE student_id = :sid")->execute([':sid' => $student['id']]);
    set_flash('success', 'All notifications marked as read.');
    header('Location: ' . BASE_URL . 'notifications.php');
    exit;
}

// Handle Single Mark Read Action
if (isset($_GET['read'])) {
    $nid = (int)$_GET['read'];
    $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = :id AND student_id = :sid")->execute([':id' => $nid, ':sid' => $student['id']]);
    header('Location: ' . BASE_URL . 'notifications.php');
    exit;
}

// Fetch Student Notifications
$stmt = $db->prepare("SELECT * FROM notifications WHERE student_id = :sid ORDER BY id DESC");
$stmt->execute([':sid' => $student['id']]);
$notifications = $stmt->fetchAll();
?>

<div style="background: #0F172A; color: #FFFFFF; padding: 32px 0;">
  <div class="container" style="max-width: 860px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
    <div>
      <h1 style="font-size: 26px; font-weight: 900;">Notifications Center</h1>
      <p style="color: #94A3B8; font-size: 14px; margin-top: 4px;">Alerts and booking status updates for <?= sanitize($student['name']) ?></p>
    </div>

    <?php if (!empty($notifications)): ?>
      <a href="<?= BASE_URL ?>notifications.php?action=read_all" class="btn btn-outline btn-sm" style="color: #FFF; border-color: rgba(255,255,255,0.3);">
        ✓ Mark All as Read
      </a>
    <?php endif; ?>
  </div>
</div>

<main style="padding: 40px 0; background: #F8FAFC; min-height: 75vh;">
  <div class="container" style="max-width: 860px; margin: 0 auto; padding: 0 24px;">
    
    <?php if (empty($notifications)): ?>
      <div style="text-align: center; padding: 64px 20px; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 16px;">
        <div style="font-size: 48px; margin-bottom: 12px;">🔔</div>
        <h3 style="font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">No Notifications Yet</h3>
        <p style="color: #64748B; font-size: 14px;">Updates regarding your room bookings and payment verifications will appear here.</p>
      </div>
    <?php else: ?>
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <?php foreach ($notifications as $n): 
          $typeBg = $n['type'] === 'success' ? '#ECFDF5' : ($n['type'] === 'warning' ? '#FEF3C7' : '#F0FDFA');
          $typeColor = $n['type'] === 'success' ? '#047857' : ($n['type'] === 'warning' ? '#B45309' : '#0F766E');
          $typeIcon = $n['type'] === 'success' ? '✅' : ($n['type'] === 'warning' ? '⚠️' : 'ℹ️');
        ?>
          <div style="background: <?= $n['is_read'] ? '#FFFFFF' : '#F0FDFA' ?>; border: 1px solid <?= $n['is_read'] ? '#E2E8F0' : '#99F6E4' ?>; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(15,23,42,0.04); display: flex; gap: 16px; align-items: flex-start; transition: background 0.2s;">
            
            <div style="width: 38px; height: 38px; background: <?= $typeBg ?>; border-radius: 10px; display: grid; place-items: center; font-size: 18px; flex: 0 0 auto;">
              <?= $typeIcon ?>
            </div>

            <div style="flex: 1 1 auto;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 4px;">
                <h3 style="font-size: 16px; font-weight: 800; color: #0F172A;"><?= sanitize($n['title']) ?></h3>
                <span style="font-size: 12px; color: #94A3B8; white-space: nowrap;"><?= date('d M Y, h:i A', strtotime($n['created_at'])) ?></span>
              </div>

              <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 8px;"><?= sanitize($n['message']) ?></p>

              <?php if (!$n['is_read']): ?>
                <a href="<?= BASE_URL ?>notifications.php?read=<?= $n['id'] ?>" style="font-size: 12px; font-weight: 700; color: #0F766E; text-decoration: none;">
                  Mark as read
                </a>
              <?php endif; ?>
            </div>

          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

  </div>
</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
