// Use localStorage for now
// Later, you can update this file to use cookies instead (e.g., using js-cookie or let the backend handle it entirely).

import { Employee } from "@/lib/types/Employee";

export type FeaturePermission = {
  canAccess: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean; canPublish: boolean;
  canSubmit: boolean; canApprove: boolean; canFinalize: boolean;
  dataScope: "NONE" | "OWN_RECORDS" | "ASSIGNED_RECORDS" | "AGENCY_WIDE";
};

export const localStorageUtil = {
  // Token
  get: () => localStorage.getItem("authToken"),
  set: (token: string) => localStorage.setItem("authToken", token),
  clear: () => localStorage.removeItem("authToken"),

  // Employees list
  setEmployees: (employees: Employee[]) => localStorage.setItem("employees", JSON.stringify(employees)),
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem("employees");
    return data ? JSON.parse(data) : [];
  },
  clearEmployees: () => localStorage.removeItem("employees"),

  // Current employeeNo & name
  setEmployeeNo: (employeeNo: string) => localStorage.setItem("employeeNo", employeeNo),
  setEmployeeFullname: (fullname: string) => localStorage.setItem("employeeFullname", fullname),
  getEmployeeNo: () => localStorage.getItem("employeeNo"),
  getEmployeeFullname: () => localStorage.getItem("employeeFullname"),
  clearEmployeeInfo: () => {
    localStorage.removeItem("employeeNo");
    localStorage.removeItem("employeeFullname");
  },

  setEmployeeRole: (userRole: string) => localStorage.setItem("userRole", userRole),
  getEmployeeRole: () => localStorage.getItem("userRole"),

  setPermissionName: (name: string) => localStorage.setItem("permissionName", name),
  getPermissionName: () => localStorage.getItem("permissionName"),
  clearPermissionName: () => localStorage.removeItem("permissionName"),

  setIsAdministrator: (val: boolean) => localStorage.setItem("isAdministrator", val ? "true" : "false"),
  getIsAdministrator: () => localStorage.getItem("isAdministrator") === "true",

  // Permission data — full module permission map from the matched ruleset
  // null means super admin (all access). An empty object means no access to anything.
  setPermissionData: (data: Record<string, { canAccess: boolean }> | null) =>
    localStorage.setItem("permissionData", data === null ? "__superadmin__" : JSON.stringify(data)),
  getPermissionData: (): Record<string, { canAccess: boolean }> | null => {
    const raw = localStorage.getItem("permissionData");
    if (!raw || raw === "__superadmin__") return null; // null = full access
    try { return JSON.parse(raw); } catch { return null; }
  },
  canAccess: (key: string): boolean => {
    if (localStorage.getItem("isAdministrator") === "true") return true;
    const raw = localStorage.getItem("permissionData");
    if (!raw || raw === "__superadmin__") return true;
    try {
      const data = JSON.parse(raw) as Record<string, { canAccess: boolean }>;
      return data[key]?.canAccess === true;
    } catch { return false; }
  },
  canAdd: (key: string): boolean => {
    if (localStorage.getItem("isAdministrator") === "true") return true;
    const raw = localStorage.getItem("permissionData");
    if (!raw || raw === "__superadmin__") return true;
    try {
      const data = JSON.parse(raw) as Record<string, { canAccess?: boolean; canAdd?: boolean }>;
      return data[key]?.canAccess === true && data[key]?.canAdd === true;
    } catch { return false; }
  },
  canEdit: (key: string): boolean => {
    if (localStorage.getItem("isAdministrator") === "true") return true;
    const raw = localStorage.getItem("permissionData");
    if (!raw || raw === "__superadmin__") return true;
    try {
      const data = JSON.parse(raw) as Record<string, { canAccess?: boolean; canEdit?: boolean }>;
      return data[key]?.canAccess === true && data[key]?.canEdit === true;
    } catch { return false; }
  },
  canDelete: (key: string): boolean => {
    if (localStorage.getItem("isAdministrator") === "true") return true;
    const raw = localStorage.getItem("permissionData");
    if (!raw || raw === "__superadmin__") return true;
    try {
      const data = JSON.parse(raw) as Record<string, { canAccess?: boolean; canDelete?: boolean }>;
      return data[key]?.canAccess === true && data[key]?.canDelete === true;
    } catch { return false; }
  },

  getFeaturePermission: (key: string): FeaturePermission => {
    const denied: FeaturePermission = { canAccess: false, canAdd: false, canEdit: false, canDelete: false, canPublish: false,
      canSubmit: false, canApprove: false, canFinalize: false, dataScope: "NONE" };
    if (typeof window === "undefined") return denied;
    const administrator = localStorage.getItem("isAdministrator") === "true" ||
      localStorage.getItem("permissionData") === "__superadmin__" || localStorage.getItem("userRole") === "1";
    if (administrator) return { canAccess: true, canAdd: true, canEdit: true, canDelete: true, canPublish: true,
      canSubmit: true, canApprove: true, canFinalize: true, dataScope: "AGENCY_WIDE" };
    try {
      const raw = localStorage.getItem("permissionData"); if (!raw) return denied;
      const feature = (JSON.parse(raw) as Record<string, Partial<FeaturePermission>>)[key];
      const canAccess = feature?.canAccess === true;
      const dataScope = feature?.dataScope === "OWN_RECORDS" || feature?.dataScope === "ASSIGNED_RECORDS" || feature?.dataScope === "AGENCY_WIDE" ? feature.dataScope : "NONE";
      return { canAccess, canAdd: canAccess && feature?.canAdd === true, canEdit: canAccess && feature?.canEdit === true,
        canDelete: canAccess && feature?.canDelete === true,
        canPublish: canAccess && feature?.canPublish === true, canSubmit: canAccess && feature?.canSubmit === true,
        canApprove: canAccess && feature?.canApprove === true, canFinalize: canAccess && feature?.canFinalize === true,
        dataScope: canAccess ? dataScope : "NONE" };
    } catch { return denied; }
  },

  setEmployeeId: (employeeId: number) => localStorage.setItem("employeeId", employeeId.toString()),
  getEmployeeId: (): number | null => {
    const id = localStorage.getItem("employeeId");
    return id ? Number(id) : null;
  },

  setBiometricNo: (biometricNo: string) => localStorage.setItem("biometricNo", biometricNo),
  getBiometricNo: () => localStorage.getItem("biometricNo"),

  // System configuration (key-value store fetched from backend at login)
  setSystemConfig: (configs: Record<string, string>) => localStorage.setItem("systemConfig", JSON.stringify(configs)),
  getSystemConfig: (key: string): string | null => {
    const data = localStorage.getItem("systemConfig");
    if (!data) return null;
    const parsed: Record<string, string> = JSON.parse(data);
    return parsed[key] ?? null;
  },
  clearSystemConfig: () => localStorage.removeItem("systemConfig"),
};
