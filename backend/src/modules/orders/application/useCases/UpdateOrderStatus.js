/**
 * UpdateOrderStatus (application use-case)
 *
 * Enforces basic state machine for order statuses.
 * Admin is allowed to override (force) transitions.
 */

const TERMINAL = new Set(['delivered', 'cancelled']);

const ALLOWED_TRANSITIONS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['picking', 'cancelled'],
  picking: ['ready', 'cancelled'],
  ready: ['assigned_to_courier', 'cancelled'],
  assigned_to_courier: ['picked_up', 'cancelled'],
  picked_up: ['delivering', 'cancelled'],
  delivering: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const ROLE_ALLOWED_TARGETS = {
  picker: new Set(['preparing', 'picking', 'ready', 'cancelled']),
  courier: new Set(['picked_up', 'delivering', 'delivered']),
  customer: new Set(['cancelled']),
  admin: null, // any
  manager: null, // any (ops)
};

const CUSTOMER_CANCEL_ALLOWED_FROM = new Set(['pending', 'preparing', 'picking', 'ready']);
const INVENTORY_CANCEL_ALLOWED_FROM = new Set(['pending', 'preparing', 'picking', 'ready', 'assigned_to_courier']);
const AFTER_PICKUP = new Set(['picked_up', 'delivering']);

function createUpdateOrderStatusUseCase({ orderStatusRepository, inventoryGateway, logger }) {
  if (!orderStatusRepository) throw new Error('UpdateOrderStatus: orderStatusRepository is required');

  return {
    /**
     * @param {{
     *  actor: { id:number, role:string },
     *  orderId: number,
     *  nextStatus: string,
     *  force?: boolean
     * }} params
     */
    async execute(params) {
      const orderId = Number(params.orderId);
      const nextStatus = String(params.nextStatus);
      const actorRole = params.actor?.role || 'unknown';
      const force = Boolean(params.force);
      const actorId = Number(params.actor?.id);

      const current = await orderStatusRepository.getById(orderId);
      if (!current) {
        return { ok: false, status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
      }

      const from = current.status;
      const to = nextStatus;

      if (!ALLOWED_TRANSITIONS[to] || !ALLOWED_TRANSITIONS[from]) {
        return {
          ok: false,
          status: 400,
          body: { success: false, error: 'UNKNOWN_STATUS', from, to },
        };
      }

      if (TERMINAL.has(from) && from !== to) {
        return {
          ok: false,
          status: 400,
          body: { success: false, error: 'ORDER_ALREADY_TERMINAL', from, to },
        };
      }

      // Admin can override if force=true, otherwise still follows transitions for safety
      const isPrivileged = actorRole === 'admin' || actorRole === 'manager';
      if (!isPrivileged || !force) {
        const allowed = ALLOWED_TRANSITIONS[from] || [];
        if (!allowed.includes(to)) {
          return {
            ok: false,
            status: 400,
            body: { success: false, error: 'INVALID_TRANSITION', from, to, allowed },
          };
        }
      }

      // Role restrictions (when not admin)
      if (!isPrivileged) {
        const roleTargets = ROLE_ALLOWED_TARGETS[actorRole];
        if (!roleTargets) {
          return { ok: false, status: 403, body: { success: false, error: 'ROLE_NOT_ALLOWED' } };
        }
        if (!roleTargets.has(to)) {
          return {
            ok: false,
            status: 403,
            body: { success: false, error: 'ROLE_STATUS_NOT_ALLOWED', role: actorRole, to },
          };
        }
      }

      // Customer cancellation: must own the order and only early stages
      if (actorRole === 'customer') {
        if (to !== 'cancelled') {
          return { ok: false, status: 403, body: { success: false, error: 'CUSTOMER_ONLY_CANCEL' } };
        }
        if (!actorId || current.client_id !== actorId) {
          return { ok: false, status: 403, body: { success: false, error: 'NOT_YOUR_ORDER' } };
        }
        if (!CUSTOMER_CANCEL_ALLOWED_FROM.has(from)) {
          return { ok: false, status: 400, body: { success: false, error: 'CANNOT_CANCEL_AT_THIS_STAGE', from } };
        }
      }

      // Inventory consistency:
      // When cancelling, we must free/restock inventory BEFORE committing order status change.
      if (to === 'cancelled') {
        // Only restock/unreserve while order is still in warehouse stage.
        // After pickup/delivery we must NOT auto-restock; it requires a returns workflow.
        if (AFTER_PICKUP.has(from) && !(isPrivileged && force)) {
          return { ok: false, status: 400, body: { success: false, error: 'CANNOT_CANCEL_AFTER_PICKUP', from } };
        }

        if (INVENTORY_CANCEL_ALLOWED_FROM.has(from)) {
          if (!inventoryGateway || typeof inventoryGateway.cancelOrder !== 'function') {
            return { ok: false, status: 500, body: { success: false, error: 'INVENTORY_GATEWAY_MISSING' } };
          }
          const inv = await inventoryGateway.cancelOrder(orderId);
          if (!inv?.success) {
            if (logger?.error) logger.error('Failed to cancel inventory for order:', { orderId, inv });
            return { ok: false, status: 500, body: { success: false, error: 'INVENTORY_CANCEL_FAILED' } };
          }
        }
      }

      const updated = await orderStatusRepository.updateStatus(orderId, to);
      return {
        ok: true,
        status: 200,
        body: { success: true, order: updated, from, to },
      };
    },
  };
}

module.exports = { createUpdateOrderStatusUseCase };

