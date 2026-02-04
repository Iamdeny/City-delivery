class ProductValueObject {
  constructor(id, name, price, stockQuantity, reservedQuantity, inStock, image, darkStoreId) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.reservedQuantity = reservedQuantity;
    this.inStock = inStock;
    this.image = image;
    this.darkStoreId = darkStoreId;
  }

  get availableQuantity() {
    return this.stockQuantity - (this.reservedQuantity || 0);
  }

  // Domain rule: Check if product is available for a given quantity
  isAvailable(requestedQuantity) {
    return this.inStock && this.availableQuantity >= requestedQuantity;
  }
}

module.exports = ProductValueObject;