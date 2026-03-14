const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const TRAILS_DIR = path.join(__dirname, '../data/trails');

// GET /api/trails/:mountainId
router.get('/:mountainId', (req, res) => {
  const mountainId = parseInt(req.params.mountainId, 10);
  if (isNaN(mountainId)) {
    return res.status(400).json({ success: false, message: '유효하지 않은 산 ID입니다.' });
  }

  if (!fs.existsSync(TRAILS_DIR)) {
    return res.status(404).json({ success: false, message: '등산로 데이터가 없습니다.' });
  }

  const files = fs.readdirSync(TRAILS_DIR).filter(f => f.endsWith('.json'));
  const file = files.find(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(TRAILS_DIR, f), 'utf8'));
      return data.mountainId === mountainId;
    } catch {
      return false;
    }
  });

  if (!file) {
    return res.status(404).json({ success: false, message: '해당 산의 등산로 데이터가 없습니다.' });
  }

  const data = JSON.parse(fs.readFileSync(path.join(TRAILS_DIR, file), 'utf8'));
  res.json({ success: true, data });
});

module.exports = router;
