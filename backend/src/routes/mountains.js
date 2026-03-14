const express = require('express');
const router = express.Router();
const mountains = require('../data/mountains');

// GET /api/mountains - 전체 산 목록 조회
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: mountains.length,
    data: mountains,
  });
});

// GET /api/mountains/:id - 특정 산 상세 조회
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: '유효하지 않은 ID입니다.' });
  }

  const mountain = mountains.find((m) => m.id === id);
  if (!mountain) {
    return res.status(404).json({ success: false, message: '해당 산을 찾을 수 없습니다.' });
  }

  res.json({ success: true, data: mountain });
});

module.exports = router;
