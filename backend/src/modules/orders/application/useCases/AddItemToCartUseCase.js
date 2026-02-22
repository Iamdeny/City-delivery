const Cart = require('../../domain/Cart');

class AddItemToCartUseCase {
  constructor(cartRepository, productGateway) {
    this.cartRepository = cartRepository;
    this.productGateway = productGateway;
  }

  async execute(userId, productId, quantity, darkStoreId) {
    const productVO = await this.productGateway.getProductInfo(productId);

    if (!productVO) {
      throw new Error('PRODUCT_NOT_FOUND');
    }
    // We can also check darkStoreId match here if productVO has that info
    if (darkStoreId && productVO.darkStoreId && productVO.darkStoreId !== darkStoreId) {
        throw new Error('PRODUCT_NOT_AVAILABLE_IN_DARK_STORE');
    }

    let cart = await this.cartRepository.getByUserId(userId);
    if (!cart) {
      cart = new Cart(userId);
    }

    cart.addItem(productVO, quantity);
    await this.cartRepository.save(cart);

    return cart;
  }
}

module.exports = AddItemToCartUseCase;