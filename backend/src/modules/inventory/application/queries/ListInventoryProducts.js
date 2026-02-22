/**
 * ListInventoryProducts (application query)
 *
 * @param {{ inventoryRepository: { listProductsByStore: Function } }} deps
 */
function createListInventoryProducts({ inventoryRepository }) {
  if (!inventoryRepository) throw new Error('ListInventoryProducts: inventoryRepository is required');

  return {
    /**
     * @param {{ darkStoreId: number }} params
     */
    async execute(params) {
      const products = await inventoryRepository.listProductsByStore(params.darkStoreId);
      return { success: true, products };
    },
  };
}

module.exports = { createListInventoryProducts };

