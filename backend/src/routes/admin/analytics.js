const express = require('express');
const router = express.Router();
const { query } = require('../../config/database');
const logger = require('../../utils/logger');
const { authenticate, requireRole } = require('../../middleware/auth');

// GET /api/admin/analytics/recommendations/summary
router.get('/recommendations/summary', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { from, to } = req.query;
    // Значения по умолчанию: последние 30 дней
    const fromDate =
      from ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
         COUNT(CASE WHEN event_type = 'impression' THEN 1 END) AS impressions,
         COUNT(CASE WHEN event_type = 'click' THEN 1 END) AS clicks,
         COALESCE(
           ROUND(
             COUNT(CASE WHEN event_type = 'click' THEN 1 END) * 100.0 /
             NULLIF(COUNT(CASE WHEN event_type = 'impression' THEN 1 END), 0),
             2
           ), 0
         ) AS ctr
       FROM recommendation_events
       WHERE created_at::date BETWEEN $1 AND $2`,
      [fromDate, toDate]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching recommendations summary:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// GET /api/admin/analytics/recommendations/top-products
router.get('/recommendations/top-products', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { from, to, limit = 10 } = req.query;
    const fromDate =
      from ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
         p.id,
         p.name,
         p.price,
         p.category,
         p.image,
         COUNT(CASE WHEN re.event_type = 'impression' THEN 1 END) AS impressions,
         COUNT(CASE WHEN re.event_type = 'click' THEN 1 END) AS clicks,
         COALESCE(
           ROUND(
             COUNT(CASE WHEN re.event_type = 'click' THEN 1 END) * 100.0 /
             NULLIF(COUNT(CASE WHEN re.event_type = 'impression' THEN 1 END), 0),
             2
           ), 0
         ) AS ctr
       FROM products p
       JOIN recommendation_events re ON p.id = re.product_id
       WHERE re.created_at::date BETWEEN $1 AND $2
       GROUP BY p.id, p.name, p.price, p.category, p.image
       ORDER BY clicks DESC, impressions DESC
       LIMIT $3`,
      [fromDate, toDate, parseInt(limit, 10)]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching top products:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// GET /api/admin/analytics/recommendations/daily
router.get('/recommendations/daily', authenticate, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate =
      from ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT
         created_at::date AS date,
         COUNT(CASE WHEN event_type = 'impression' THEN 1 END) AS impressions,
         COUNT(CASE WHEN event_type = 'click' THEN 1 END) AS clicks,
         COALESCE(
           ROUND(
             COUNT(CASE WHEN event_type = 'click' THEN 1 END) * 100.0 /
             NULLIF(COUNT(CASE WHEN event_type = 'impression' THEN 1 END), 0),
             2
           ), 0
         ) AS ctr
       FROM recommendation_events
       WHERE created_at::date BETWEEN $1 AND $2
       GROUP BY created_at::date
       ORDER BY created_at::date ASC`,
      [fromDate, toDate]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error fetching daily stats:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

module.exports = router;
