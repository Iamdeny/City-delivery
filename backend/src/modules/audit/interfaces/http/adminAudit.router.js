/**
 * Admin Audit HTTP interface.
 * GET /api/admin/audit
 */

const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../../../../middleware/auth');

/** Zod: GET /api/admin/audit query */
const listAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  action: z.string().max(100).optional(),
  entityType: z.string().max(100).optional(),
  entityId: z.string().max(100).optional(),
  actorId: z.coerce.number().int().positive().optional(),
  q: z.string().max(200).optional(),
});

function createAdminAuditRouter({ listAuditEvents }) {
  const router = express.Router();

  router.get('/audit', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const parsed = listAuditQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        return res.status(400).json({ success: false, error: first?.message || 'VALIDATION_ERROR', details: parsed.error.flatten() });
      }
      const { limit, offset, action, entityType, entityId, actorId, q } = parsed.data;
      const result = await listAuditEvents.execute({
        limit,
        offset,
        action,
        entity_type: entityType,
        entity_id: entityId,
        actor_user_id: actorId,
        q,
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createAdminAuditRouter };

