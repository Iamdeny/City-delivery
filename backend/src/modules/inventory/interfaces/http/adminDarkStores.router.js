/**
 * Admin DarkStores HTTP interface (inventory module).
 *
 * POST /api/admin/dark-stores
 * PATCH /api/admin/dark-stores/:id
 */

const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../../../../middleware/auth');

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Неверный формат времени (HH:MM или HH:MM:SS)');

const createSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  address: z.string().min(5).max(500).trim(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().max(100).nullable().optional(),
  is_active: z.boolean().optional(),
  opening_time: timeSchema.nullable().optional(),
  closing_time: timeSchema.nullable().optional(),
  delivery_radius: z.number().int().min(0).max(100000).nullable().optional(),
  delivery_fee: z.number().min(0).max(1000000).nullable().optional(),
  min_order_amount: z.number().min(0).max(1000000).nullable().optional(),
});

const updateSchema = createSchema.partial().refine((p) => Object.keys(p).length > 0, {
  message: 'EMPTY_PATCH',
});

function createAdminDarkStoresRouter({ createDarkStore, updateDarkStore, auditLogger }) {
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

  router.post('/dark-stores', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        const issues = parsed.error?.issues || parsed.error?.errors || [];
        await audit(req, {
          action: 'dark_store.create',
          entity_type: 'dark_store',
          entity_id: null,
          meta: {
            result: 'fail',
            error: 'VALIDATION_ERROR',
            details: issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }

      const result = await createDarkStore.execute({
        actor: { id: req.user.id, role: req.user.role },
        data: parsed.data,
      });
      if (result?.ok && result?.body?.store?.id) {
        await audit(req, {
          action: 'dark_store.create',
          entity_type: 'dark_store',
          entity_id: String(result.body.store.id),
          meta: { result: 'ok', data: parsed.data },
        });
      } else {
        await audit(req, {
          action: 'dark_store.create',
          entity_type: 'dark_store',
          entity_id: null,
          meta: { result: 'fail', error: result?.body?.error || 'UNKNOWN', data: parsed.data },
        });
      }
      return res.status(result.status).json(result.body);
    } catch (err) {
      return next(err);
    }
  });

  router.patch('/dark-stores/:id', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ success: false, error: 'INVALID_ID' });
      }

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        const issues = parsed.error?.issues || parsed.error?.errors || [];
        await audit(req, {
          action: 'dark_store.update',
          entity_type: 'dark_store',
          entity_id: String(id),
          meta: {
            result: 'fail',
            error: 'VALIDATION_ERROR',
            details: issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
        return res.status(400).json({
          success: false,
          error: 'Ошибка валидации',
          details: issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
        });
      }

      const result = await updateDarkStore.execute({
        actor: { id: req.user.id, role: req.user.role },
        id,
        patch: parsed.data,
      });
      if (result?.ok) {
        await audit(req, {
          action: 'dark_store.update',
          entity_type: 'dark_store',
          entity_id: String(id),
          meta: { patch: parsed.data, result: 'ok' },
        });
      } else {
        await audit(req, {
          action: 'dark_store.update',
          entity_type: 'dark_store',
          entity_id: String(id),
          meta: { patch: parsed.data, result: 'fail', error: result?.body?.error || 'UNKNOWN' },
        });
      }
      return res.status(result.status).json(result.body);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { createAdminDarkStoresRouter };

