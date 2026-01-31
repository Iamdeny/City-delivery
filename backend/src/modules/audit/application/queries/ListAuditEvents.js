function createListAuditEvents({ auditRepository }) {
  if (!auditRepository) throw new Error('ListAuditEvents: auditRepository is required');
  return {
    async execute(params) {
      const result = await auditRepository.list(params || {});
      return { success: true, ...result };
    },
  };
}

module.exports = { createListAuditEvents };

