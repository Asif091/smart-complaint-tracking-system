const Notification = require('../models/Notification');

/**
 * Create an in-app notification for a user
 * @param {ObjectId} recipientId - User ID who will receive notification
 * @param {string} type - One of: complaint_created, complaint_assigned, status_changed, comment_added, account_updated
 * @param {ObjectId|null} complaintId - Optional complaint ID (for complaint-related notifications)
 * @param {string} message - Human readable message
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (recipientId, type, complaintId, message) => {
  try {
    if (!recipientId) return null;
    
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      complaintId: complaintId || null,
      message,
    });
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

module.exports = createNotification;