/**
 * ListOrdersByStore (application query)
 */

function createListOrdersByStore({ orderQueryRepository }) {
  if (!orderQueryRepository) throw new Error('ListOrdersByStore: orderQueryRepository is required');

  return {
    /**
     * @param {{ darkStoreId:number, status?:string, limit?:number, offset?:number }} params
     */
    async execute(params) {
      const result = await orderQueryRepository.listByStore(params);
      return { success: true, ...result };
    },
  };
}

module.exports = { createListOrdersByStore };

