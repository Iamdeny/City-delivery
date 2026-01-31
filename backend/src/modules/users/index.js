/**
 * Users module (facade)
 * Exposes HTTP routes for user/auth concerns.
 *
 * Migration note:
 * - Today this re-exports existing route handlers.
 * - Next step is to move business logic behind application ports/adapters.
 */

const authRouter = require('../../routes/auth');
const { createAdminUsersRouter } = require('./interfaces/http/adminUsers.router');
const { createListUsers } = require('./application/queries/ListUsers');
const { createUpdateUserAdmin } = require('./application/useCases/UpdateUserAdmin');
const { createUserRepositoryPg } = require('./infrastructure/postgres/userRepositoryPg');

module.exports = {
  authRouter,
  createAdminUsersRouter: ({ auditLogger } = {}) => {
    const userRepository = createUserRepositoryPg();
    const listUsers = createListUsers({ userRepository });
    const updateUserAdmin = createUpdateUserAdmin({ userRepository });
    return createAdminUsersRouter({ listUsers, updateUserAdmin, auditLogger });
  },
};

