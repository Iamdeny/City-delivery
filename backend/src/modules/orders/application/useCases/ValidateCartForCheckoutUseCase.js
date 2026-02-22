class ValidateCartForCheckoutUseCase {
  constructor(getCartQuery, syncCartUseCase) {
    this.getCartQuery = getCartQuery;
    this.syncCartUseCase = syncCartUseCase;
    this.MIN_ORDER_AMOUNT = 300; // This can be moved to config or domain rules
  }

  async execute(userId) {
    const cart = await this.getCartQuery.execute(userId);

    if (cart.items.length === 0) {
      throw new Error('EMPTY_CART');
    }

    // Sync cart to get latest prices and availability
    const { cart: syncedCart, hasChanges, priceChanges, unavailableItems } = 
      await this.syncCartUseCase.execute(userId);

    // Validate minimum amount
    if (syncedCart.total < this.MIN_ORDER_AMOUNT) {
      throw new Error('MIN_ORDER_AMOUNT');
    }

    return {
      cart: syncedCart,
      isValid: !hasChanges, // If there are changes, it's not strictly valid for checkout without user review
      hasChanges,
      priceChanges,
      unavailableItems,
      minOrderAmount: this.MIN_ORDER_AMOUNT
    };
  }
}

module.exports = ValidateCartForCheckoutUseCase;