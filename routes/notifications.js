const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error } = require('../utils/apiResponse');
const supabase = require('../config/supabase');

const router = express.Router();

// ── GET /api/notifications ──────────────────────────────────────────────────
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const { data: notifs, error: dbErr } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (dbErr && dbErr.code === '42P01') return res.json({ notifications: [], unreadCount: 0 });
  if (dbErr) throw dbErr;

  const list = notifs || [];
  const unreadCount = list.filter(n => !n.read).length;

  return res.json({ notifications: list, unreadCount });
}));

// ── PATCH /api/notifications/:id/read ──────────────────────────────────────
router.patch('/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const { data: updated, error: dbErr } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (dbErr && dbErr.code !== '42P01') throw dbErr;

  return res.json({ message: 'Notification marked as read', notification: updated });
}));

// ── PATCH /api/notifications/read-all ──────────────────────────────────────
router.post('/read-all', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  return res.json({ message: 'All notifications marked as read' });
}));

module.exports = router;
