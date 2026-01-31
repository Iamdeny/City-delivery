/**
 * UpdateDarkStore (application use-case)
 */

function createUpdateDarkStore({ darkStoreRepository }) {
  if (!darkStoreRepository) throw new Error('UpdateDarkStore: darkStoreRepository is required');

  return {
    /**
     * @param {{ actor:{id:number, role:string}, id:number, patch:any }} params
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

