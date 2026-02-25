"use client";

import React from "react";
import Main from "@/app/hr-management/main/Main";
import HRLeaveApplicationModule from "./hrLeaveApplication"; // correct component name

export default function HrLeaveApplicationPage() {
  return (
    <Main>
      <HRLeaveApplicationModule />
    </Main>
  );
}