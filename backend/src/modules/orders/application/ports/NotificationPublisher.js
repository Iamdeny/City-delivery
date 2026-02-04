class NotificationPublisher {
  async publishCartPriceChanged(userId, priceChanges, totalDifference) {
    throw new Error('Method not implemented: publishCartPriceChanged');
  }

  async publishCartItemsUnavailable(userId, items) {
    throw new Error('Method not implemented: publishCartItemsUnavailable');
  }
}

module.exports = NotificationPublisher;