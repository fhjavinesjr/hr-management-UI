"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { runtimeConfig } from "@/lib/utils/runtimeConfig";

const PUBLIC_PATHS = new Set(["/hr-management/login", "/hr-management/sso"]);

type CurrentPermission = {
  isAdministrator?: boolean;
  portalModuleAccess?: string | { hrManagement?: boolean } | null;
};

const hasHrmModuleAccess = (permission: CurrentPermission): boolean => {
  if (permission.isAdministrator === true) return true;
  try {
    const access = typeof permission.portalModuleAccess === "string"
      ? JSON.parse(permission.portalModuleAccess) as { hrManagement?: boolean }
      : permission.portalModuleAccess;
    return access?.hrManagement === true;
  } catch {
    return false;
  }
};

export default function HrmModuleAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [allowed, setAllowed] = useState(PUBLIC_PATHS.has(pathname));

  const verifyCurrentAccess = useCallback(async () => {
    if (PUBLIC_PATHS.has(pathname)) {
      setAllowed(true);
      return;
    }

    if (localStorageUtil.getEmployeeNo()?.trim().toLowerCase() === "admin") {
      setAllowed(true);
      return;
    }

    setAllowed(false);
    try {
      const [securityResponse, permissionResponse] = await Promise.all([
        fetchWithAuth(`${runtimeConfig.getApiUrl("hrm")}/api/employee/me/security-status`),
        fetchWithAuth(`${runtimeConfig.getApiUrl("administrative")}/api/permission/current`),
      ]);
      const security = securityResponse.ok
        ? await securityResponse.json() as { roleAssigned?: boolean }
        : null;
      const permission = permissionResponse.ok
        ? await permissionResponse.json() as CurrentPermission
        : null;

      if (security?.roleAssigned === true && permission && hasHrmModuleAccess(permission)) {
        setAllowed(true);
        return;
      }
    } catch (error) {
      console.error("Unable to verify current HR Management access", error);
    }

    localStorageUtil.clearAuthorization();
    const portalUrl = runtimeConfig.getUiUrl("employee-portal").replace(/\/+$/, "");
    window.location.replace(`${portalUrl}/employee-portal/dashboard`);
  }, [pathname]);

  useEffect(() => {
    const handleFocus = () => void verifyCurrentAccess();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void verifyCurrentAccess();
    };
    void verifyCurrentAccess();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [verifyCurrentAccess]);

  return allowed ? <>{children}</> : null;
}
