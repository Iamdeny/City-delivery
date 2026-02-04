/**
 * ListOrdersByStore (application query)
 * @see ../ports.js for ListOrdersByStoreInput
 */

/**
 * @param {Object} deps
 * @param {Object} deps.orderQueryRepository - listByStore(params)
 * @returns {{ execute: (params: import('../ports').ListOrdersByStoreInput) => Promise<{ success: true, orders?: Object[], total?: number }> }}
 */
function createListOrdersByStore({ orderQueryRepository }) {
  if (!orderQueryRepository) throw new Error('ListOrdersByStore: orderQueryRepository is required');

  return {
    /**
     * @param {import('../ports').ListOrdersByStoreInput} params
     * @returns {Promise<{ success: true, orders?: Object[], total?: number }>}
     */
    async execute(params) {
      const result = await orderQueryRepository.listByStore(params);
      return { success: true, ...result };
    },
  };
}

module.exports = { createListOrdersByStore };

