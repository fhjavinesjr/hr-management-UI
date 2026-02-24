'use client';

import React from "react";
import Main from "@/app/hr-management/main/Main";
import HROvertimeRequestModule from "./hrOvertimeRequest"; 

export default function HrOvertimeRequestPage() {
  return (
    <Main>
      <HROvertimeRequestModule />
    </Main>
  );
}