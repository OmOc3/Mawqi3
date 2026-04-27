import type { UserRole } from '@/lib/sync/types';

export type MobileHomeRoute = '/(tabs)';
export type MobileAdminRole = 'manager' | 'supervisor';
export type WebPortalRole = MobileAdminRole;

export function isMobileAdminRole(role: UserRole): role is MobileAdminRole {
  return role === 'manager' || role === 'supervisor';
}

export function isWebPortalRole(role: UserRole): role is WebPortalRole {
  return isMobileAdminRole(role);
}

export function getMobileHomeRoute(_role: UserRole): MobileHomeRoute {
  return '/(tabs)';
}

export function getWebPortalPath(role: WebPortalRole): '/dashboard/manager' | '/dashboard/supervisor' {
  return role === 'manager' ? '/dashboard/manager' : '/dashboard/supervisor';
}
