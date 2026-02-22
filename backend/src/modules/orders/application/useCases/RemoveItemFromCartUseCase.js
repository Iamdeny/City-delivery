const Cart = require('../../domain/Cart');

class RemoveItemFromCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId, productId) {
    const cart = await this.cartRepository.getByUserId(userId);
    if (!cart) {
      throw new Error('CART_NOT_FOUND');
    }

    cart.removeItem(productId);
    await this.cartRepository.save(cart);

    return cart;
  }
}

module.exports = RemoveItemFromCartUseCase;