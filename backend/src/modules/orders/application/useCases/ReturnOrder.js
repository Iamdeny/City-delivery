/**
 * ReturnOrder (application use-case)
 *
 * Safe, idempotent warehouse return:
 * - Restocks items back to products.stock_quantity
 * - Records a return event to prevent double returns
 *
 * NOTE: This is a "returns workflow" after pickup/delivery/cancel-after-pickup.
 * It's intentionally separate from "cancel before pickup" which uses inventory reservation rollback.
 */

function normalizeItems(items) {
  if (!Array.isArray(items)) return null;
  const map = new Map();
  for (const it of items) {
    const productId = Number(it?.productId);
    const quantity = Number(it?.quantity);
    if (!Number.isFinite(productId) || productId <= 0) return { error: 'ITEM_PRODUCT_ID_INVALID' };
    if (!Number.isFinite(quantity) || quantity <= 0) return { error: 'ITEM_QUANTITY_INVALID' };
    map.set(productId, (map.get(productId) || 0) + Math.floor(quantity));
  }
  return Array.from(map.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

function createReturnOrderUseCase({ orderReturnRepository, logger }) {
  if (!orderReturnRepository) throw new Error('ReturnOrder: orderReturnRepository is required');

  return {
    /**
     * @param {{
     *  actor: { id:number, role:string },
     *  orderId:number,
     *  reason?: string,
     *  items?: Array<{productId:number, quantity:number}>
     * }} params
     */
    async execute(params) {
      const actorRole = params.actor?.role || 'unknown';
      if (actorRole !== 'admin' && actorRole !== 'manager') {
        return { ok: false, status: 403, body: { success: false, error: 'FORBIDDEN' } };
      }

      const orderId = Number(params.orderId);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        return { ok: false, status: 400, body: { success: false, error: 'ORDER_ID_INVALID' } };
      }

      const reason = params.reason ? String(params.reason).slice(0, 1000) : null;
      const normalized = params.items ? normalizeItems(params.items) : null;
      if (normalized && normalized.error) {
        return { ok: false, status: 400, body: { success: false, error: normalized.error } };
      }

      try {
        const result = await orderReturnRepository.returnOrderTx({
          orderId,
          actorId: Number(params.actor.id),
          reason,
          items: normalized, // null => full return
        });

        if (result?.notFound) {
          return { ok: false, status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
        }
        if (result?.badRequest) {
          return { ok: false, status: 400, body: { success: false, ...result.badRequest } };
        }
        return {
          ok: true,
          status: 200,
          body: { success: true, return: result.return, delta: result.delta, summary: result.summary },
        };
      } catch (err) {
        if (logger?.error) logger.error('ReturnOrder failed:', err);
        return { ok: false, status: 500, body: { success: false, error: 'RETURN_FAILED' } };
      }
    },
  };
}

module.exports = { createReturnOrderUseCase };

