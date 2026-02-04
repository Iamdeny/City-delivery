/**
 * ListUsers (application query).
 */

/**
 * @param {Object} deps
 * @param {Object} deps.userRepository - list(params)
 * @returns {{ execute: (params: ListUsersInput) => Promise<{ success: true, users?: Object[], total?: number }> }}
 * @typedef {{ q?: string, role?: string, isActive?: boolean, limit?: number, offset?: number }} ListUsersInput
 */
function createListUsers({ userRepository }) {
  if (!userRepository) throw new Error('ListUsers: userRepository is required');

  return {
    /**
     * @param {ListUsersInput} params
     * @returns {Promise<{ success: true, users?: Object[], total?: number }>}
     */
    async execute(params) {
      const result = await userRepository.list(params);
      return { success: true, ...result };
    },
  };
}

module.exports = { createListUsers };

