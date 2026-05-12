import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../utils/permissions";
import PermissionGate from "./PermissionGate";
import Button from "react-bootstrap/Button";

function Sidebars() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/welcome");
  };

  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const userRole = user?.role || user?.roles?.[0] || "Team member";

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
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{userRole}</div>
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
