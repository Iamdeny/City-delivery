const NotificationPublisher = require('../application/ports/NotificationPublisher');
const queueService = require('../../../services/queueService'); // Re-using existing queueService
const logger = require('../../../utils/logger');

class QueueNotificationPublisher extends NotificationPublisher {
  constructor() {
    super();
    this.queueService = queueService;
    this.logger = logger;
  }

  async publishCartPriceChanged(userId, priceChanges, totalDifference) {
    try {
      await this.queueService.addNotification('cart_price_changed', userId, {
        priceChanges,
        totalDifference: totalDifference.toFixed(2),
      });
      this.logger.log(
        `🔔 Cart price change notification published for user ${userId}`
      );
    } catch (error) {
      this.logger.error(
        '❌ Error publishing cart price change notification:',
        error
      );
      throw new Error(
        `Failed to publish price change notification: ${error.message}`
      );
    }
  }

  async publishCartItemsUnavailable(userId, items) {
    try {
      await this.queueService.addNotification(
        'cart_items_unavailable',
        userId,
        {
          items: items,
        }
      );
      this.logger.log(
        `🔔 Cart items unavailable notification published for user ${userId}`
      );
    } catch (error) {
      this.logger.error(
        '❌ Error publishing cart items unavailable notification:',
        error
      );
      throw new Error(
        `Failed to publish items unavailable notification: ${error.message}`
      );
    }
  }
}

module.exports = QueueNotificationPublisher;
