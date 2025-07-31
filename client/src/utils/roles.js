// client/src/utils/roles.js - Sistema de roles y permisos

// =================================================================
// ROLES DISPONIBLES EN EL SISTEMA
// =================================================================
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  TESTER: 'tester',
  VIEWER: 'viewer'  // 🆕 Nuevo rol
};

// =================================================================
// CONFIGURACIÓN DE PERMISOS POR ROL
// =================================================================
export const ROLE_PERMISSIONS = {
  // ADMIN - Permisos completos
  [USER_ROLES.ADMIN]: {
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    canManageProjectMembers: true,
    canManageTeam: true,
    canRemoveUsers: true,
    canChangeUserRoles: true,
    canViewAllUsers: true,
    canCreateChannels: true,
    canDeleteChannels: true,
    canManageChannels: true,
    canSendMessages: true,
    canDeleteMessages: true,
    canViewReports: true,
    canExportData: true,
    canManageCRM: true,
    canViewCRM: true
  },

  // MANAGER - Gestión de proyectos y equipos
  [USER_ROLES.MANAGER]: {
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    canManageProjectMembers: true,
    canManageTeam: true,
    canRemoveUsers: true,
    canChangeUserRoles: false,
    canViewAllUsers: true,
    canCreateChannels: true,
    canDeleteChannels: true,
    canManageChannels: true,
    canSendMessages: true,
    canDeleteMessages: true,
    canViewReports: true,
    canExportData: true,
    canManageCRM: true,
    canViewCRM: true
  },

  // DEVELOPER - Trabajo en proyectos
  [USER_ROLES.DEVELOPER]: {
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canManageProjectMembers: false,
    canManageTeam: false,
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canViewAllUsers: true,
    canCreateChannels: false,
    canDeleteChannels: false,
    canManageChannels: false,
    canSendMessages: true,
    canDeleteMessages: false,
    canViewReports: false,
    canExportData: false,
    canManageCRM: false,
    canViewCRM: false
  },

  // DESIGNER - Similar a developer pero enfocado en diseño
  [USER_ROLES.DESIGNER]: {
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canManageProjectMembers: false,
    canManageTeam: false,
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canViewAllUsers: true,
    canCreateChannels: false,
    canDeleteChannels: false,
    canManageChannels: false,
    canSendMessages: true,
    canDeleteMessages: false,
    canViewReports: false,
    canExportData: false,
    canManageCRM: false,
    canViewCRM: false
  },

  // TESTER - Testing y QA
  [USER_ROLES.TESTER]: {
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canManageProjectMembers: false,
    canManageTeam: false,
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canViewAllUsers: true,
    canCreateChannels: false,
    canDeleteChannels: false,
    canManageChannels: false,
    canSendMessages: true,
    canDeleteMessages: false,
    canViewReports: false,
    canExportData: false,
    canManageCRM: false,
    canViewCRM: false
  },

  // 🆕 VIEWER - Solo visualización y chat básico
  [USER_ROLES.VIEWER]: {
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canManageProjectMembers: false,
    canManageTeam: false,
    canRemoveUsers: false,
    canChangeUserRoles: false,
    canViewAllUsers: false,
    canCreateChannels: false,
    canDeleteChannels: false,
    canManageChannels: false,
    canSendMessages: true, // 🎯 SÍ puede enviar mensajes
    canDeleteMessages: false,
    canViewReports: false,
    canExportData: false,
    canManageCRM: false,
    canViewCRM: false
  }
};

// =================================================================
// CONFIGURACIÓN DE COLORES Y ETIQUETAS POR ROL
// =================================================================
export const ROLE_CONFIG = {
  [USER_ROLES.ADMIN]: {
    label: 'Administrador',
    color: 'danger',
    icon: 'bi-shield-fill',
    description: 'Acceso completo al sistema'
  },
  [USER_ROLES.MANAGER]: {
    label: 'Manager',
    color: 'warning',
    icon: 'bi-person-gear',
    description: 'Gestión de proyectos y equipos'
  },
  [USER_ROLES.DEVELOPER]: {
    label: 'Developer',
    color: 'primary',
    icon: 'bi-code-slash',
    description: 'Desarrollo y programación'
  },
  [USER_ROLES.DESIGNER]: {
    label: 'Designer',
    color: 'info',
    icon: 'bi-palette',
    description: 'Diseño y experiencia de usuario'
  },
  [USER_ROLES.TESTER]: {
    label: 'Tester',
    color: 'success',
    icon: 'bi-bug',
    description: 'Testing y control de calidad'
  },
  [USER_ROLES.VIEWER]: {
    label: 'Viewer',
    color: 'secondary',
    icon: 'bi-eye',
    description: 'Solo lectura y chat básico'
  }
};

// =================================================================
// JERARQUÍA DE ROLES
// =================================================================
export const ROLE_HIERARCHY = {
  [USER_ROLES.ADMIN]: 6,
  [USER_ROLES.MANAGER]: 5,
  [USER_ROLES.DEVELOPER]: 4,
  [USER_ROLES.DESIGNER]: 3,
  [USER_ROLES.TESTER]: 2,
  [USER_ROLES.VIEWER]: 1
};

// =================================================================
// FUNCIONES HELPER
// =================================================================

// Verificar si un rol tiene un permiso específico
export const checkPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions[permission] || false : false;
};

// Verificar si puede gestionar proyectos
export const canUserManageProjects = (userRole) => {
  return checkPermission(userRole, 'canManageProjectMembers');
};

// Verificar si puede gestionar equipo
export const canUserManageTeam = (userRole) => {
  return checkPermission(userRole, 'canManageTeam');
};

// Verificar si puede enviar mensajes
export const canUserSendMessages = (userRole) => {
  return checkPermission(userRole, 'canSendMessages');
};

// Verificar si puede crear canales
export const canUserCreateChannels = (userRole) => {
  return checkPermission(userRole, 'canCreateChannels');
};

// Verificar si puede remover usuarios
export const canUserRemoveUsers = (userRole) => {
  return checkPermission(userRole, 'canRemoveUsers');
};

// Obtener configuración de rol
export const getRoleConfig = (role) => {
  return ROLE_CONFIG[role] || ROLE_CONFIG[USER_ROLES.VIEWER];
};

// Verificar si es un rol válido
export const isValidRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};

// Verificar si un usuario puede gestionar a otro usuario
export const canManageUser = (managerRole, targetRole) => {
  const managerLevel = ROLE_HIERARCHY[managerRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  return managerLevel > targetLevel;
};

// Hook personalizado para obtener permisos
export const getPermissions = (userRole) => {
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[USER_ROLES.VIEWER];
  
  return {
    ...permissions,
    role: userRole,
    roleConfig: getRoleConfig(userRole),
    checkPermission: (permission) => checkPermission(userRole, permission),
    canManageUser: (targetRole) => canManageUser(userRole, targetRole)
  };
};

// Obtener lista de todos los roles para selects
export const getAllRoles = () => {
  return Object.values(USER_ROLES).map(role => ({
    value: role,
    label: ROLE_CONFIG[role].label,
    color: ROLE_CONFIG[role].color,
    icon: ROLE_CONFIG[role].icon,
    description: ROLE_CONFIG[role].description
  }));
};

// Filtrar roles que un usuario puede asignar
export const getAssignableRoles = (userRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  
  return getAllRoles().filter(role => {
    const roleLevel = ROLE_HIERARCHY[role.value] || 0;
    return roleLevel < userLevel;
  });
};