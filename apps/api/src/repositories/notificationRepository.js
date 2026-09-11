const { getNextId, getAllRecords, setRecord, updateRecord } = require('../services/firebaseDbService');

class NotificationRepository {
  async create({ user_id, title, message, type, reference_id = null, reference_type = null }) {
    const newId = await getNextId('notifications');
    const notification = {
      id: newId,
      user_id,
      title,
      message,
      type,
      reference_id: reference_id || null,
      reference_type: reference_type || null,
      is_read: 0,
      created_at: new Date().toISOString(),
    };

    await setRecord('notifications', newId, notification);
    return notification;
  }

  async findByUser(userId, limit = 50) {
    const notifications = await getAllRecords('notifications');
    return notifications
      .filter((n) => String(n.user_id) === String(userId))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, limit);
  }

  async getUnreadCount(userId) {
    const notifications = await getAllRecords('notifications');
    return notifications.filter((n) => String(n.user_id) === String(userId) && n.is_read === 0).length;
  }

  async markAsRead(id, userId) {
    await updateRecord('notifications', id, { is_read: 1 });
    return { id, is_read: 1 };
  }

  async markAllAsRead(userId) {
    const notifications = await getAllRecords('notifications');
    for (const n of notifications) {
      if (String(n.user_id) === String(userId) && n.is_read === 0) {
        await updateRecord('notifications', n.id, { is_read: 1 });
      }
    }
    return { success: true };
  }
}

module.exports = new NotificationRepository();
