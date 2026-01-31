/**
 * ListLiveOrders (application query)
 * For Ops "live dashboard" (Wolt-style).
 */

function createListLiveOrders({ orderQueryRepository }) {
  if (!orderQueryRepository) throw new Error('ListLiveOrders: orderQueryRepository is required');

  return {
    /**
     * @param {{
     *  darkStoreId?: number,
     *  tab?: 'new'|'active'|'completed'|'all',
     *  needsCourier?: boolean,
     *  problematic?: boolean,
     *  q?: string,
     *  limit?: number,
     *  offset?: number
     * }} params
     */
    async execute(params) {
      const result = await orderQueryRepository.listLive(params);
      return { success: true, ...result };
    },
  };
}

module.exports = { createListLiveOrders };

