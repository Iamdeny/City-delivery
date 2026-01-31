/**
 * ListDarkStores (application query)
 *
 * @param {{ darkStoreRepository: { list: Function } }} deps
 */
function createListDarkStores({ darkStoreRepository }) {
  if (!darkStoreRepository) throw new Error('ListDarkStores: darkStoreRepository is required');

  return {
    /**
     * @param {{ includeInactive?: boolean, withStats?: boolean }} params
     */
    async execute(params = {}) {
      const { includeInactive = false, withStats = false } = params;
      const stores = await darkStoreRepository.list({ includeInactive, withStats });
      return { success: true, stores };
    },
  };
}

module.exports = { createListDarkStores };

