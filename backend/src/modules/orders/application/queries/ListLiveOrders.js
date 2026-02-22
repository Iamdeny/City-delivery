/**
 * ListLiveOrders (application query)
 * For Ops "live dashboard" (Wolt-style).
 * @see ../ports.js for ListLiveOrdersInput
 */

/**
 * @param {Object} deps
 * @param {Object} deps.orderQueryRepository - listLive(params)
 * @returns {{ execute: (params: import('../ports').ListLiveOrdersInput) => Promise<{ success: true, orders?: Object[], total?: number }> }}
 */
function createListLiveOrders({ orderQueryRepository }) {
  if (!orderQueryRepository) throw new Error('ListLiveOrders: orderQueryRepository is required');

  return {
    /**
     * @param {import('../ports').ListLiveOrdersInput} params
     * @returns {Promise<{ success: true, orders?: Object[], total?: number }>}
     */
    async execute(params) {
      const result = await orderQueryRepository.listLive(params);
      return { success: true, ...result };
    },
  };
}

module.exports = { createListLiveOrders };

