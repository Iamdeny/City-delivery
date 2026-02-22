const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const logger = require('../utils/logger');

// POST /api/analytics/recommendation
router.post('/recommendation', async (req, res) => {
  try {
    const { eventType, productId, userId, sessionId } = req.body;

    // Валидация
    if (!['impression', 'click'].includes(eventType) || !productId) {
      return res.status(400).json({ success: false, error: 'Invalid data' });
    }

    // Асинхронно сохраняем (можно через очередь, но для простоты сразу)
    await query(
      `INSERT INTO recommendation_events (event_type, product_id, user_id, session_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [eventType, productId, userId || null, sessionId || null]
    );

    res.json({ success: true });
  } catch (error) {
    logger.error('Error saving recommendation event:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

module.exports = router;
