const ProductValueObject = require('../../domain/ProductValueObject');

class ProductGateway {
  /**
   * Fetches product information needed for cart operations.
   * @param {number} productId
   * @returns {Promise<ProductValueObject|null>}
   */
  async getProductInfo(productId) {
    throw new Error('Method not implemented: getProductInfo');
  }

  /**
   * Fetches product information for multiple products needed for cart synchronization.
   * @param {number[]} productIds
   * @returns {Promise<ProductValueObject[]>}
   */
  async getProductInfos(productIds) {
    throw new Error('Method not implemented: getProductInfos');
  }
}

module.exports = ProductGateway;
