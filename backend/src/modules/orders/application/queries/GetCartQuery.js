const Cart = require('../../domain/Cart');

class GetCartQuery {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId) {
    let cart = await this.cartRepository.getByUserId(userId);
    if (!cart) {
      // If no cart found, create an empty one (domain logic)
      cart = new Cart(userId);
      await this.cartRepository.save(cart); // Persist the new empty cart
    }
    return cart; // Return domain object
  }
}

module.exports = GetCartQuery;