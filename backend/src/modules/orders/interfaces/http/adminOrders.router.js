/**
 * Admin Orders HTTP interface.
 * GET /api/admin/orders (live dashboard), PATCH /api/admin/orders/:id/assign-courier
 */

const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../../../../middleware/auth');

/** Zod: GET /api/admin/orders query (live dashboard) */
const listLiveOrdersQuerySchema = z.object({
  darkStoreId: z.coerce.number().int().positive().optional(),
  tab: z.enum(['new', 'active', 'completed', 'all']).optional(),
  needsCourier: z
    .union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === '1' || (v && v.toLowerCase() === 'true')),
  problematic: z
    .union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === '1' || (v && v.toLowerCase() === 'true')),
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Zod: path param order id */
const orderIdParamSchema = z.object({ id: z.coerce.number().int().positive('ORDER_ID_INVALID') });

/** Zod: PATCH /api/admin/orders/:id/assign-courier body (courierId optional: omit or null = unassign) */
const assignCourierBodySchema = z.object({
  courierId: z.union([z.number().int().positive(), z.null()]).optional(),
});

function createAdminOrdersRouter({ listLiveOrders, assignCourierToOrder, auditLogger }) {
  const router = express.Router();

  const audit = async (req, event) => {
    if (!auditLogger || typeof auditLogger.append !== 'function') return;
    try {
      await auditLogger.append({
        actor_user_id: req.user?.id ?? null,
        actor_role: req.user?.role ?? null,
        action: event.action,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        ip: req.ip,
        user_agent: req.get('user-agent') || null,
        meta: event.meta || {},
      });
    } catch {
      // never block main flow
    }
  };

  router.get('/orders', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const parsed = listLiveOrdersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        return res.status(400).json({ success: false, error: first?.message || 'VALIDATION_ERROR', details: parsed.error.flatten() });
      }
      const { darkStoreId, tab, needsCourier, problematic, q, limit, offset } = parsed.data;
      const result = await listLiveOrders.execute({
        darkStoreId,
        tab,
        needsCourier: needsCourier === true,
        problematic: problematic === true,
        q,
        limit,
        offset,
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  /**
   * Ops: assign/unassign courier for order (used by live dashboard)
   * PATCH /api/admin/orders/:id/assign-courier
   * Body: { courierId?: number | null }
   */
  router.patch('/orders/:id/assign-courier', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      if (!assignCourierToOrder || typeof assignCourierToOrder.execute !== 'function') {
        return res.status(500).json({ success: false, error: 'ASSIGN_USECASE_MISSING' });
      }
      const paramParsed = orderIdParamSchema.safeParse(req.params);
      const bodyParsed = assignCourierBodySchema.safeParse(req.body || {});
      if (!paramParsed.success) {
        return res.status(400).json({ success: false, error: paramParsed.error.errors[0]?.message || 'ORDER_ID_INVALID' });
      }
      if (!bodyParsed.success) {
        return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: bodyParsed.error.flatten() });
      }
      const orderId = paramParsed.data.id;
      const courierId = bodyParsed.data.courierId ?? null;
      const result = await assignCourierToOrder.execute({
        actor: { id: req.user.id, role: req.user.role },
        orderId,
        courierId,
      });

      if (!result.ok) {
        return res.status(result.status).json(result.body);
      }

      await audit(req, {
        action: result.body?.toCourierId ? 'order.assign_courier' : 'order.unassign_courier',
        entity_type: 'order',
        entity_id: String(orderId),
        meta: { orderId, fromCourierId: result.body?.fromCourierId ?? null, toCourierId: result.body?.toCourierId ?? null },
      });

      return res.status(result.status).json(result.body);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createAdminOrdersRouter };

