// src/utils/roles.js
export function hasRole(user, role) {
  return Boolean(user?.claims?.[role]);
}
