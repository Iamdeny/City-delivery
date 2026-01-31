/**
 * ListUsers (application query)
 */

function createListUsers({ userRepository }) {
  if (!userRepository) throw new Error('ListUsers: userRepository is required');

  return {
    /**
     * @param {{ q?:string, role?:string, isActive?:boolean, limit?:number, offset?:number }} params
     */
    async execute(params) {
      const result = await userRepository.list(params);
      return { success: true, ...result };
    },
  };
}

module.exports = { createListUsers };

