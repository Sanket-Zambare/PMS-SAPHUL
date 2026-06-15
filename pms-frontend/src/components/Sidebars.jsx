import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../utils/permissions";
import PermissionGate from "./PermissionGate";
import Button from "react-bootstrap/Button";
import { notificationsAPI } from "../services/api";

function Sidebars() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/welcome");
  };

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const userRole = user?.role || user?.roles?.[0] || "Team member";

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // silently fail
    }
  };

  const handleBellClick = async () => {
    if (!showNotifs) {
      try {
        const res = await notificationsAPI.getAll({ limit: 20 });
        setNotifications(res.data || []);
      } catch {
        // silently fail
      }
    }
    setShowNotifs((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleMarkRead = async (notif) => {
    if (notif.is_read) {
      if (notif.entity_type === "TASK" && notif.entity_id) {
        navigate(`/tasks/${notif.entity_id}`);
        setShowNotifs(false);
      }
      return;
    }
    try {
      await notificationsAPI.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      if (notif.entity_type === "TASK" && notif.entity_id) {
        navigate(`/tasks/${notif.entity_id}`);
        setShowNotifs(false);
      }
    } catch {
      // silently fail
    }
  };

  const handleDeleteNotif = async (e, notifId) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(notifId);
      const removed = notifications.find((n) => n.id === notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      if (removed && !removed.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <aside className="app-sidebar">
      <div className="brand-lockup">
        <div className="brand-mark">S</div>
        <div>
          <p className="brand-title">SANE</p>
          <p className="brand-subtitle">Project workspace</p>
        </div>
      </div>

      {user && (
        <div className="user-strip">
          <div className="user-avatar">{userInitial}</div>
          <div style={{ flex: 1 }}>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{userRole}</div>
          </div>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={handleBellClick}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 6px",
                position: "relative",
                color: "#555",
                fontSize: "1.1rem",
                lineHeight: 1,
              }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "#dc3545",
                    color: "#fff",
                    borderRadius: "50%",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div
                style={{
                  position: "absolute",
                  left: "110%",
                  top: 0,
                  width: "320px",
                  background: "#fff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  zIndex: 1000,
                  maxHeight: "420px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#E8640A",
                        fontSize: "0.78rem",
                        padding: 0,
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ overflowY: "auto", flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "#aaa", fontSize: "0.85rem" }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleMarkRead(notif)}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f5f5f5",
                          cursor: "pointer",
                          background: notif.is_read ? "#fff" : "#fff8f4",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9f9f9")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = notif.is_read ? "#fff" : "#fff8f4")}
                      >
                        {!notif.is_read && (
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#E8640A",
                              flexShrink: 0,
                              marginTop: "5px",
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1a1a1a" }}>
                            {notif.title}
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#555", marginTop: "2px", wordBreak: "break-word" }}>
                            {notif.message}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "4px" }}>
                            {timeAgo(notif.created_at)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotif(e, notif.id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ccc",
                            fontSize: "0.9rem",
                            padding: "0 2px",
                            flexShrink: 0,
                          }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="side-nav">
        <PermissionGate permission={PERMISSIONS.DASHBOARD_VIEW}>
          <NavLink to="/" className="side-link">
            <span className="side-icon">D</span>
            <span>Dashboard</span>
          </NavLink>
        </PermissionGate>

        <PermissionGate permissions={[PERMISSIONS.PROJECT_VIEW_ALL, PERMISSIONS.PROJECT_VIEW_ASSIGNED]}>
          <NavLink to="/projects" className="side-link">
            <span className="side-icon">P</span>
            <span>Projects</span>
          </NavLink>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.TASK_VIEW}>
          <NavLink to="/tasks" className="side-link">
            <span className="side-icon">T</span>
            <span>Tasks</span>
          </NavLink>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.USER_VIEW_ALL}>
          <NavLink to="/users" className="side-link">
            <span className="side-icon">U</span>
            <span>Users</span>
          </NavLink>
        </PermissionGate>
      </nav>

      <Button onClick={handleLogout} className="logout-button w-100">
        Logout
      </Button>
    </aside>
  );
}

export default Sidebars;
