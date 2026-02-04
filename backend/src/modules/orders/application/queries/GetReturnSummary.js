/**
 * GetReturnSummary (application query)
 */

/**
 * @param {Object} deps
 * @param {Object} deps.orderReturnRepository - getSummary({ orderId })
 * @returns {{ execute: (params: { orderId: number }) => Promise<{ ok: boolean, status: number, body: Object }> }}
 */
function createGetReturnSummary({ orderReturnRepository }) {
  if (!orderReturnRepository) throw new Error('GetReturnSummary: orderReturnRepository is required');

  return {
    /**
     * @param {{ orderId: number }} params
     * @returns {Promise<{ ok: boolean, status: number, body: Object }>}
     */
    async execute(params) {
      const result = await orderReturnRepository.getSummary({ orderId: params.orderId });
      if (result?.notFound) return { ok: false, status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
      return { ok: true, status: 200, body: result };
    },
  };
}

module.exports = { createGetReturnSummary };

