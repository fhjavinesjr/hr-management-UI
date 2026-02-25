'use client'

import React from "react";
import { MenuItem } from "./MenuItem";
import styles from "@/styles/Sidebar.module.scss";
import { usePathname } from 'next/navigation';
import { authLogout } from "@/lib/utils/authLogout";
import { useRouter } from "next/navigation";


const menuItems = [
  {
    id: 1,
    icon: "/personal_info.png",
    label: "Employment Record",
    goto: "/hr-management/employmentrecord",
    isActive: false,
  },

  {
  id: 2,
  icon: "/LeaveApplication.png",
  label: "Leave Application",
  goto: "/hr-management/hrSelfService/Leave-Application",
  isActive: false,
  },

  {
    id: 3,
    icon: "/OvertimeRequest.png",
    label: "Overtime Request",
    goto: "/hr-management/hrSelfService/Overtime-Request",
    isActive: false,
  },

  {
    id: 4,
    icon: "/CompensatoryTimeOff.png",
    label: "Compensatory Time Off",
    goto: "/hr-management/hrSelfService/Compensatory-Time-Off",
    isActive: false,
  },

  {
    id: 5,
    icon: "/OfficialEngagement.png",
    label: "Official Engagement",
    goto: "/hr-management/hrSelfService/Official-Engagement",
    isActive: false,
  },

  {
    id: 6,
    icon: "/PassSlip.png",
    label: "Pass Slip",
    goto: "/hr-management/hrSelfService/Pass-Slip",
    isActive: false,
  },

  {
    id: 7,
    icon: "/TimeCorrection.png",
    label: "Time Correction",
    goto: "/hr-management/hrSelfService/Time-Correction",
    isActive: false,
  }
];

const otherItems = [
  {
    id: 2,
    icon: "/accounts.png",
    label: "Accounts",
    goto: "/hr-management/accounts",
    isActive: false,
  },
  {
    id: 3,
    icon: "/help.png",
    label: "Help",
    goto: "/hr-management",
    isActive: false,
  },
  {
    id: 4,
    icon: "/logout.png",
    label: "Logout",
    action: "logout",
  },
];

export default function Sidebar() {
  const pathname = usePathname(); // Use usePathname for the current route
  const router = useRouter();    // Use useRouter for navigation

  return (
    <nav className={styles.Sidebar} role="navigation" aria-label="Main navigation">
      <div className={styles.brand}>
        <div className={styles.brandIcon}>HRUI</div>
        <div className={styles.brandName}>Human Resource Management UI</div>
      </div>

      <div className={styles.menuSection}>
        <h2 className={styles.menuHeader}>HR ACTION CENTER</h2>
        <div role="menu">
          {menuItems.map((item, index) => (
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
