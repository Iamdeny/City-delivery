/**
 * Маршруты для работы с товарами
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const cacheService = require('../services/cacheService'); // ✅ NEW: Redis Cache
const logger = require('../utils/logger');

/**
 * Получение всех товаров
 * GET /api/products?dark_store_id=1&category=Молочные продукты
 */
// Временные моковые данные (если БД не подключена)
const mockProducts = [
  { id: 1, name: 'Молоко 3.2%', price: 89, category: 'Молочные продукты', image: '🥛', in_stock: true, stock_quantity: 100 },
  { id: 2, name: 'Хлеб Бородинский', price: 45, category: 'Хлеб', image: '🍞', in_stock: true, stock_quantity: 50 },
  { id: 3, name: 'Яйца 10 шт', price: 120, category: 'Яйца', image: '🥚', in_stock: true, stock_quantity: 80 },
  { id: 4, name: 'Сыр Российский', price: 350, category: 'Сыры', image: '🧀', in_stock: true, stock_quantity: 30 },
  { id: 5, name: 'Вода 1.5л', price: 60, category: 'Напитки', image: '💧', in_stock: true, stock_quantity: 200 },
  { id: 6, name: 'Колбаса Докторская', price: 280, category: 'Колбасы', image: '🌭', in_stock: true, stock_quantity: 40 },
  { id: 7, name: 'Помидоры', price: 150, category: 'Овощи', image: '🍅', in_stock: true, stock_quantity: 60 },
  { id: 8, name: 'Бананы', price: 90, category: 'Фрукты', image: '🍌', in_stock: true, stock_quantity: 70 },
  { id: 9, name: 'Кофе растворимый', price: 450, category: 'Кофе/Чай', image: '☕', in_stock: true, stock_quantity: 25 },
  { id: 10, name: 'Сахар 1кг', price: 85, category: 'Бакалея', image: '🍚', in_stock: true, stock_quantity: 100 },
];

router.get('/', async (req, res) => {
  try {
    const { dark_store_id, category, search, in_stock } = req.query;
    
    // 1. ✅ Попытка получить из кэша
    const cacheKey = cacheService.getProductsKey({
      category,
      search,
      darkStoreId: dark_store_id,
      inStock: in_stock
    });
    
    const cachedProducts = await cacheService.get(cacheKey);
    if (cachedProducts) {
      logger.log(`📦 Cache HIT: products (${cachedProducts.length} items)`);
      return res.json({ products: cachedProducts });
    }
    
    // 2. Загрузка из БД
    let products = [];
    try {
      let queryText = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (dark_store_id) {
        queryText += ` AND dark_store_id = $${paramIndex}`;
        params.push(dark_store_id);
        paramIndex++;
      }

      if (category) {
        queryText += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (search) {
        queryText += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (in_stock === 'true') {
        queryText += ` AND in_stock = true AND stock_quantity > 0`;
      }

      queryText += ' ORDER BY name ASC';

      const result = await query(queryText, params);
      products = result.rows;
      
      // 3. ✅ Сохранить в кэш (TTL: 5 минут)
      await cacheService.set(cacheKey, products, cacheService.TTL.PRODUCTS);
      logger.log(`✅ Cache SET: products (${products.length} items, TTL: 5min)`);
    } catch (dbError) {
      // Если БД не подключена - используем моковые данные
      // Логируем только один раз при первом запросе (используем статический флаг)
      if (!router._dbWarningLogged) {
        logger.warn('⚠️ БД не подключена, используем моковые данные');
        router._dbWarningLogged = true;
      }
      products = [...mockProducts];
      
      // Применяем фильтры к моковым данным
      if (category) {
        products = products.filter(p => p.category === category);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
        );
      }
      if (in_stock === 'true') {
        products = products.filter(p => p.in_stock && p.stock_quantity > 0);
      }
    }
    
    res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    logger.error('Ошибка получения товаров:', error);
    // Fallback на моковые данные при любой ошибке
    res.json({
      success: true,
      products: mockProducts,
      count: mockProducts.length,
    });
  }
});

/**
 * Рекомендации для корзины (Советуем)
 * GET /api/products/recommendations?exclude=1,2,3&limit=6
 * exclude — id товаров, уже в корзине (через запятую)
 * limit — макс. количество (по умолчанию 6)
 */
router.get('/recommendations', async (req, res) => {
  try {
    const excludeRaw = req.query.exclude;
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const excludeIds = excludeRaw
      ? String(excludeRaw).split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isInteger(n) && n > 0)
      : [];

    let products = [];
    try {
      let queryText = 'SELECT * FROM products WHERE in_stock = true AND (stock_quantity IS NULL OR stock_quantity > 0)';
      const params = [];
      let paramIndex = 1;

      if (excludeIds.length > 0) {
        queryText += ` AND id NOT IN (${excludeIds.map((_, i) => `$${paramIndex + i}`).join(',')})`;
        params.push(...excludeIds);
        paramIndex += excludeIds.length;
      }

      queryText += ' ORDER BY RANDOM() LIMIT $' + paramIndex;
      params.push(limit);

      const result = await query(queryText, params);
      products = result.rows;
    } catch (dbError) {
      products = [...mockProducts]
        .filter(p => !excludeIds.includes(p.id))
        .filter(p => p.in_stock)
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
    }

    res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error) {
    logger.error('Ошибка получения рекомендаций:', error);
    res.json({ success: true, products: [], count: 0 });
  }
});

/**
 * Получение товара по ID
 */
router.get('/:id', async (req, res) => {
  try {
    let product = null;
    try {
      const result = await query(
        'SELECT * FROM products WHERE id = $1',
        [req.params.id]
      );
      if (result.rows.length > 0) {
        product = result.rows[0];
      }
    } catch (dbError) {
      // Fallback на моковые данные
      product = mockProducts.find(p => p.id === parseInt(req.params.id));
    }

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    logger.error('Ошибка получения товара:', error);
    res.status(500).json({ error: 'Ошибка получения товара' });
  }
});

/**
 * Получение всех категорий
 */
router.get('/categories/list', async (req, res) => {
  try {
    let categories = [];
    try {
      const { dark_store_id } = req.query;
      
      let queryText = 'SELECT DISTINCT category FROM products WHERE 1=1';
      const params = [];

      if (dark_store_id) {
        queryText += ' AND dark_store_id = $1';
        params.push(dark_store_id);
      }

      queryText += ' ORDER BY category ASC';

      const result = await query(queryText, params);
      categories = result.rows.map(row => row.category);
    } catch (dbError) {
      // Fallback на моковые данные
      categories = [...new Set(mockProducts.map(p => p.category))].sort();
    }
    
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    logger.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

/**
 * Получение товаров по категориям (с группировкой)
 */
router.get('/categories/grouped', async (req, res) => {
  try {
    const { dark_store_id } = req.query;
    
    let queryText = `
      SELECT 
        category,
        json_agg(
          json_build_object(
            'id', id,
            'name', name,
            'price', price,
            'image', image,
            'in_stock', in_stock,
            'stock_quantity', stock_quantity
          ) ORDER BY name
        ) as products
      FROM products
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (dark_store_id) {
      queryText += ` AND dark_store_id = $${paramIndex}`;
      params.push(dark_store_id);
      paramIndex++;
    }

    queryText += ' GROUP BY category ORDER BY category ASC';

    const result = await query(queryText, params);
    
    res.json({
      success: true,
      categories: result.rows,
    });
  } catch (error) {
    logger.error('Ошибка получения товаров по категориям:', error);
    res.status(500).json({ error: 'Ошибка получения товаров' });
  }
});

module.exports = router;

