/**
 * JSDoc type definitions for Orders module (ports and DTOs).
 * No runtime exports — used only for type checking and IDE hints.
 *
 * @module orders/application/ports
 */

/* eslint-disable no-unused-vars */

// ----- CreateOrder -----

/**
 * @typedef {Object} CreateOrderItem
 * @property {number} productId
 * @property {number} quantity
 */

/**
 * @typedef {Object} CreateOrderInput
 * @property {number} userId
 * @property {CreateOrderItem[]} items
 * @property {number} [darkStoreId]
 * @property {string} address
 * @property {string} phone
 * @property {string} [comment]
 * @property {number} [latitude]
 * @property {number} [longitude]
 */

/**
 * @typedef {{ ok: false, status: number, body: Object }} CreateOrderErrorResult
 * @typedef {{ ok: true, status: 201, body: Object }} CreateOrderSuccessResult
 * @typedef {CreateOrderErrorResult | CreateOrderSuccessResult} CreateOrderResult
 */

// ----- UpdateOrderStatus -----

/**
 * @typedef {Object} UpdateOrderStatusInput
 * @property {{ id: number, role: string }} actor
 * @property {number} orderId
 * @property {string} nextStatus
 * @property {boolean} [force]
 */

/**
 * @typedef {{ ok: boolean, status: number, body: Object }} UpdateOrderStatusResult
 */

// ----- ReturnOrder -----

/**
 * @typedef {Object} ReturnOrderInput
 * @property {{ id: number, role: string }} actor
 * @property {number} orderId
 * @property {string} [reason]
 * @property {Array<{productId: number, quantity: number}>} [items]
 */

/**
 * @typedef {{ ok: boolean, status: number, body: Object }} ReturnOrderResult
 */

// ----- AssignCourierToOrder -----

/**
 * @typedef {Object} AssignCourierToOrderInput
 * @property {{ id: number, role: string }} actor
 * @property {number} orderId
 * @property {number|null} courierId - user id (users.id)
 */

/**
 * @typedef {{ ok: boolean, status: number, body: Object }} AssignCourierToOrderResult
 */

// ----- ListOrdersByStore -----

/**
 * @typedef {Object} ListOrdersByStoreInput
 * @property {number} darkStoreId
 * @property {string} [status]
 * @property {string} [q]
 * @property {number} [limit]
 * @property {number} [offset]
 */

// ----- ListLiveOrders -----

/**
 * @typedef {Object} ListLiveOrdersInput
 * @property {number} [darkStoreId]
 * @property {'new'|'active'|'completed'|'all'} [tab]
 * @property {boolean} [needsCourier]
 * @property {boolean} [problematic]
 * @property {string} [q]
 * @property {number} [limit]
 * @property {number} [offset]
 */

// ----- Port: OrderRepository -----

/**
 * @typedef {Object} OrderRepository
 * @property {function(number): Promise<boolean>} isStoreActive
 * @property {function(): Promise<number|null>} getAnyActiveStoreId
 * @property {function(number, number, number): Promise<boolean>} isStoreDeliverableForCoords
 * @property {function(CreateOrderTxParams): Promise<{order: Object, total: number}>} createOrderWithItemsTx
 */

/**
 * @typedef {Object} CreateOrderTxParams
 * @property {number} userId
 * @property {number} darkStoreId
 * @property {string} phone
 * @property {string} address
 * @property {string} [comment]
 * @property {number} [latitude]
 * @property {number} [longitude]
 * @property {CreateOrderItem[]} items
 */

// ----- Port: InventoryGateway -----

/**
 * @typedef {Object} ReserveResult
 * @property {boolean} success
 * @property {string} [error]
 * @property {number[]} [reservationIds]
 * @property {string} [expiresAt]
 * @property {Array<{productId?: number, reason?: string}>} [unavailableItems]
 */

/**
 * @typedef {Object} InventoryGateway
 * @property {function(CreateOrderItem[], number, number, number): Promise<ReserveResult>} reserve - (items, userId, darkStoreId, ttlSeconds)
 * @property {function(number[], number): Promise<{success: boolean, error?: string}>} confirm - (reservationIds, orderId)
 * @property {function(number[]): Promise<{success: boolean, error?: string}>} release - (reservationIds)
 * @property {function(number): Promise<{success: boolean, error?: string}>} cancelOrder - (orderId)
 */

// ----- Port: QueuePublisher -----

/**
 * @typedef {Object} QueuePublisher
 * @property {function(string, number, Object, string): Promise<void>} addNotification - (type, userId, payload, priority)
 * @property {function(string, Object): Promise<void>} addAnalytics - (type, payload)
 */

// ----- Port: DeliveryZoneService -----

/**
 * @typedef {Object} DeliveryZoneCheckResult
 * @property {boolean} available
 * @property {string} [message]
 * @property {Object} [details]
 * @property {Object} [store] - { id, distance, ... }
 * @property {string} [warning]
 */

/**
 * @typedef {Object} DeliveryZoneService
 * @property {function(number, number): Promise<DeliveryZoneCheckResult>} checkDeliveryZone - (latitude, longitude)
 */

module.exports = {};
