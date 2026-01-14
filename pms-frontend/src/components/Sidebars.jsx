import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../utils/permissions";
import PermissionGate from "./PermissionGate";
import Button from "react-bootstrap/Button";

function Sidebars() {
  const { user, logout } = useAuth();
  const { permissions } = usePermissions();
  const navigate = useNavigate();

  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "10px 0",
    color: isActive ? "#0d6efd" : "#000",
    fontWeight: isActive ? "bold" : "normal",
    textDecoration: "none",
    cursor: "pointer",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        width: "220px",
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <h4>SAPHUL PMS</h4>
      {user && (
        <div style={{ marginTop: "10px", marginBottom: "20px" }}>
          <small className="text-muted">
            {user.name}
          </small>
        </div>
      )}

      <nav style={{ marginTop: "10px", flex: 1 }}>
        <PermissionGate permission={PERMISSIONS.DASHBOARD_VIEW}>
          <NavLink to="/" style={linkStyle}>
            Dashboard
          </NavLink>
        </PermissionGate>

        <PermissionGate permissions={[PERMISSIONS.PROJECT_VIEW_ALL, PERMISSIONS.PROJECT_VIEW_ASSIGNED]}>
          <NavLink to="/projects" style={linkStyle}>
            Projects
          </NavLink>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.TASK_VIEW}>
          <NavLink to="/tasks" style={linkStyle}>
            Tasks
          </NavLink>
        </PermissionGate>

        <PermissionGate permission={PERMISSIONS.USER_VIEW_ALL}>
          <NavLink to="/users" style={linkStyle}>
            Users
          </NavLink>
        </PermissionGate>
      </nav>

      <Button variant="outline-danger" onClick={handleLogout} className="w-100">
        Logout
      </Button>
    </div>
  );
}

export default Sidebars;
