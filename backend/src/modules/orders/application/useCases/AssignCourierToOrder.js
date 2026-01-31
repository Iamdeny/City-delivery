/**
 * AssignCourierToOrder (application use-case)
 * Sets/clears courier_id on an order (Ops action).
 */

const TERMINAL = new Set(['delivered', 'cancelled']);

function normalizeCourierId(v) {
  if (v === null || v === undefined) return null;
  if (v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return NaN;
  return Math.floor(n);
}

function createAssignCourierToOrderUseCase({ orderCourierRepository, auditLogger, logger }) {
  if (!orderCourierRepository) throw new Error('AssignCourierToOrder: orderCourierRepository is required');

  return {
    /**
     * @param {{
     *  actor: { id:number, role:string },
     *  orderId: number,
     *  courierId: number|null // courier USER id (users.id). Will be mapped to couriers.id.
     * }} params
     */
    async execute(params) {
      const orderId = Math.floor(Number(params.orderId));
      const courierUserId = normalizeCourierId(params.courierId);
      const actorRole = params.actor?.role || 'unknown';
      const actorId = Number(params.actor?.id);

      if (!orderId || orderId <= 0) {
        return { ok: false, status: 400, body: { success: false, error: 'ORDER_ID_INVALID' } };
      }
      if (Number.isNaN(courierUserId)) {
        return { ok: false, status: 400, body: { success: false, error: 'COURIER_ID_INVALID' } };
      }

      const current = await orderCourierRepository.getById(orderId);
      if (!current) {
        return { ok: false, status: 404, body: { success: false, error: 'ORDER_NOT_FOUND' } };
      }
      if (TERMINAL.has(current.status)) {
        return {
          ok: false,
          status: 400,
          body: { success: false, error: 'ORDER_ALREADY_TERMINAL', from: current.status },
        };
      }

      const fromCourierId = current.courier_id ?? null;
      let toCourierId = null;
      let toCourierUserId = null;

      if (courierUserId !== null) {
        const c = await orderCourierRepository.ensureCourierByUserId(courierUserId);
        if (!c) {
          return { ok: false, status: 404, body: { success: false, error: 'COURIER_NOT_FOUND' } };
        }
        if (String(c.user_role) !== 'courier') {
          return { ok: false, status: 400, body: { success: false, error: 'USER_NOT_COURIER' } };
        }
        if (c.user_active === false || c.courier_active === false) {
          return { ok: false, status: 400, body: { success: false, error: 'COURIER_INACTIVE' } };
        }
        toCourierId = Number(c.courier_id);
        toCourierUserId = Number(c.user_id);
        if (!Number.isFinite(toCourierId) || toCourierId <= 0) {
          return { ok: false, status: 500, body: { success: false, error: 'COURIER_LOOKUP_FAILED' } };
        }
      }

      if (fromCourierId === toCourierId) {
        return {
          ok: true,
          status: 200,
          body: { success: true, order: current, unchanged: true, fromCourierId, toCourierId, toCourierUserId },
        };
      }

      const updated = await orderCourierRepository.setCourier(orderId, toCourierId);
      if (!updated) {
        return { ok: false, status: 500, body: { success: false, error: 'ASSIGN_FAILED' } };
      }

      if (auditLogger && typeof auditLogger.append === 'function') {
        try {
          await auditLogger.append({
            actor_user_id: Number.isFinite(actorId) ? actorId : null,
            actor_role: actorRole || null,
            action: toCourierId ? 'order.assign_courier' : 'order.unassign_courier',
            entity_type: 'order',
            entity_id: String(orderId),
            meta: {
              orderId,
              fromCourierId,
              toCourierId,
              toCourierUserId,
            },
          });
        } catch {
          // never block main flow
        }
      }

      if (logger?.info) {
        logger.info('Ops courier assignment updated', { orderId, fromCourierId, toCourierId });
      }

      return {
        ok: true,
        status: 200,
        body: { success: true, order: updated, fromCourierId, toCourierId, toCourierUserId },
      };
    },
  };
}

module.exports = { createAssignCourierToOrderUseCase };

