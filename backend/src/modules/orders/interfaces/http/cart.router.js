const express = require('express');
const router = express.Router();

module.exports = {
  createCartRouter: ({
    getCartQuery,
    addItemToCartUseCase,
    updateCartItemQuantityUseCase,
    removeItemFromCartUseCase,
    clearCartUseCase,
    syncCartUseCase,
    validateCartForCheckoutUseCase,
    authenticate,
    logger,
  }) => {
    // @TODO: Add Zod validation here instead of simple checks

    /**
     * @swagger
     * tags:
     *   name: Cart
     *   description: Управление корзиной пользователя
     */

    /**
     * @swagger
     * /api/cart:
     *   get:
     *     summary: Получить корзину пользователя
     *     tags: [Cart]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Успешное получение корзины
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.get('/', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const cart = await getCartQuery.execute(userId);
        res.json({ success: true, cart: cart.toObject() });
      } catch (error) {
        logger.error('Error getting cart:', error);
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
      }
    });

    /**
     * @swagger
     * /api/cart/items:
     *   post:
     *     summary: Добавить товар в корзину
     *     tags: [Cart]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - productId
     *             properties:
     *               productId:
     *                 type: integer
     *                 description: ID товара
     *               quantity:
     *                 type: integer
     *                 default: 1
     *                 description: Количество товара
     *               darkStoreId:
     *                 type: integer
     *                 nullable: true
     *                 description: ID даркстора (если применимо)
     *     responses:
     *       200:
     *         description: Товар успешно добавлен
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.post('/items', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const { productId, quantity = 1, darkStoreId } = req.body;

        if (!productId) {
          return res
            .status(400)
            .json({ success: false, error: 'productId is required' });
        }

        // Add validation for quantity if needed (e.g., must be positive)

        const cart = await addItemToCartUseCase.execute(
          userId,
          productId,
          quantity,
          darkStoreId
        );
        res.json({ success: true, cart: cart.toObject() });
      } catch (error) {
        logger.error('Error adding item to cart:', error);
        if (
          error.message === 'PRODUCT_NOT_FOUND' ||
          error.message === 'INSUFFICIENT_STOCK' ||
          error.message === 'PRODUCT_NOT_AVAILABLE_IN_DARK_STORE'
        ) {
          return res.status(400).json({ success: false, error: error.message });
        }
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
      }
    });

    /**
     * @swagger
     * /api/cart/items/{productId}:
     *   put:
     *     summary: Обновить количество товара в корзине
     *     tags: [Cart]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: productId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID товара
     *       - in: body
     *         name: body
     *         description: Новое количество товара
     *         required: true
     *         schema:
     *           type: object
     *           properties:
     *             quantity:
     *               type: integer
     *               description: Новое количество товара. 0 для удаления.
     *     responses:
     *       200:
     *         description: Количество товара успешно обновлено
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       404:
     *         description: Товар или корзина не найдены
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.put('/items/:productId', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const productId = parseInt(req.params.productId);
        const { quantity } = req.body;

        if (quantity === undefined || quantity === null) {
          return res
            .status(400)
            .json({ success: false, error: 'quantity is required' });
        }
        // Add validation for quantity (e.g., must be non-negative)

        const cart = await updateCartItemQuantityUseCase.execute(
          userId,
          productId,
          quantity
        );
        res.json({ success: true, cart: cart.toObject() });
      } catch (error) {
        logger.error('Error updating item quantity:', error);
        if (
          error.message === 'CART_NOT_FOUND' ||
          error.message === 'ITEM_NOT_IN_CART' ||
          error.message === 'PRODUCT_NOT_FOUND' ||
          error.message === 'INSUFFICIENT_STOCK'
        ) {
          return res.status(400).json({ success: false, error: error.message });
        }
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
      }
    });

    /**
     * @swagger
     * /api/cart/items/{productId}:
     *   delete:
     *     summary: Удалить товар из корзины
     *     tags: [Cart]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: productId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID товара
     *     responses:
     *       200:
     *         description: Товар успешно удален
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       404:
     *         description: Товар или корзина не найдены
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.delete('/items/:productId', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const productId = parseInt(req.params.productId);

        const cart = await removeItemFromCartUseCase.execute(userId, productId);
        res.json({ success: true, cart: cart.toObject() });
      } catch (error) {
        logger.error('Error removing item from cart:', error);
        if (
          error.message === 'CART_NOT_FOUND' ||
          error.message === 'ITEM_NOT_IN_CART'
        ) {
          return res.status(400).json({ success: false, error: error.message });
        }
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
      }
    });

    /**
     * @swagger
     * /api/cart:
     *   delete:
     *     summary: Очистить корзину
     *     tags: [Cart]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Корзина успешно очищена
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.delete('/', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const cart = await clearCartUseCase.execute(userId);
        res.json({ success: true, cart: cart.toObject() });
      } catch (error) {
        logger.error('Error clearing cart:', error);
        if (error.message === 'CART_NOT_FOUND') {
          // Though current clear logic creates empty cart if not found
          return res.status(400).json({ success: false, error: error.message });
        }
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
      }
    });

    /**
     * @swagger
     * /api/cart/validate:
     *   post:
     *     summary: Валидировать корзину перед оформлением заказа
     *     tags: [Cart]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Корзина валидна для оформления заказа
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *                 isValid:
     *                   type: boolean
     *                   description: true, если корзина полностью валидна (без изменений)
     *                 hasChanges:
     *                   type: boolean
     *                   description: true, если были изменения в ценах или наличии
     *                 priceChanges:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       productId: { type: integer }
     *                       name: { type: string }
     *                       oldPrice: { type: number }
     *                       newPrice: { type: number }
     *                       difference: { type: number }
     *                 unavailableItems:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       productId: { type: integer }
     *                       name: { type: string }
     *                       available: { type: integer }
     *                       reason: { type: string }
     *                 minOrderAmount:
     *                   type: number
     *       202:
     *         description: Корзина имеет изменения (цены, наличие), требуется подтверждение пользователя
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *                 isValid:
     *                   type: boolean
     *                   description: всегда false при 202
     *                 hasChanges:
     *                   type: boolean
     *                   description: всегда true при 202
     *                 priceChanges:
     *                   type: array
     *                   items:
     *                     type: object
     *                 unavailableItems:
     *                   type: array
     *                   items:
     *                     type: object
     *                 minOrderAmount:
     *                   type: number
     *       400:
     *         $ref: '#/components/responses/BadRequest'
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.post('/validate', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const validationResult = await validateCartForCheckoutUseCase.execute(
          userId
        );

        if (validationResult.hasChanges) {
          // Return 202 if there are changes for user review
          return res
            .status(202)
            .json({
              success: true,
              ...validationResult,
              cart: validationResult.cart.toObject(),
            });
        }

        res.json({
          success: true,
          ...validationResult,
          cart: validationResult.cart.toObject(),
        });
      } catch (error) {
        logger.error('Error validating cart:', error);
        if (
          error.message === 'EMPTY_CART' ||
          error.message === 'MIN_ORDER_AMOUNT'
        ) {
          return res.status(400).json({ success: false, error: error.message });
        }
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
      }
    });

    /**
     * @swagger
     * /api/cart/sync:
     *   post:
     *     summary: Синхронизировать цены и наличие товаров в корзине (Smart Cart)
     *     tags: [Cart]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Корзина синхронизирована
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 cart:
     *                   $ref: '#/components/schemas/Cart'
     *                 hasChanges:
     *                   type: boolean
     *                   description: true, если были изменения в ценах или наличии
     *                 priceChanges:
     *                   type: array
     *                   items:
     *                     type: object
     *                 unavailableItems:
     *                   type: array
     *                   items:
     *                     type: object
     *       401:
     *         $ref: '#/components/responses/UnauthorizedError'
     *       500:
     *         $ref: '#/components/responses/InternalServerError'
     */
    router.post('/sync', authenticate, async (req, res) => {
      try {
        const userId = req.user.id;
        const syncResult = await syncCartUseCase.execute(userId);
        res.json({
          success: true,
          ...syncResult,
          cart: syncResult.cart.toObject(),
        });
      } catch (error) {
        logger.error('Error syncing cart:', error);
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
      }
    });

    return router;
  },
};
