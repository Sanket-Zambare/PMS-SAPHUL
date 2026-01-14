import { useAuth } from "../context/AuthContext";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "../utils/permissions";

/**
 * Custom hook for permission checking in components.
 * Provides easy access to permission checking functions.
 */
export const usePermissions = () => {
  const { permissions } = useAuth();

  return {
    permissions,
    hasPermission: (permission) => hasPermission(permissions, permission),
    hasAnyPermission: (permissionList) => hasAnyPermission(permissions, permissionList),
    hasAllPermissions: (permissionList) => hasAllPermissions(permissions, permissionList),
  };
};


