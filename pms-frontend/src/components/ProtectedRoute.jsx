import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPermission, hasAnyPermission } from "../utils/permissions";

/**
 * ProtectedRoute component with permission-based authorization.
 * All authorization checks use permissions, not roles.
 */
const ProtectedRoute = ({ children, requiredPermission = null, requiredPermissions = [] }) => {
  const { user, permissions, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions if specified
  if (requiredPermission) {
    if (!hasPermission(permissions, requiredPermission)) {
      return <Navigate to="/" replace />;
    }
  }

  if (requiredPermissions.length > 0) {
    if (!hasAnyPermission(permissions, requiredPermissions)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
