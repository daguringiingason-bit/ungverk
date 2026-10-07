import type { SelfServiceRole } from '@/lib/profiles/api';

// The role a person tapped on the welcome screen, remembered in memory only until
// onboarding. It is just a UI default: the server validates the role (and age)
// when the profile is created, so nothing here is trusted.
let pendingRole: SelfServiceRole | null = null;

export function setPendingRole(role: SelfServiceRole | null): void {
  pendingRole = role;
}

export function getPendingRole(): SelfServiceRole | null {
  return pendingRole;
}
