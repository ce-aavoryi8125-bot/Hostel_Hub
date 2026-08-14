<?php
/**
 * HOSTEL HUB — Helper Functions
 */

require_once __DIR__ . '/../config/database.php';

function format_currency($amount) {
    return 'GH₵ ' . number_format((float)$amount, 2);
}

function sanitize($data) {
    return htmlspecialchars(trim((string)$data), ENT_QUOTES, 'UTF-8');
}

function generate_booking_ref() {
    return 'HH-' . date('Y') . '-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
}

function generate_payment_ref() {
    return 'PAY-' . date('Y') . '-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
}

function get_unread_notifications_count($student_id) {
    if (!$student_id) return 0;
    $db = getDB();
    $stmt = $db->prepare("SELECT COUNT(*) AS cnt FROM notifications WHERE student_id = :sid AND is_read = 0");
    $stmt->execute([':sid' => $student_id]);
    $res = $stmt->fetch();
    return (int)($res['cnt'] ?? 0);
}

function add_notification($student_id, $title, $message, $type = 'info') {
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO notifications (student_id, title, message, type, created_at) VALUES (:sid, :title, :msg, :type, NOW())");
    return $stmt->execute([
        ':sid'   => $student_id,
        ':title' => $title,
        ':msg'   => $message,
        ':type'  => $type
    ]);
}
