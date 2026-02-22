const Cart = require('../../domain/Cart');

class SyncCartUseCase {
  constructor(cartRepository, productGateway, notificationPublisher) {
    this.cartRepository = cartRepository;
    this.productGateway = productGateway;
    this.notificationPublisher = notificationPublisher;
  }

  async execute(userId) {
    const cart = await this.cartRepository.getByUserId(userId);
    if (!cart || cart.items.length === 0) {
      return { cart, hasChanges: false, priceChanges: [], unavailableItems: [] };
    }

    const productIds = cart.items.map(item => item.productId);
    const latestProducts = await this.productGateway.getProductInfos(productIds);

    const { hasChanges, priceChanges, unavailableItems, updatedCart } = 
      cart.syncPricesAndAvailability(latestProducts);

    if (hasChanges) {
      await this.cartRepository.save(updatedCart); // Save the updated cart
      
      // Publish notifications
      if (priceChanges.length > 0) {
        const totalDifference = priceChanges.reduce((sum, ch) => sum + ch.difference, 0);
        if (Math.abs(totalDifference) > 50) { // Threshold for notification
          await this.notificationPublisher.publishCartPriceChanged(userId, priceChanges, totalDifference);
        }
      }
      if (unavailableItems.length > 0) {
        await this.notificationPublisher.publishCartItemsUnavailable(userId, unavailableItems.map(i => i.name));
      }
    }

    return { cart: updatedCart, hasChanges, priceChanges, unavailableItems };
  }
}

module.exports = SyncCartUseCase;