const Cart = require('../../domain/Cart');

class UpdateCartItemQuantityUseCase {
  constructor(cartRepository, productGateway) {
    this.cartRepository = cartRepository;
    this.productGateway = productGateway;
  }

  async execute(userId, productId, quantity) {
    let cart = await this.cartRepository.getByUserId(userId);
    if (!cart) {
      throw new Error('CART_NOT_FOUND'); // Or create a new one, depending on business rule
    }

    if (quantity <= 0) {
        cart.removeItem(productId);
        await this.cartRepository.save(cart);
        return cart;
    }

    const productVO = await this.productGateway.getProductInfo(productId);
    if (!productVO) {
        throw new Error('PRODUCT_NOT_FOUND');
    }

    cart.updateItemQuantity(productId, quantity, productVO);
    await this.cartRepository.save(cart);

    return cart;
  }
}

module.exports = UpdateCartItemQuantityUseCase;