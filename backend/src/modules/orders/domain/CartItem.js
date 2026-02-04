class CartItem {
  constructor(productId, name, price, quantity, image, darkStoreId) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    this.productId = productId;
    this.name = name;
    this.price = price;
    this.quantity = quantity;
    this.image = image;
    this.darkStoreId = darkStoreId;
    this.subtotal = price * quantity;
  }

  updateQuantity(newQuantity) {
    if (newQuantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    this.quantity = newQuantity;
    this.subtotal = this.price * newQuantity;
  }

  updatePrice(newPrice) {
    this.price = newPrice;
    this.subtotal = this.quantity * newPrice;
  }
}

module.exports = CartItem;