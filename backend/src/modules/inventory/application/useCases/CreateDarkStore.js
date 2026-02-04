/**
 * CreateDarkStore (application use-case).
 * Admin/manager only.
 */

/**
 * @param {Object} deps
 * @param {Object} deps.darkStoreRepository - create(data)
 * @returns {{ execute: (params: { actor: { id: number, role: string }, data: Object }) => Promise<{ ok: boolean, status: number, body: Object }> }}
 */
function createCreateDarkStore({ darkStoreRepository }) {
  if (!darkStoreRepository) throw new Error('CreateDarkStore: darkStoreRepository is required');

  return {
    /**
     * @param {{ actor: { id: number, role: string }, data: Object }} params
     * @returns {Promise<{ ok: boolean, status: number, body: Object }>}
     */
    async execute(params) {
      const role = params?.actor?.role || 'unknown';
      if (role !== 'admin' && role !== 'manager') {
        return { ok: false, status: 403, body: { success: false, error: 'FORBIDDEN' } };
      }

      const created = await darkStoreRepository.create(params.data);
      return { ok: true, status: 201, body: { success: true, store: created } };
    },
  };
}

module.exports = { createCreateDarkStore };

