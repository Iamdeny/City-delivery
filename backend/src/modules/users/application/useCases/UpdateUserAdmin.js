/**
 * UpdateUserAdmin (application use-case)
 *
 * Admin-only actions: change role and/or activation status.
 */

const ALLOWED_ROLES = new Set(['customer', 'courier', 'picker', 'admin', 'manager']);

function createUpdateUserAdmin({ userRepository }) {
  if (!userRepository) throw new Error('UpdateUserAdmin: userRepository is required');

  return {
    /**
     * @param {{
     *  actor: { id:number, role:string },
     *  userId:number,
     *  patch: { role?:string, is_active?:boolean }
     * }} params
     */
    async execute(params) {
      const actor = params.actor || {};
      const userId = Number(params.userId);
      const patch = params.patch || {};

      if (actor.role !== 'admin') {
        return { ok: false, status: 403, body: { success: false, error: 'FORBIDDEN' } };
      }
      if (!Number.isFinite(userId) || userId <= 0) {
        return { ok: false, status: 400, body: { success: false, error: 'USER_ID_INVALID' } };
      }

      const hasRole = patch.role !== undefined;
      const hasActive = patch.is_active !== undefined;
      if (!hasRole && !hasActive) {
        return { ok: false, status: 400, body: { success: false, error: 'EMPTY_PATCH' } };
      }

      if (hasRole && !ALLOWED_ROLES.has(String(patch.role))) {
        return { ok: false, status: 400, body: { success: false, error: 'ROLE_INVALID' } };
      }
      if (hasActive && typeof patch.is_active !== 'boolean') {
        return { ok: false, status: 400, body: { success: false, error: 'IS_ACTIVE_INVALID' } };
      }

      // Safety: don't allow admin to lock themselves out accidentally
      if (actor.id === userId) {
        if (hasRole && patch.role !== 'admin') {
          return { ok: false, status: 400, body: { success: false, error: 'CANNOT_DEMOTE_SELF' } };
        }
        if (hasActive && patch.is_active === false) {
          return { ok: false, status: 400, body: { success: false, error: 'CANNOT_DEACTIVATE_SELF' } };
        }
      }

      const existing = await userRepository.getById(userId);
      if (!existing) {
        return { ok: false, status: 404, body: { success: false, error: 'USER_NOT_FOUND' } };
      }

      const updated = await userRepository.updateAdmin(userId, {
        role: hasRole ? String(patch.role) : undefined,
        is_active: hasActive ? Boolean(patch.is_active) : undefined,
      });

      return { ok: true, status: 200, body: { success: true, user: updated } };
    },
  };
}

module.exports = { createUpdateUserAdmin };

