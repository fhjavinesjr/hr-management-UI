'use client'

import React, { useEffect } from "react";
import { MenuItem } from "./MenuItem";
import styles from "@/styles/Sidebar.module.scss";
import { usePathname } from 'next/navigation';
import { authLogout } from "@/lib/utils/authLogout";
import { useRouter } from "next/navigation";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";


const menuItems = [
  {
    id: 1,
    icon: "/personal_info.png",
    label: "Employment Record",
    goto: "/hr-management/employmentrecord",
    isActive: false,
    permKey: "hrm.employmentRecord",
  },

  {
    id: 2,
    icon: "/LeaveApplication.png",
    label: "Beginning Balance",
    goto: "/hr-management/hrSelfService/Beginning-Balance",
    isActive: false,
    permKey: "hrm.ss.beginBalance",
  },

  {
  id: 3,
  icon: "/LeaveApplication.png",
  label: "Leave Application",
  goto: "/hr-management/hrSelfService/Leave-Application",
  isActive: false,
  permKey: "hrm.ss.leaveApp",
  },

  {
    id: 4,
    icon: "/OvertimeRequest.png",
    label: "Overtime Request",
    goto: "/hr-management/hrSelfService/Overtime-Request",
    isActive: false,
    permKey: "hrm.ss.overtimeReq",
  },

  {
    id: 5,
    icon: "/CompensatoryTimeOff.png",
    label: "Compensatory Overtime Credit",
    goto: "/hr-management/hrSelfService/Compensatory-Overtime-Credit",
    isActive: false,
    permKey: "hrm.ss.coc",
  },

  {
    id: 6,
    icon: "/CompensatoryTimeOff.png",
    label: "Compensatory Time Off",
    goto: "/hr-management/hrSelfService/Compensatory-Time-Off",
    isActive: false,
    permKey: "hrm.ss.cto",
  },

  {
    id: 7,
    icon: "/OfficialEngagement.png",
    label: "Official Engagement",
    goto: "/hr-management/hrSelfService/Official-Engagement",
    isActive: false,
    permKey: "hrm.ss.officialEngag",
  },

  {
    id: 8,
    icon: "/PassSlip.png",
    label: "Pass Slip",
    goto: "/hr-management/hrSelfService/Pass-Slip",
    isActive: false,
    permKey: "hrm.ss.passSlip",
  },

  {
    id: 9,
    icon: "/TimeCorrection.png",
    label: "Time Correction",
    goto: "/hr-management/hrSelfService/Time-Correction",
    isActive: false,
    permKey: "hrm.ss.timeCorrection",
  },

  {
    id: 10,
    icon: "/LeaveApplication.png",
    label: "Leave Information",
    goto: "/hr-management/Leave-Information",
    isActive: false,
    permKey: "hrm.leaveInformation",
  },

  {
    id: 11,
    icon: "/accounts.png",
    label: "Plantilla Monitoring",
    goto: "/hr-management/plantilla",
    isActive: false,
    adminOnly: true,
    permKey: "hrm.plantillaMonitoring",
  },
];

const otherItems = [
  {
    id: 1,
    icon: "/help.png",
    label: "Help",
    goto: "/hr-management",
    isActive: false,
  },
  {
    id: 2,
    icon: "/logout.png",
    label: "Logout",
    action: "logout",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {}, []); // keep effect hook for future use

  const visibleMenuItems = menuItems.filter(item => localStorageUtil.canAccess(item.permKey));

  return (
    <nav className={styles.Sidebar} role="navigation" aria-label="Main navigation">
      <div className={styles.brand}>
        <div className={styles.brandIcon}>HRUI</div>
        <div className={styles.brandName}>Human Resource Management UI</div>
      </div>

      <div className={styles.menuSection}>
        <h2 className={styles.menuHeader}>HR ACTION CENTER</h2>
        <div role="menu">
          {visibleMenuItems.map((item, index) => (
            <MenuItem key={index} icon={item.icon} label={item.label} goto={item.goto} isActive={pathname === item.goto} onClick={() => {}} />
          ))}
        </div>
      </div>

      <div className={styles.menuSection}>
        <h2 className={styles.menuHeader}>UTILITIES</h2>
        <div role="menu">
          {otherItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.goto}
              onClick={() => {
                if (item.action === "logout") {
                  authLogout();
                  router.replace("/time-keeping/login");
                } else if (item.goto) {
                  router.push(item.goto);
                }
              }}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};
