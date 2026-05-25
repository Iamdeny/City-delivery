/**
 * Admin Users HTTP interface.
 * GET /api/admin/users, PATCH /api/admin/users/:id
 */

const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../../../../middleware/auth');
const { metrics } = require('../../../../utils/metrics');

/** Zod: GET /api/admin/users query */
const listUsersQuerySchema = z.object({
  q: z.string().max(200).optional(),
  role: z.string().max(50).optional(),
  isActive: z
    .union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === '1' || (v && v.toLowerCase() === 'true')),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Zod: path param user id */
const userIdParamSchema = z.object({ id: z.coerce.number().int().positive('USER_ID_INVALID') });

/** Zod: PATCH /api/admin/users/:id body */
const updateUserAdminBodySchema = z.object({
  role: z.enum(['customer', 'courier', 'picker', 'admin', 'manager']).optional(),
  is_active: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).transform((data) => ({
  role: data.role,
  is_active: data.is_active !== undefined ? data.is_active : data.isActive,
}));

/** Zod 4: issues; Zod 3: errors */
function firstZodMessage(err) {
  const issue = err?.issues?.[0] ?? err?.errors?.[0];
  return issue?.message || 'VALIDATION_ERROR';
}

function createAdminUsersRouter({ listUsers, updateUserAdmin, auditLogger }) {
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

  router.get('/users', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
    try {
      const parsed = listUsersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: firstZodMessage(parsed.error),
          details: parsed.error.flatten(),
        });
      }
      const { q, role, isActive, limit, offset } = parsed.data;
      const result = await listUsers.execute({
        q,
        role,
        isActive,
        limit,
        offset,
      });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  // Admin-only: update role/is_active
  router.patch('/users/:id', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const paramParsed = userIdParamSchema.safeParse(req.params);
      const bodyParsed = updateUserAdminBodySchema.safeParse(req.body || {});
      if (!paramParsed.success) {
        return res.status(400).json({ success: false, error: firstZodMessage(paramParsed.error) || 'USER_ID_INVALID' });
      }
      if (!bodyParsed.success) {
        return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', details: bodyParsed.error.flatten() });
      }
      const userId = paramParsed.data.id;
      const patch = {};
      if (bodyParsed.data.role !== undefined) patch.role = bodyParsed.data.role;
      if (bodyParsed.data.is_active !== undefined) patch.is_active = bodyParsed.data.is_active;

      const result = await updateUserAdmin.execute({
        actor: { id: req.user.id, role: req.user.role },
        userId,
        patch,
      });

      if (result.ok) {
        metrics.inc('users.admin.update.ok', { actorId: req.user.id, targetId: userId });
        await audit(req, {
          action: 'user.admin.update',
          entity_type: 'user',
          entity_id: String(userId),
          meta: { patch, result: 'ok' },
        });
      } else {
        metrics.inc('users.admin.update.fail', { actorId: req.user.id, targetId: userId, reason: result.body?.error || 'UNKNOWN' });
        await audit(req, {
          action: 'user.admin.update',
          entity_type: 'user',
          entity_id: String(userId),
          meta: { patch, result: 'fail', error: result.body?.error || 'UNKNOWN' },
        });
      }

      return res.status(result.status).json(result.body);
    } catch (err) {
      metrics.inc('users.admin.update.error', { error: err?.name || 'Error' });
      return next(err);
    }
  });

  return router;
}

module.exports = { createAdminUsersRouter };

