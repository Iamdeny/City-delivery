const CartItem = require('./CartItem');

class Cart {
  constructor(userId, items = [], updatedAt = new Date()) {
    this.userId = userId;
    this.items = items.map(item => new CartItem(
      item.productId, item.name, item.price, item.quantity, item.image, item.darkStoreId
    ));
    this.updatedAt = updatedAt;
    this.recalculateTotal();
  }

  addItem(productVO, quantity) {
    if (!productVO.isAvailable(quantity)) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    const existingItem = this.items.find(item => item.productId === productVO.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (!productVO.isAvailable(newQuantity)) {
        throw new Error('INSUFFICIENT_STOCK');
      }
      existingItem.updateQuantity(newQuantity);
    } else {
      this.items.push(new CartItem(
        productVO.id, productVO.name, productVO.price, quantity, productVO.image, productVO.darkStoreId
      ));
    }
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId);
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  updateItemQuantity(productId, quantity, productVO) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    
    if (!productVO.isAvailable(quantity)) {
      throw new Error('INSUFFICIENT_STOCK');
    }

    const existingItem = this.items.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.updateQuantity(quantity);
    } else {
      // If item not found, could add it or throw error based on desired behavior for update.
      // For now, let's assume it should exist.
      throw new Error('ITEM_NOT_IN_CART');
    }
    this.recalculateTotal();
    this.updatedAt = new Date();
  }
  
  clear() {
    this.items = [];
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  recalculateTotal() {
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  // Domain rule: Check minimum order amount
  validateMinimumAmount(minAmount) {
    if (this.total < minAmount) {
      throw new Error('MIN_ORDER_AMOUNT');
    }
  }

  // Domain rule: Sync prices and availability
  syncPricesAndAvailability(latestProducts) {
    let hasChanges = false;
    const priceChanges = [];
    const unavailableItems = [];

    this.items = this.items.map(item => {
      const latestProduct = latestProducts.find(p => p.id === item.productId);

      if (!latestProduct) {
        unavailableItems.push({ ...item, reason: 'PRODUCT_REMOVED' });
        hasChanges = true;
        return null; // Remove item if product no longer exists
      }

      // Check for price changes
      const newPrice = parseFloat(latestProduct.price);
      if (newPrice !== item.price) {
        priceChanges.push({
          productId: item.productId,
          name: item.name,
          oldPrice: item.price,
          newPrice: newPrice,
          difference: newPrice - item.price
        });
        item.updatePrice(newPrice);
        hasChanges = true;
      }

      // Check for availability changes
      const availableQuantity = latestProduct.stockQuantity - (latestProduct.reservedQuantity || 0);
      if (latestProduct.inStock === false || availableQuantity < item.quantity) {
        unavailableItems.push({ ...item, available: Math.max(0, availableQuantity), reason: 'INSUFFICIENT_STOCK' });
        hasChanges = true;
        if (availableQuantity > 0) {
          item.updateQuantity(availableQuantity); // Adjust quantity to available
        } else {
          return null; // Remove item if completely unavailable
        }
      }
      return item;
    }).filter(item => item !== null);

    this.recalculateTotal();
    this.updatedAt = new Date();
    
    return { hasChanges, priceChanges, unavailableItems, updatedCart: this };
  }

  // Convert to plain object for persistence or API response
  toObject() {
    return {
      userId: this.userId,
      items: this.items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        image: item.image,
        darkStoreId: item.darkStoreId
      })),
      total: this.total,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Cart;