/**
 * QueuePublisher adapter (wraps legacy queueService).
 * Implements port used by CreateOrder use-case.
 *
 * @param {Object} queueService - addNotification(type, userId, payload, priority), addAnalytics(type, payload)
 * @returns {import('../../application/ports').QueuePublisher}
 */
function createQueuePublisher(queueService) {
  return {
    addNotification: (type, userId, payload, priority) =>
      queueService.addNotification(type, userId, payload, priority),
    addAnalytics: (type, payload) =>
      queueService.addAnalytics(type, payload),
  };
}

module.exports = {
  createQueuePublisher,
};

