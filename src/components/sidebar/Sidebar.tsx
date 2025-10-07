'use client'

import React from "react";
import { MenuItem } from "./MenuItem";
import styles from "@/styles/DashboardSidebar.module.scss";
import { usePathname } from 'next/navigation';
// import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
  {
    id: 1,
    icon: "/dashboard.png",
    label: "Dashboard",
    goto: "/hr-management/dashboard",
    isActive: true,
  },
  {
    id: 2,
    icon: "/time_keeping.png",
    label: "Daily Time Record",
    goto: "/hr-management/dtr",
    isActive: false,
  },
  {
    id: 3,
    icon: "/time_shift.png",
    label: "Work Schedule",
    goto: "/hr-management/workschedule",
    isActive: false,
  },
  {
    id: 4,
    icon: "/personal_info.png",
    label: "Employment Record",
    goto: "/hr-management/employmentrecord",
    isActive: false,
  },
];

const otherItems = [
  {
    id: 5,
    icon: "/accounts.png",
    label: "Accounts",
    goto: "/hr-management/accounts",
    isActive: false,
  },
  {
    id: 6,
    icon: "/help.png",
    label: "Help",
    goto: "/hr-management",
    isActive: false,
  },
];

export default function Sidebar() {
  const pathname = usePathname(); // Use usePathname for the current route
  // const router = useRouter();    // Use useRouter for navigation

  return (
    <nav className={styles.Sidebar} role="navigation" aria-label="Main navigation">
      <div className={styles.brand}>
        <div className={styles.brandIcon}>HRUI</div>
        <div className={styles.brandName}>Human Resource Management UI</div>
      </div>

      <div className={styles.menuSection}>
        <h2 className={styles.menuHeader}>MENU</h2>
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
            <MenuItem key={index} icon={item.icon} label={item.label} goto={item.goto} isActive={pathname === item.goto} onClick={() => {}} />
          ))}
        </div>
      </div>
    </nav>
  );
};
