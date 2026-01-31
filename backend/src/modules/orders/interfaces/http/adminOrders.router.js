/**
 * Admin Orders HTTP interface.
 * GET /api/admin/orders (live dashboard)
 */

const express = require('express');
const { authenticate, requireRole } = require('../../../../middleware/auth');

function parseIntParam(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function parseBoolParam(value) {
  if (value === undefined) return undefined;
  const s = String(value).toLowerCase();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;
  return undefined;
}

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
      const darkStoreId = parseIntParam(req.query.darkStoreId, undefined);
      const tab = req.query.tab ? String(req.query.tab) : undefined;
      const needsCourier = parseBoolParam(req.query.needsCourier);
      const problematic = parseBoolParam(req.query.problematic);
      const q = req.query.q ? String(req.query.q) : undefined;
      const limit = parseIntParam(req.query.limit, 50);
      const offset = parseIntParam(req.query.offset, 0);

      const result = await listLiveOrders.execute({
        darkStoreId,
        tab,
        needsCourier,
        problematic,
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
   * Body: { courierId: number | null }
   */
  router.patch('/orders/:id/assign-courier', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      if (!assignCourierToOrder || typeof assignCourierToOrder.execute !== 'function') {
        return res.status(500).json({ success: false, error: 'ASSIGN_USECASE_MISSING' });
      }

      const orderId = parseIntParam(req.params.id, null);
      if (!orderId || orderId <= 0) {
        return res.status(400).json({ success: false, error: 'ORDER_ID_INVALID' });
      }

      const courierId = Object.prototype.hasOwnProperty.call(req.body || {}, 'courierId') ? req.body.courierId : undefined;
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

