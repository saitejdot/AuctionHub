import React, { useContext } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationContext } from '../../context/NotificationContext';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useContext(NotificationContext);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell size={24} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 font-medium transition"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Bell size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-sm mt-1">You will be notified about auction activity here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition flex items-start gap-4 ${!n.isRead ? 'bg-blue-50 border-l-4 border-primary-500' : ''}`}
                onClick={() => { if (!n.isRead) markAsRead(n._id); }}
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-primary-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <span className="text-xs text-primary-600 font-semibold flex-shrink-0">New</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
