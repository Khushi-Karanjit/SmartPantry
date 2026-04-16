import { useState, useEffect, useRef } from "react";
import { Bell, X, Calendar, AlertTriangle, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  getNotificationsApi, 
  markNotificationAsReadApi, 
  markAllNotificationsAsReadApi, 
  deleteNotificationApi,
  type Notification 
} from "../api/api";
import { formatFullTimestamp } from "../utils/timeUtils";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
    // Proactive Monitoring: Poll for new notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsApi();
      setNotifications(res.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsReadApi(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotificationApi(id);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high": return "priority-high";
      case "medium": return "priority-medium";
      default: return "priority-low";
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === "high" || type === "expiry") return <AlertTriangle size={16} />;
    if (type === "low_stock") return <Calendar size={16} />;
    return <Info size={16} />;
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`bell-button ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read">
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div 
                  key={notif._id} 
                  className={`notification-item ${!notif.isRead ? 'unread' : ''} ${getPriorityClass(notif.priority)}`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                >
                  <div className="notif-icon">
                    {getIcon(notif.type, notif.priority)}
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-message">{notif.message}</p>
                    <div className="notif-time-container">
                       <span className="notif-time-relative" title={formatFullTimestamp(notif.createdAt).exact}>
                         {formatFullTimestamp(notif.createdAt).relative}
                       </span>
                       <span className="notif-time-exact">
                         {formatFullTimestamp(notif.createdAt).exact}
                       </span>
                    </div>
                  </div>
                  <div className="notif-actions">
                    <button onClick={(e) => handleDelete(e, notif._id)} title="Delete">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="list-empty">
                <Bell size={32} opacity={0.3} />
                <p>No notifications yet</p>
              </div>
            )}
          </div>

            <div className="dropdown-footer">
              <Link to="/notifications" className="view-all-link" onClick={() => setIsOpen(false)}>
                View All Alerts <ArrowRight size={14} />
              </Link>
              <button onClick={() => setIsOpen(false)}>Close</button>
            </div>
        </div>
      )}
    </div>
  );
}
