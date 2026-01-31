/**
 * InventoryGateway adapter (temporary).
 *
 * This adapter lives in the inventory module boundary and exposes
 * the minimal API orders needs (reserve/confirm/release).
 *
 * Today it wraps the legacy `src/services/inventoryService`.
 * Later we will move the implementation behind inventory application/use-cases.
 */

const inventoryService = require('../../../services/inventoryService');
const { metrics } = require('../../../utils/metrics');

function createInventoryGateway() {
  return {
    reserve: (items, userId, darkStoreId, ttlSeconds) =>
      metrics.timeOp('inventory.reserve', async () => {
        const result = await inventoryService.reserve(items, userId, darkStoreId, ttlSeconds);
        if (result?.success) {
          metrics.inc('inventory.reserve.ok', { darkStoreId });
        } else {
          metrics.inc('inventory.reserve.fail', {
            darkStoreId,
            error: result?.error || 'UNKNOWN',
          });
          if (Array.isArray(result?.unavailableItems)) {
            for (const item of result.unavailableItems) {
              metrics.inc('inventory.reserve.unavailable', {
                darkStoreId,
                reason: item?.reason || 'UNKNOWN',
              });
            }
          }
        }
        return result;
      }),
    confirm: (reservationIds, orderId) =>
      metrics.timeOp('inventory.confirm', async () => {
        const result = await inventoryService.confirm(reservationIds, orderId);
        if (result?.success) {
          metrics.inc('inventory.confirm.ok');
        } else {
          metrics.inc('inventory.confirm.fail', { error: result?.error || 'UNKNOWN' });
        }
        return result;
      }),
    release: (reservationIds) =>
      metrics.timeOp('inventory.release', async () => {
        const result = await inventoryService.release(reservationIds);
        if (result?.success) {
          metrics.inc('inventory.release.ok');
        } else {
          metrics.inc('inventory.release.fail', { error: result?.error || 'UNKNOWN' });
        }
        return result;
      }),

    cancelOrder: (orderId) =>
      metrics.timeOp('inventory.cancelOrder', async () => {
        const result = await inventoryService.cancelOrder(orderId);
        if (result?.success) {
          metrics.inc('inventory.cancelOrder.ok');
        } else {
          metrics.inc('inventory.cancelOrder.fail', { error: result?.error || 'UNKNOWN' });
        }
        return result;
      }),
  };
}

module.exports = {
  createInventoryGateway,
};

