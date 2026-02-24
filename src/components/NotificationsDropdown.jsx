import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const NotificationsDropdown = ({ notifications, onClear, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearAll = () => {
    onClear();
    setIsOpen(false);
  };

  const handleNotificationClick = (notification) => {
    // Mark as read or handle notification click
    console.log('Notification clicked:', notification);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-neutral-200 hover:bg-white hover:border-purple-300 transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-neutral-700" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 max-h-96 overflow-hidden"
          >
            <div className="p-4 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                  <p className="text-neutral-600">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-sm">🔔</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 mb-1">
                            {notification.title || 'Habit Reminder'}
                          </p>
                          <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                            {notification.message || notification.body || 'Time to complete your habit!'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {notification.timestamp
                              ? format(new Date(notification.timestamp), 'MMM d, h:mm a')
                              : format(new Date(), 'MMM d, h:mm a')
                            }
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Remove individual notification
                            if (onRemove) onRemove(notification.id || index); // Use a unique ID if available, otherwise index
                          }}
                          className="text-neutral-400 hover:text-neutral-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsDropdown;
