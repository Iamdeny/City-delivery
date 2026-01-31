/**
 * Orders HTTP interface.
 *
 * Only POST / is migrated to Clean Architecture use-case for now.
 * Other endpoints are delegated to legacy router to keep behavior stable.
 */

const express = require('express');
const { authenticate, requireRole } = require('../../../../middleware/auth');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../../../../validators/order.validator');
const legacyOrdersRouter = require('../../../../routes/orders');
const { metrics } = require('../../../../utils/metrics');

function parseIntParam(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.floor(n);
}

function createOrdersRouter({
  createOrderUseCase,
  listOrdersByStore,
  updateOrderStatusUseCase,
  returnOrderUseCase,
  getReturnSummary,
  auditLogger,
}) {
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
      // never block the main flow
    }
  };

  // Ops: list orders by store (for /ops UI)
  // GET /api/orders?darkStoreId=1&status=active|pending|...&q=...&limit=50&offset=0
  router.get('/', async (req, res, next) => {
    try {
      const darkStoreId = parseIntParam(req.query.darkStoreId, null);
      if (!darkStoreId || darkStoreId <= 0) {
        return res.status(400).json({ success: false, error: 'DARK_STORE_ID_REQUIRED' });
      }

      const status = req.query.status ? String(req.query.status) : undefined;
      const q = req.query.q ? String(req.query.q).slice(0, 200) : undefined;
      const limit = parseIntParam(req.query.limit, 50);
      const offset = parseIntParam(req.query.offset, 0);

      const result = await listOrdersByStore.execute({ darkStoreId, status, q, limit, offset });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  /**
   * Clean-ish: status transitions with rules (overrides legacy PATCH /:id/status).
   * Legacy behavior allowed setting any status; now:
   * - courier/picker are limited to allowed transitions
   * - admin can override with ?force=1
   */
  router.patch(
    '/:id/status',
    authenticate,
    requireRole('courier', 'picker', 'admin', 'manager'),
    validateUpdateOrderStatus,
    async (req, res, next) => {
      try {
        const orderId = parseIntParam(req.params.id, null);
        if (!orderId || orderId <= 0) {
          return res.status(400).json({ success: false, error: 'ORDER_ID_INVALID' });
        }

        const force = String(req.query.force || '') === '1' || String(req.query.force || '').toLowerCase() === 'true';
        const result = await updateOrderStatusUseCase.execute({
          actor: { id: req.user.id, role: req.user.role },
          orderId,
          nextStatus: req.body.status,
          force,
        });

        if (result.ok) {
          metrics.inc('orders.status.changed', {
            from: result.body?.from,
            to: result.body?.to,
            role: req.user.role,
            darkStoreId: result.body?.order?.dark_store_id,
          });
          await audit(req, {
            action: 'order.status.change',
            entity_type: 'order',
            entity_id: String(orderId),
            meta: {
              from: result.body?.from,
              to: result.body?.to,
              force,
              dark_store_id: result.body?.order?.dark_store_id,
            },
          });
        } else {
          metrics.inc('orders.status.change_fail', {
            role: req.user.role,
            status: String(result.status),
            reason: result.body?.error || 'UNKNOWN',
          });
          await audit(req, {
            action: 'order.status.change',
            entity_type: 'order',
            entity_id: String(orderId),
            meta: {
              result: 'fail',
              error: result.body?.error || 'UNKNOWN',
              to: req.body?.status,
              force,
            },
          });
        }

        return res.status(result.status).json(result.body);
      } catch (err) {
        metrics.inc('orders.status.change_error', { error: err?.name || 'Error' });
        return next(err);
      }
    }
  );

  // Customer: cancel own order (safe path)
  router.post('/:id/cancel', authenticate, requireRole('customer'), async (req, res, next) => {
    try {
      const orderId = parseIntParam(req.params.id, null);
      if (!orderId || orderId <= 0) {
        return res.status(400).json({ success: false, error: 'ORDER_ID_INVALID' });
      }

      const result = await updateOrderStatusUseCase.execute({
        actor: { id: req.user.id, role: req.user.role },
        orderId,
        nextStatus: 'cancelled',
        force: false,
      });

      return res.status(result.status).json(result.body);
    } catch (err) {
      return next(err);
    }
  });

  // Ops: returns workflow (admin/manager)
  // POST /api/orders/:id/return { reason?: string, items?: [{productId,quantity}] }
  router.post('/:id/return', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const orderId = parseIntParam(req.params.id, null);
      if (!orderId || orderId <= 0) {
        return res.status(400).json({ success: false, error: 'ORDER_ID_INVALID' });
      }

      if (!returnOrderUseCase) {
        // defensive (should never happen when wired)
        return res.status(500).json({ success: false, error: 'RETURN_USE_CASE_MISSING' });
      }

      const result = await returnOrderUseCase.execute({
        actor: { id: req.user.id, role: req.user.role },
        orderId,
        reason: req.body?.reason,
        items: req.body?.items,
      });

      if (result?.ok) {
        await audit(req, {
          action: 'order.return',
          entity_type: 'order',
          entity_id: String(orderId),
          meta: {
            result: 'ok',
            reason: req.body?.reason,
            items: Array.isArray(req.body?.items) ? req.body.items : null,
            delta: result.body?.delta,
          },
        });
      } else {
        await audit(req, {
          action: 'order.return',
          entity_type: 'order',
          entity_id: String(orderId),
          meta: {
            result: 'fail',
            error: result?.body?.error || 'UNKNOWN',
            reason: req.body?.reason,
            items: Array.isArray(req.body?.items) ? req.body.items : null,
          },
        });
      }

      return res.status(result.status).json(result.body);
    } catch (err) {
      await audit(req, {
        action: 'order.return',
        entity_type: 'order',
        entity_id: String(req.params?.id ?? ''),
        meta: { result: 'error', error: err?.name || 'Error' },
      });
      return next(err);
    }
  });

  // Ops: return summary per order (ordered/returned/remaining)
  router.get('/:id/return-summary', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const orderId = parseIntParam(req.params.id, null);
      if (!orderId || orderId <= 0) {
        return res.status(400).json({ success: false, error: 'ORDER_ID_INVALID' });
      }
      if (!getReturnSummary) {
        return res.status(500).json({ success: false, error: 'RETURN_SUMMARY_MISSING' });
      }
      const result = await getReturnSummary.execute({ orderId });
      return res.status(result.status).json(result.body);
    } catch (err) {
      return next(err);
    }
  });

  // Clean Architecture: create order
  router.post(
    '/',
    authenticate,
    requireRole('customer'),
    validateCreateOrder,
    async (req, res, next) => {
      try {
        const { items, address, phone, comment, latitude, longitude, darkStoreId } = req.body;
        const userId = req.user.id;

        const result = await createOrderUseCase.execute({
          userId,
          items,
          darkStoreId,
          address,
          phone,
          comment,
          latitude,
          longitude,
        });

        if (result.ok) {
          metrics.inc('orders.create.ok', { darkStoreId: darkStoreId ?? 'auto' });
        } else {
          metrics.inc('orders.create.fail', {
            darkStoreId: darkStoreId ?? 'auto',
            status: result.status,
            reason: result.body?.error || 'UNKNOWN',
          });
        }

        return res.status(result.status).json(result.body);
      } catch (err) {
        metrics.inc('orders.create.error', { error: err?.name || 'Error' });
        return next(err);
      }
    }
  );

  // Delegate everything else to legacy router (includes GET /my-orders, etc.)
  router.use(legacyOrdersRouter);

  return router;
}

module.exports = {
  createOrdersRouter,
};

