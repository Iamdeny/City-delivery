/**
 * Orders module (facade)
 * Includes ordering flow: orders, cart, checkout, tracking (currently grouped).
 *
 * Boundaries (target state):
 * - Orders module owns order creation/state transitions.
 * - It may call Inventory via an application port (InventoryGateway).
 * - It must not import inventory infrastructure directly.
 */

const cartRouter = require('../../routes/cart');
const checkoutRouter = require('../../routes/checkout');
const trackingRouter = require('../../routes/tracking');
const orderDispatcher = require('../../services/orderDispatcher');
const { createOrdersRouter } = require('./interfaces/http/orders.router');
const { createCreateOrderUseCase } = require('./application/useCases/CreateOrder');
const { createReturnOrderUseCase } = require('./application/useCases/ReturnOrder');
const { createUpdateOrderStatusUseCase } = require('./application/useCases/UpdateOrderStatus');
const { createAssignCourierToOrderUseCase } = require('./application/useCases/AssignCourierToOrder');
const { createGetReturnSummary } = require('./application/queries/GetReturnSummary');
const { createListOrdersByStore } = require('./application/queries/ListOrdersByStore');
const { createListLiveOrders } = require('./application/queries/ListLiveOrders');
const { createOrderRepositoryPg } = require('./infrastructure/postgres/orderRepositoryPg');
const { createOrderQueryRepositoryPg } = require('./infrastructure/postgres/orderQueryRepositoryPg');
const { createOrderStatusRepositoryPg } = require('./infrastructure/postgres/orderStatusRepositoryPg');
const { createOrderCourierRepositoryPg } = require('./infrastructure/postgres/orderCourierRepositoryPg');
const { createOrderReturnRepositoryPg } = require('./infrastructure/postgres/orderReturnRepositoryPg');
const { createQueuePublisher } = require('./infrastructure/queue/queuePublisher');
const { createDeliveryZoneService } = require('./infrastructure/delivery/deliveryZoneService');
const logger = require('../../utils/logger');
const { createAdminOrdersRouter } = require('./interfaces/http/adminOrders.router');

function createOrdersModule({ inventoryGateway, queueService, auditLogger }) {
  const orderRepository = createOrderRepositoryPg();
  const orderQueryRepository = createOrderQueryRepositoryPg();
  const orderStatusRepository = createOrderStatusRepositoryPg();
  const orderReturnRepository = createOrderReturnRepositoryPg();
  const queuePublisher = createQueuePublisher(queueService);
  const deliveryZoneService = createDeliveryZoneService(orderDispatcher);

  const createOrderUseCase = createCreateOrderUseCase({
    orderRepository,
    inventoryGateway,
    queuePublisher,
    deliveryZoneService,
    orderDispatcher,
    logger,
  });

  const listOrdersByStore = createListOrdersByStore({ orderQueryRepository });
  const updateOrderStatusUseCase = createUpdateOrderStatusUseCase({ orderStatusRepository, inventoryGateway, logger });
  const returnOrderUseCase = createReturnOrderUseCase({ orderReturnRepository, logger });
  const getReturnSummary = createGetReturnSummary({ orderReturnRepository });
  const ordersRouter = createOrdersRouter({
    createOrderUseCase,
    listOrdersByStore,
    updateOrderStatusUseCase,
    returnOrderUseCase,
    getReturnSummary,
    auditLogger,
  });

  return {
    ordersRouter,
  };
}

module.exports = {
  createOrdersModule,
  cartRouter,
  checkoutRouter,
  trackingRouter,
  createAdminOrdersRouter: ({ inventoryGateway, queueService, auditLogger } = {}) => {
    // Live dashboard + lightweight ops writes (assign courier).
    const orderQueryRepository = createOrderQueryRepositoryPg();
    const listLiveOrders = createListLiveOrders({ orderQueryRepository });

    const orderCourierRepository = createOrderCourierRepositoryPg();
    const assignCourierToOrder = createAssignCourierToOrderUseCase({ orderCourierRepository, auditLogger, logger });

    return createAdminOrdersRouter({ listLiveOrders, assignCourierToOrder, auditLogger });
  },
};

