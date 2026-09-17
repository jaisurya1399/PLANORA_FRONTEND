import api from "./axios";

export const getRolePermissions = async () => {
  const response = await api.get("/role-permissions");
  return response.data;
};

export const getPermissionsByRole = async (roleId) => {
  const response = await api.get(`/role-permissions/role/${roleId}`);
  return response.data;
};

export const getRolesByPermission = async (permissionId) => {
  const response = await api.get(
    `/role-permissions/permission/${permissionId}`,
  );
  return response.data;
};

export const getRolePermission = async (roleId, permissionId) => {
  const response = await api.get(
    `/role-permissions/role/${roleId}/permission/${permissionId}`,
  );
  return response.data;
};

export const checkRolePermission = async (roleId, permissionId) => {
  const response = await api.get(
    `/role-permissions/role/${roleId}/permission/${permissionId}/exists`,
  );
  return response.data;
};

export const assignPermissionToRole = async (roleId, permissionId) => {
  const response = await api.post(
    `/role-permissions/role/${roleId}/permission/${permissionId}`,
  );
  return response.data;
};

export const removePermissionFromRole = async (roleId, permissionId) => {
  await api.delete(
    `/role-permissions/role/${roleId}/permission/${permissionId}`,
  );
};

export const removeAllPermissionsFromRole = async (roleId) => {
  await api.delete(`/role-permissions/role/${roleId}`);
};

export const removePermissionFromAllRoles = async (permissionId) => {
  await api.delete(`/role-permissions/permission/${permissionId}`);
};
