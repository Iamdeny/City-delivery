/**
 * DeliveryZoneService adapter (wraps legacy orderDispatcher.checkDeliveryZone)
 */

function createDeliveryZoneService(orderDispatcher) {
  return {
    checkDeliveryZone: (lat, lng) => orderDispatcher.checkDeliveryZone(lat, lng),
  };
}

module.exports = {
  createDeliveryZoneService,
};

