/**
 * CreateDarkStore (application use-case)
 */

function createCreateDarkStore({ darkStoreRepository }) {
  if (!darkStoreRepository) throw new Error('CreateDarkStore: darkStoreRepository is required');

  return {
    /**
     * @param {{ actor:{id:number, role:string}, data: any }} params
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

