const Cart = require('../../domain/Cart');

class ClearCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId) {
    const cart = await this.cartRepository.getByUserId(userId);
    if (!cart) {
      // If no cart found, nothing to clear, consider it successful or throw
      // For now, let's just create an empty cart and save it if not found.
      const newEmptyCart = new Cart(userId);
      await this.cartRepository.save(newEmptyCart);
      return newEmptyCart;
    }

    cart.clear();
    await this.cartRepository.save(cart);

    return cart;
  }
}

module.exports = ClearCartUseCase;