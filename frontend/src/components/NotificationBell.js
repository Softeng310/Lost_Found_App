import React, { useState, useEffect } from 'react';
import { Bell, Settings, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { getIdToken } from 'firebase/auth';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    console.log('NotificationBell mounted');
    console.log('Current user:', auth.currentUser);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const currentUser = auth.currentUser;
      console.log('Current user in fetch:', currentUser);
      
      if (!currentUser) {
        console.warn('No user logged in, skipping fetch');
        return;
      }

      const idToken = await getIdToken(currentUser);
      console.log('Got ID token:', idToken ? 'Yes' : 'No');
      
      const response = await fetch('http://localhost:5876/api/notifications', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      // Handle both array and object responses
      const notificationsArray = Array.isArray(data) ? data : [];
      
      console.log('Notifications array:', notificationsArray);
      setNotifications(notificationsArray);
      setUnreadCount(notificationsArray.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); // Fallback to empty array on error
    }
  };

  const markAsRead = async (id) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const idToken = await getIdToken(currentUser);
      await fetch(`http://localhost:5876/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (id) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const idToken = await getIdToken(currentUser);
      await fetch(`http://localhost:5876/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-500 text-center">No notifications</p>
          ) : (
            notifications.map((notif) => (
              <Link
                key={notif.id}
                to={`/items/${notif.itemId}`}
                className={`block p-4 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                  setShowDropdown(false);
                }}
              >
                <div className="flex gap-3">
                  {/* Item Image */}
                  {notif.itemData?.imageUrl && (
                    <img
                      src={notif.itemData.imageUrl}
                      alt={notif.itemData.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          dismissNotification(notif.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                    
                    {/* Location */}
                    {notif.itemData?.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <MapPin size={12} />
                        <span>{notif.itemData.location}</span>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
          
          {/* Settings Link */}
          <Link
            to="/notifications/settings"
            className="flex items-center gap-2 p-4 hover:bg-gray-50 text-emerald-600 hover:text-emerald-700 font-medium border-t"
            onClick={() => setShowDropdown(false)}
          >
            <Settings size={18} />
            <span>Notification Settings</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;