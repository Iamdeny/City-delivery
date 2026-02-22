/**
 * UpdateDarkStore (application use-case).
 * Admin/manager only.
 */

/**
 * @param {Object} deps
 * @param {Object} deps.darkStoreRepository - update(id, patch)
 * @returns {{ execute: (params: { actor: { id: number, role: string }, id: number, patch: Object }) => Promise<{ ok: boolean, status: number, body: Object }> }}
 */
function createUpdateDarkStore({ darkStoreRepository }) {
  if (!darkStoreRepository) throw new Error('UpdateDarkStore: darkStoreRepository is required');

  return {
    /**
     * @param {{ actor: { id: number, role: string }, id: number, patch: Object }} params
     * @returns {Promise<{ ok: boolean, status: number, body: Object }>}
     */
    async execute(params) {
      const role = params?.actor?.role || 'unknown';
      if (role !== 'admin' && role !== 'manager') {
        return { ok: false, status: 403, body: { success: false, error: 'FORBIDDEN' } };
      }

      const updated = await darkStoreRepository.update(params.id, params.patch);
      if (!updated) return { ok: false, status: 404, body: { success: false, error: 'NOT_FOUND' } };
      return { ok: true, status: 200, body: { success: true, store: updated } };
    },
  };
}

module.exports = { createUpdateDarkStore };

