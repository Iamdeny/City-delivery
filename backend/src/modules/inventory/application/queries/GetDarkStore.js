/**
 * GetDarkStore (application query)
 *
 * @param {{ darkStoreRepository: { getById: Function } }} deps
 */
function createGetDarkStore({ darkStoreRepository }) {
  if (!darkStoreRepository) throw new Error('GetDarkStore: darkStoreRepository is required');

  return {
    /**
     * @param {{ id: number, withStats?: boolean }} params
     */
    async execute(params) {
      const store = await darkStoreRepository.getById(params.id, {
        withStats: Boolean(params.withStats),
      });
      if (!store) return { success: false, error: 'NOT_FOUND' };
      return { success: true, store };
    },
  };
}

module.exports = { createGetDarkStore };

