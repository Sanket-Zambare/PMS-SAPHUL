/**
 * Permission utility functions for frontend permission-based access control.
 * All authorization checks must use permissions, not roles.
 */

// Permission constants matching backend
export const PERMISSIONS = {
  // Project permissions
  PROJECT_CREATE: "PROJECT_CREATE",
  PROJECT_VIEW_ALL: "PROJECT_VIEW_ALL",
  PROJECT_VIEW_ASSIGNED: "PROJECT_VIEW_ASSIGNED",
  PROJECT_EDIT: "PROJECT_EDIT",
  PROJECT_DELETE: "PROJECT_DELETE",
  PROJECT_CLOSE: "PROJECT_CLOSE",
  PROJECT_APPROVE: "PROJECT_APPROVE",
  
  // Task permissions
  TASK_CREATE: "TASK_CREATE",
  TASK_VIEW: "TASK_VIEW",
  TASK_EDIT: "TASK_EDIT",
  TASK_DELETE: "TASK_DELETE",
  TASK_ASSIGN: "TASK_ASSIGN",
  TASK_APPROVE: "TASK_APPROVE",
  
  // User permissions
  USER_CREATE: "USER_CREATE",
  USER_VIEW: "USER_VIEW",
  USER_VIEW_ALL: "USER_VIEW_ALL",
  USER_MANAGE_ROLES: "USER_MANAGE_ROLES",
  USER_EDIT: "USER_EDIT",
  USER_DELETE: "USER_DELETE",
  USER_ASSIGN_ROLE: "USER_ASSIGN_ROLE",
  
  // Sprint permissions
  SPRINT_CREATE: "SPRINT_CREATE",
  SPRINT_VIEW: "SPRINT_VIEW",
  SPRINT_EDIT: "SPRINT_EDIT",
  SPRINT_DELETE: "SPRINT_DELETE",
  
  // Time log permissions
  TIME_LOG_CREATE: "TIME_LOG_CREATE",
  TIME_LOG_VIEW: "TIME_LOG_VIEW",
  TIME_LOG_EDIT: "TIME_LOG_EDIT",
  TIME_LOG_DELETE: "TIME_LOG_DELETE",
  
  // File permissions
  FILE_UPLOAD: "FILE_UPLOAD",
  FILE_VIEW: "FILE_VIEW",
  FILE_DELETE: "FILE_DELETE",
  
  // Billing permissions
  BILLING_VIEW: "BILLING_VIEW",
  BILLING_EDIT: "BILLING_EDIT",
  
  // Dashboard permissions
  DASHBOARD_VIEW: "DASHBOARD_VIEW",
};

/**
 * Check if user has a specific permission
 * @param {Array<string>} userPermissions - Array of permission codes the user has
 * @param {string} permission - Permission code to check
 * @returns {boolean}
 */
export const hasPermission = (userPermissions, permission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 * @param {Array<string>} userPermissions - Array of permission codes the user has
 * @param {Array<string>} permissions - Array of permission codes to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userPermissions, permissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  if (!permissions || !Array.isArray(permissions)) {
    return false;
  }
  return permissions.some(perm => userPermissions.includes(perm));
};

/**
 * Check if user has all of the specified permissions
 * @param {Array<string>} userPermissions - Array of permission codes the user has
 * @param {Array<string>} permissions - Array of permission codes to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userPermissions, permissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  if (!permissions || !Array.isArray(permissions)) {
    return false;
  }
  return permissions.every(perm => userPermissions.includes(perm));
};

/**
 * Check if user has CLIENT role
 * @param {Object} user - User object with roles array
 * @returns {boolean}
 */
export const isClient = (user) => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false;
  }
  return user.roles.includes('CLIENT');
};

