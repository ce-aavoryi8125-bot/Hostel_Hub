const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const { data: locations, error: dbErr } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });

  if (dbErr) throw dbErr;
  return res.json({ locations: locations || [] });
}));

module.exports = router;
