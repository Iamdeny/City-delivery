/**
 * Orders HTTP interface.
 *
 * POST / and GET /, PATCH /:id/status use Clean Architecture use-cases.
 * Request validation: Zod for create/update body; Zod for GET / query.
 */

const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../../../../middleware/auth');
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
} = require('../../../../validators/order.validator');
const { metrics } = require('../../../../utils/metrics');

/** Zod: GET /api/orders query (list orders by store) */
const listOrdersByStoreQuerySchema = z.object({
  darkStoreId: z.coerce.number().int().positive('DARK_STORE_ID_REQUIRED'),
  status: z.string().max(50).optional(),
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Zod: path param order id (for PATCH/POST/GET :id/...) */
const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ORDER_ID_INVALID'),
});

/** Zod: PATCH /:id/status query (force override) */
const updateStatusQuerySchema = z.object({
  force: z
    .union([
      z.literal('1'),
      z.literal('0'),
      z.literal('true'),
      z.literal('false'),
    ])
    .optional()
    .transform((v) => v === '1' || (v && v.toLowerCase() === 'true')),
});

/** Zod: POST /:id/return body (partial return items) */
const returnOrderBodySchema = z.object({
  reason: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .optional(),
});

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
      const parsed = listOrdersByStoreQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        const message = first?.message || 'VALIDATION_ERROR';
        return res.status(400).json({
          success: false,
          error: message,
          details: parsed.error.flatten(),
        });
      }
      const { darkStoreId, status, q, limit, offset } = parsed.data;
      const result = await listOrdersByStore.execute({
        darkStoreId,
        status,
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
        const paramParsed = orderIdParamSchema.safeParse(req.params);
        const queryParsed = updateStatusQuerySchema.safeParse(req.query);
        if (!paramParsed.success) {
          return res.status(400).json({
            success: false,
            error: paramParsed.error.errors[0]?.message || 'ORDER_ID_INVALID',
          });
        }
        const orderId = paramParsed.data.id;
        const force = queryParsed.success
          ? queryParsed.data.force === true
          : false;
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
        metrics.inc('orders.status.change_error', {
          error: err?.name || 'Error',
        });
        return next(err);
      }
    }
  );

  // Customer: cancel own order (safe path)
  router.post(
    '/:id/cancel',
    authenticate,
    requireRole('customer'),
    async (req, res, next) => {
      try {
        const paramParsed = orderIdParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
          return res.status(400).json({
            success: false,
            error: paramParsed.error.errors[0]?.message || 'ORDER_ID_INVALID',
          });
        }
        const orderId = paramParsed.data.id;
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
    }
  );

  // Ops: returns workflow (admin/manager)
  // POST /api/orders/:id/return { reason?: string, items?: [{productId,quantity}] }
  router.post(
    '/:id/return',
    authenticate,
    requireRole('admin', 'manager'),
    async (req, res, next) => {
      try {
        const paramParsed = orderIdParamSchema.safeParse(req.params);
        const bodyParsed = returnOrderBodySchema.safeParse(req.body || {});
        if (!paramParsed.success) {
          return res.status(400).json({
            success: false,
            error: paramParsed.error.errors[0]?.message || 'ORDER_ID_INVALID',
          });
        }
        if (!bodyParsed.success) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            details: bodyParsed.error.flatten(),
          });
        }
        const orderId = paramParsed.data.id;
        const { reason, items } = bodyParsed.data;
        if (!returnOrderUseCase) {
          return res
            .status(500)
            .json({ success: false, error: 'RETURN_USE_CASE_MISSING' });
        }

        const result = await returnOrderUseCase.execute({
          actor: { id: req.user.id, role: req.user.role },
          orderId,
          reason,
          items,
        });

        if (result?.ok) {
          await audit(req, {
            action: 'order.return',
            entity_type: 'order',
            entity_id: String(orderId),
            meta: {
              result: 'ok',
              reason,
              items: items ?? null,
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
              reason,
              items: items ?? null,
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
    }
  );

  // Ops: return summary per order (ordered/returned/remaining)
  router.get(
    '/:id/return-summary',
    authenticate,
    requireRole('admin', 'manager'),
    async (req, res, next) => {
      try {
        const paramParsed = orderIdParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
          return res.status(400).json({
            success: false,
            error: paramParsed.error.errors[0]?.message || 'ORDER_ID_INVALID',
          });
        }
        const orderId = paramParsed.data.id;
        if (!getReturnSummary) {
          return res
            .status(500)
            .json({ success: false, error: 'RETURN_SUMMARY_MISSING' });
        }
        const result = await getReturnSummary.execute({ orderId });
        return res.status(result.status).json(result.body);
      } catch (err) {
        return next(err);
      }
    }
  );

  // Clean Architecture: create order
  router.post(
    '/',
    authenticate,
    requireRole('customer'),
    validateCreateOrder,
    async (req, res, next) => {
      try {
        const {
          items,
          address,
          phone,
          comment,
          latitude,
          longitude,
          darkStoreId,
        } = req.body;
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
          metrics.inc('orders.create.ok', {
            darkStoreId: darkStoreId ?? 'auto',
          });
        } else {
          metrics.inc('orders.create.fail', {
            darkStoreId: darkStoreId ?? 'auto',
            status: result.status,
            reason: result.body?.error || 'UNKNOWN',
          });
        }

        return res.status(result.status).json(result.body);
      } catch (err) {
        return next(err);
      }
    }
  );
  return router;
}

module.exports = {
  createOrdersRouter,
};
