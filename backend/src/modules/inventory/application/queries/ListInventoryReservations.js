/**
 * ListInventoryReservations (application query)
 *
 * @param {{ inventoryRepository: { listActiveReservationsByStore: Function } }} deps
 */
function createListInventoryReservations({ inventoryRepository }) {
  if (!inventoryRepository) throw new Error('ListInventoryReservations: inventoryRepository is required');

  return {
    /**
     * @param {{ darkStoreId: number }} params
     */
    async execute(params) {
      const reservations = await inventoryRepository.listActiveReservationsByStore(params.darkStoreId);
      return { success: true, reservations };
    },
  };
}

module.exports = { createListInventoryReservations };

