/**
 * QueuePublisher adapter (wraps legacy queueService).
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

