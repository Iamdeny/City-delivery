/**
 * GetReturnSummary (application query)
 */

function createGetReturnSummary({ orderReturnRepository }) {
  if (!orderReturnRepository) throw new Error('GetReturnSummary: orderReturnRepository is required');

  return {
    /**
     * @param {{ orderId:number }} params
     */
    async execute(params) {
      const result = await orderReturnRepository.getSummary({ orderId: params.orderId });
      if (result?.notFound) return { ok: false, status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
      return { ok: true, status: 200, body: result };
    },
  };
}

module.exports = { createGetReturnSummary };

