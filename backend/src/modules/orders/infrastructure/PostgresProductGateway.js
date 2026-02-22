const ProductGateway = require('../application/ports/ProductGateway');
const ProductValueObject = require('../domain/ProductValueObject');
const { query } = require('../../../config/database'); // Re-using existing database config
const logger = require('../../../utils/logger');

class PostgresProductGateway extends ProductGateway {
  constructor() {
    super();
    this.query = query;
    this.logger = logger;
  }

  async getProductInfo(productId) {
    try {
      const productResult = await this.query(
        `SELECT p.id, p.name, p.price, p.stock_quantity, p.reserved_quantity, 
                p.in_stock, p.image, p.dark_store_id
         FROM products p
         WHERE p.id = $1`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        return null;
      }
      const p = productResult.rows[0];
      return new ProductValueObject(
        p.id,
        p.name,
        parseFloat(p.price),
        p.stock_quantity,
        p.reserved_quantity,
        p.in_stock,
        p.image,
        p.dark_store_id
      );
    } catch (error) {
      this.logger.error(
        `❌ Error getting product ${productId} from Postgres:`,
        error
      );
      throw new Error(`Failed to retrieve product info: ${error.message}`);
    }
  }

  async getProductInfos(productIds) {
    try {
      if (productIds.length === 0) {
        return [];
      }
      const productsResult = await this.query(
        `SELECT id, name, price, stock_quantity, reserved_quantity, in_stock, image, dark_store_id
         FROM products
         WHERE id = ANY($1::int[])`,
        [productIds]
      );

      return productsResult.rows.map(
        (p) =>
          new ProductValueObject(
            p.id,
            p.name,
            parseFloat(p.price),
            p.stock_quantity,
            p.reserved_quantity,
            p.in_stock,
            p.image,
            p.dark_store_id
          )
      );
    } catch (error) {
      this.logger.error(
        `❌ Error getting products ${productIds} from Postgres:`,
        error
      );
      throw new Error(`Failed to retrieve product infos: ${error.message}`);
    }
  }
}

module.exports = PostgresProductGateway;
