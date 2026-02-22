/**
 * Audit module (facade)
 * Stores and serves Ops audit events.
 */

const { createAuditRepositoryPg } = require('./infrastructure/postgres/auditRepositoryPg');
const { createListAuditEvents } = require('./application/queries/ListAuditEvents');
const { createAdminAuditRouter } = require('./interfaces/http/adminAudit.router');

module.exports = {
  createAuditLogger: () => {
    const auditRepository = createAuditRepositoryPg();
    return {
      append: (e) => auditRepository.append(e),
      list: (p) => auditRepository.list(p),
    };
  },
  createAdminAuditRouter: ({ auditLogger } = {}) => {
    const auditRepository = createAuditRepositoryPg();
    const listAuditEvents = createListAuditEvents({ auditRepository });
    return createAdminAuditRouter({ listAuditEvents, auditLogger });
  },
};

