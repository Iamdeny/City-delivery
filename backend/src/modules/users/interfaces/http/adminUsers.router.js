/**
 * Admin Users HTTP interface.
 * GET /api/admin/users
 */

const express = require('express');
const { authenticate, requireRole } = require('../../../../middleware/auth');
const { metrics } = require('../../../../utils/metrics');

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
      const q = req.query.q ? String(req.query.q) : undefined;
      const role = req.query.role ? String(req.query.role) : undefined;
      const isActive = parseBoolParam(req.query.isActive);
      const limit = parseIntParam(req.query.limit, 50);
      const offset = parseIntParam(req.query.offset, 0);

      const result = await listUsers.execute({ q, role, isActive, limit, offset });
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  });

  // Admin-only: update role/is_active
  router.patch('/users/:id', authenticate, requireRole('admin'), async (req, res, next) => {
    try {
      const userId = parseIntParam(req.params.id, null);
      if (!userId || userId <= 0) {
        return res.status(400).json({ success: false, error: 'USER_ID_INVALID' });
      }

      const patch = {};
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'role')) patch.role = req.body.role;
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'is_active')) patch.is_active = req.body.is_active;
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'isActive')) patch.is_active = req.body.isActive;

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

