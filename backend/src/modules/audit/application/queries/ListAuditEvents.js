/**
 * ListAuditEvents (application query).
 *
 * @param {Object} deps
 * @param {Object} deps.auditRepository - list(params)
 * @returns {{ execute: (params?: ListAuditEventsInput) => Promise<{ success: true, events?: Object[], total?: number }> }}
 * @typedef {{ limit?: number, offset?: number, entity_type?: string, entity_id?: string, actor_user_id?: number }} ListAuditEventsInput
 */
function createListAuditEvents({ auditRepository }) {
  if (!auditRepository) throw new Error('ListAuditEvents: auditRepository is required');
  return {
    /**
     * @param {ListAuditEventsInput} [params]
     * @returns {Promise<{ success: true, events?: Object[], total?: number }>}
     */
    async execute(params) {
      const result = await auditRepository.list(params || {});
      return { success: true, ...result };
    },
  };
}

module.exports = { createListAuditEvents };

