/**
 * Admin Audit HTTP interface.
 * GET /api/admin/audit
 */

const express = require('express');
const { authenticate, requireRole } = require('../../../../middleware/auth');

function parseIntParam(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function createAdminAuditRouter({ listAuditEvents }) {
  const router = express.Router();

  router.get('/audit', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const limit = parseIntParam(req.query.limit, 50);
      const offset = parseIntParam(req.query.offset, 0);
      const action = req.query.action ? String(req.query.action) : undefined;
      const entityType = req.query.entityType ? String(req.query.entityType) : undefined;
      const entityId = req.query.entityId ? String(req.query.entityId) : undefined;
      const actorId = req.query.actorId ? String(req.query.actorId) : undefined;
      const q = req.query.q ? String(req.query.q).slice(0, 200) : undefined;

      const result = await listAuditEvents.execute({ limit, offset, action, entityType, entityId, actorId, q });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createAdminAuditRouter };

