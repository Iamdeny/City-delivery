/**
 * DeliveryZoneService adapter (wraps legacy orderDispatcher.checkDeliveryZone).
 * Implements port used by CreateOrder use-case.
 *
 * @param {Object} orderDispatcher - checkDeliveryZone(lat, lng)
 * @returns {import('../../application/ports').DeliveryZoneService}
 */
function createDeliveryZoneService(orderDispatcher) {
  return {
    checkDeliveryZone: (lat, lng) => orderDispatcher.checkDeliveryZone(lat, lng),
  };
}

module.exports = {
  createDeliveryZoneService,
};

