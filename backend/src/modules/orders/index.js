/**
 * Orders module (facade)
 * Includes ordering flow: orders, cart, checkout, tracking (currently grouped).
 *
 * Boundaries (target state):
 * - Orders module owns order creation/state transitions.
 * - It may call Inventory via an application port (InventoryGateway).
 * - It must not import inventory infrastructure directly.
 */

const { createOrdersRouter } = require('./interfaces/http/orders.router');
const {
  createCreateOrderUseCase,
} = require('./application/useCases/CreateOrder');
const {
  createReturnOrderUseCase,
} = require('./application/useCases/ReturnOrder');
const {
  createUpdateOrderStatusUseCase,
} = require('./application/useCases/UpdateOrderStatus');
const {
  createAssignCourierToOrderUseCase,
} = require('./application/useCases/AssignCourierToOrder');
const {
  createGetReturnSummary,
} = require('./application/queries/GetReturnSummary');
const {
  createListOrdersByStore,
} = require('./application/queries/ListOrdersByStore');
const {
  createListLiveOrders,
} = require('./application/queries/ListLiveOrders');
const {
  createOrderRepositoryPg,
} = require('./infrastructure/postgres/orderRepositoryPg');
const {
  createOrderQueryRepositoryPg,
} = require('./infrastructure/postgres/orderQueryRepositoryPg');
const {
  createOrderStatusRepositoryPg,
} = require('./infrastructure/postgres/orderStatusRepositoryPg');
const {
  createOrderCourierRepositoryPg,
} = require('./infrastructure/postgres/orderCourierRepositoryPg');
const {
  createOrderReturnRepositoryPg,
} = require('./infrastructure/postgres/orderReturnRepositoryPg');
const {
  createQueuePublisher,
} = require('./infrastructure/queue/queuePublisher');
const {
  createDeliveryZoneService,
} = require('./infrastructure/delivery/deliveryZoneService');
const logger = require('../../utils/logger');
const {
  createAdminOrdersRouter,
} = require('./interfaces/http/adminOrders.router');

// New Cart Module Imports
const { createCartRouter } = require('./interfaces/http/cart.router');
const { createCheckoutRouter } = require('./interfaces/http/checkout.router');
const { createTrackingRouter } = require('./interfaces/http/tracking.router');

const GetCartQuery = require('./application/queries/GetCartQuery');
const AddItemToCartUseCase = require('./application/useCases/AddItemToCartUseCase');
const UpdateCartItemQuantityUseCase = require('./application/useCases/UpdateCartItemQuantityUseCase');
const RemoveItemFromCartUseCase = require('./application/useCases/RemoveItemFromCartUseCase');
const ClearCartUseCase = require('./application/useCases/ClearCartUseCase');
const SyncCartUseCase = require('./application/useCases/SyncCartUseCase');
const ValidateCartForCheckoutUseCase = require('./application/useCases/ValidateCartForCheckoutUseCase');

const RedisCartRepository = require('./infrastructure/RedisCartRepository');
const PostgresProductGateway = require('./infrastructure/PostgresProductGateway');
const QueueNotificationPublisher = require('./infrastructure/QueueNotificationPublisher');

// Legacy Services (Temporary Injection)
const checkoutService = require('../../services/checkoutService');
const trackingService = require('../../services/trackingService');

function createOrdersModule({
  inventoryGateway,
  queueService,
  auditLogger,
  orderDispatcher,
}) {
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
  const updateOrderStatusUseCase = createUpdateOrderStatusUseCase({
    orderStatusRepository,
    inventoryGateway,
    logger,
  });
  const returnOrderUseCase = createReturnOrderUseCase({
    orderReturnRepository,
    logger,
  });
  const getReturnSummary = createGetReturnSummary({ orderReturnRepository });
  const ordersRouter = createOrdersRouter({
    createOrderUseCase,
    listOrdersByStore,
    updateOrderStatusUseCase,
    returnOrderUseCase,
    getReturnSummary,
    auditLogger,
  });

  // Cart Module Dependencies and Initialization
  const cartRepository = new RedisCartRepository();
  const productGateway = new PostgresProductGateway();
  const notificationPublisher = new QueueNotificationPublisher();

  const getCartQuery = new GetCartQuery(cartRepository);
  const addItemToCartUseCase = new AddItemToCartUseCase(
    cartRepository,
    productGateway
  );
  const updateCartItemQuantityUseCase = new UpdateCartItemQuantityUseCase(
    cartRepository,
    productGateway
  );
  const removeItemFromCartUseCase = new RemoveItemFromCartUseCase(
    cartRepository
  );
  const clearCartUseCase = new ClearCartUseCase(cartRepository);
  const syncCartUseCase = new SyncCartUseCase(
    cartRepository,
    productGateway,
    notificationPublisher
  );
  const validateCartForCheckoutUseCase = new ValidateCartForCheckoutUseCase(
    getCartQuery,
    syncCartUseCase
  );

  const newCartRouter = createCartRouter({
    getCartQuery,
    addItemToCartUseCase,
    updateCartItemQuantityUseCase,
    removeItemFromCartUseCase,
    clearCartUseCase,
    syncCartUseCase,
    validateCartForCheckoutUseCase,
    authenticate: require('../../middleware/auth').authenticate,
    logger: require('../../utils/logger'),
  });

  const newCheckoutRouter = createCheckoutRouter({
    checkoutService,
    authenticate: require('../../middleware/auth').authenticate,
    requireRole: require('../../middleware/auth').requireRole,
    logger: require('../../utils/logger'),
  });

  const newTrackingRouter = createTrackingRouter({
    trackingService,
    authenticate: require('../../middleware/auth').authenticate,
    requireRole: require('../../middleware/auth').requireRole,
  });

  return {
    ordersRouter,
    cartRouter: newCartRouter,
    checkoutRouter: newCheckoutRouter,
    trackingRouter: newTrackingRouter,
  };
}

module.exports = {
  createOrdersModule,
  createAdminOrdersRouter: ({
    inventoryGateway,
    queueService,
    auditLogger,
  } = {}) => {
    // Live dashboard + lightweight ops writes (assign courier).
    const orderQueryRepository = createOrderQueryRepositoryPg();
    const listLiveOrders = createListLiveOrders({ orderQueryRepository });

    const orderCourierRepository = createOrderCourierRepositoryPg();
    const assignCourierToOrder = createAssignCourierToOrderUseCase({
      orderCourierRepository,
      auditLogger,
      logger,
    });

    return createAdminOrdersRouter({
      listLiveOrders,
      assignCourierToOrder,
      auditLogger,
    });
  },
};
