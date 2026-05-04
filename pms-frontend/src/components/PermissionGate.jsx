import { useAuth } from "../context/AuthContext";
import { hasPermission, hasAnyPermission } from "../utils/permissions";

/**
 * PermissionGate component to conditionally render content based on permissions.
 * Use this to hide/show UI elements based on user permissions.
 */
const PermissionGate = ({ 
  permission = null, 
  permissions = [], 
  children, 
  fallback = null 
}) => {
  const { permissions: userPermissions } = useAuth();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(userPermissions, permission);
  } else if (permissions.length > 0) {
    hasAccess = hasAnyPermission(userPermissions, permissions);
  } else {
    // If no permission specified, show content
    hasAccess = true;
  }
  
  return hasAccess ? children : fallback;
};

export default PermissionGate;




