/**
 * CreateOrder use-case (application layer).
 *
 * Depends ONLY on ports injected via constructor.
 */

function createCreateOrderUseCase({
  orderRepository,
  inventoryGateway,
  queuePublisher,
  deliveryZoneService,
  orderDispatcher,
  logger,
}) {
  if (!orderRepository) throw new Error('CreateOrder: orderRepository is required');
  if (!inventoryGateway) throw new Error('CreateOrder: inventoryGateway is required');
  if (!queuePublisher) throw new Error('CreateOrder: queuePublisher is required');
  if (!deliveryZoneService) throw new Error('CreateOrder: deliveryZoneService is required');
  if (!orderDispatcher) throw new Error('CreateOrder: orderDispatcher is required');
  if (!logger) throw new Error('CreateOrder: logger is required');

  return {
    /**
     * @param {{ userId:number, items:Array<{productId:number,quantity:number}>, darkStoreId?:number, address:string, phone:string, comment?:string, latitude?:number, longitude?:number }} input
     */
    async execute(input) {
      const { userId, items, darkStoreId: requestedDarkStoreId, address, phone, comment, latitude, longitude } = input;

      // 1) Delivery zone + store selection
      let zoneCheckResult = null;
      let darkStoreId = null;

      const hasCoords = latitude !== undefined && longitude !== undefined;
      // Dark Store First: without coordinates we can't validate delivery radius.
      if (!hasCoords) {
        return {
          ok: false,
          status: 400,
          body: {
            success: false,
            error: 'COORDINATES_REQUIRED',
            message: 'Для оформления заказа нужны координаты доставки (разрешите геолокацию).',
          },
        };
      }

      zoneCheckResult = await deliveryZoneService.checkDeliveryZone(latitude, longitude);

      if (!zoneCheckResult.available) {
        return {
          ok: false,
          status: 400,
          body: {
            success: false,
            error: 'DELIVERY_UNAVAILABLE',
            message: zoneCheckResult.message || 'Доставка в ваш район недоступна',
            details: zoneCheckResult.details,
          },
        };
      }

      // Explicit store wins (useful for client-side selection + testing)
      if (requestedDarkStoreId !== undefined && requestedDarkStoreId !== null) {
        const isActive = await orderRepository.isStoreActive(requestedDarkStoreId);
        if (!isActive) {
          return {
            ok: false,
            status: 400,
            body: {
              success: false,
              error: 'STORE_NOT_AVAILABLE',
              message: 'Выбранный склад недоступен',
            },
          };
        }
        const deliverable = await orderRepository.isStoreDeliverableForCoords(requestedDarkStoreId, latitude, longitude);
        if (!deliverable) {
          return {
            ok: false,
            status: 400,
            body: {
              success: false,
              error: 'STORE_OUT_OF_RANGE',
              message: 'Выбранный склад не доставляет по вашему адресу',
            },
          };
        }
        darkStoreId = requestedDarkStoreId;
      } else {
        darkStoreId = zoneCheckResult?.store?.id ?? null;
        if (!darkStoreId) {
          return {
            ok: false,
            status: 400,
            body: {
              success: false,
              error: 'STORE_NOT_FOUND',
              message: 'Не удалось выбрать склад для доставки',
            },
          };
        }
      }

      // 2) Reserve inventory
      logger.log(`Резервирование товаров для user ${userId}, склад ${darkStoreId}`);
      const reservation = await inventoryGateway.reserve(items, userId, darkStoreId, 900);

      if (!reservation.success) {
        return {
          ok: false,
          status: 400,
          body: {
            success: false,
            error: reservation.error,
            message: 'Некоторые товары недоступны на складе',
            unavailableItems: reservation.unavailableItems,
          },
        };
      }

      logger.log('✅ Товары зарезервированы:', reservation.reservationIds);

      // 3) Create order transactionally
      let order;
      let total;
      try {
        const created = await orderRepository.createOrderWithItemsTx({
          userId,
          darkStoreId,
          phone,
          address,
          comment,
          latitude,
          longitude,
          items,
        });
        order = created.order;
        total = created.total;
      } catch (err) {
        // rollback reservation
        await inventoryGateway.release(reservation.reservationIds);
        logger.log('⚠️ Резервация отменена из-за ошибки создания заказа');
        throw err;
      }

      // 4) Confirm reservation (stock consumed)
      await inventoryGateway.confirm(reservation.reservationIds, order.id);
      logger.log(`✅ Резервация подтверждена для заказа ${order.id}`);

      // 5) Integration events (async)
      await queuePublisher.addNotification('order_created', userId, {
        orderId: order.id,
        total: order.total,
        itemsCount: items.length,
      }, 'critical');

      await queuePublisher.addAnalytics('order_created', {
        orderId: order.id,
        userId,
        darkStoreId,
        total: order.total,
        itemsCount: items.length,
        hasCoordinates: hasCoords,
      });

      // 6) Dispatch (fire-and-forget)
      orderDispatcher.dispatchOrder(order.id, zoneCheckResult?.store).catch((err) => {
        logger.error('Ошибка диспетчеризации заказа:', err);
      });

      // 7) Response
      const response = {
        success: true,
        orderId: order.id,
        message: 'Заказ успешно создан!',
        order: {
          ...order,
          total,
        },
        reservation: {
          expiresAt: reservation.expiresAt,
          status: 'confirmed',
        },
      };

      if (zoneCheckResult?.warning) {
        response.warning = zoneCheckResult.warning;
        response.deliveryInfo = {
          distance: zoneCheckResult.store?.distance
            ? parseFloat(zoneCheckResult.store.distance).toFixed(1)
            : null,
          estimatedTime: 'Доставка может занять больше времени',
        };
      }

      return { ok: true, status: 201, body: response };
    },
  };
}

module.exports = {
  createCreateOrderUseCase,
};

