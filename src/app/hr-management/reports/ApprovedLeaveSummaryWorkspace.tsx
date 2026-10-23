"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { runtimeConfig } from "@/lib/utils/runtimeConfig";
import { openHrmPdf } from "@/lib/services/onboarding";
import styles from "@/styles/Onboarding.module.scss";
import reportStyles from "@/styles/HrmReports.module.scss";

type Area = { areasId: number; areasName: string };
type BusinessUnit = { businessUnitsId: number; businessUnitsName: string; areasId: number };
type LeaveType = { leaveTypesId: number; code: string; name: string };
type PayFilter = "ALL" | "WITH_PAY" | "WITHOUT_PAY";
const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function ApprovedLeaveSummaryWorkspace() {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [units, setUnits] = useState<BusinessUnit[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [from, setFrom] = useState(() => { const today = new Date(); today.setDate(1); return dateValue(today); });
  const [to, setTo] = useState(() => dateValue(new Date()));
  const [areaId, setAreaId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [payFilter, setPayFilter] = useState<PayFilter>("ALL");
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);
  const filteredUnits = useMemo(() => units.filter(unit => String(unit.areasId) === areaId), [units, areaId]);

  useEffect(() => {
    const permission = localStorageUtil.getFeaturePermission("hrm.reports.leaveSummary");
    const access = permission.canAccess && permission.dataScope === "AGENCY_WIDE";
    setAllowed(access); setReady(true);
    if (!access) return;
    let active = true;
    const admin = runtimeConfig.getApiUrl("administrative").replace(/\/+$/, "");
    Promise.all([
      fetchWithAuth(`${admin}/api/areas/get-all`),
      fetchWithAuth(`${admin}/api/businessUnits/get-all`),
      fetchWithAuth(`${admin}/api/leaveTypes/get-all`),
    ]).then(async responses => {
      if (responses.some(response => !response.ok)) throw new Error("Unable to load Areas, Business Units, or leave types.");
      const [areaRows, unitRows, typeRows] = await Promise.all([
        responses[0].json() as Promise<Area[]>, responses[1].json() as Promise<BusinessUnit[]>,
        responses[2].json() as Promise<LeaveType[]>]);
      if (active) { setAreas(areaRows); setUnits(unitRows); setLeaveTypes(typeRows); setError(""); }
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Report setup failed."); });
    return () => { active = false; };
  }, []);

  async function print() {
    if (!areaId || !from || !to || from > to) {
      await Swal.fire("Complete the filters", "Select a valid date range and Area.", "warning"); return;
    }
    const params = new URLSearchParams({ from, to, areaId, payFilter });
    if (unitId) params.set("businessUnitId", unitId);
    if (leaveType) params.set("leaveType", leaveType);
    setPrinting(true);
    try { await openHrmPdf(`/api/hrm/reports/approved-leave-summary?${params}`, "Approved_Leave_Summary.pdf"); }
    catch (cause) { await Swal.fire("Leave report failed", cause instanceof Error ? cause.message : "Please retry.", "error"); }
    finally { setPrinting(false); }
  }

  return <>
    <section className={styles.card}><h1>Approved Leave Summary</h1>
      <p>Lists finalized approved leave applications overlapping the selected dates. Choose paid, unpaid, or both.</p>
      {!ready ? <p>Checking report permission…</p> : !allowed ? <p role="alert">Agency-wide Leave Summary permission is required.</p> : <>
        {error && <div className={styles.notice} role="alert">{error}</div>}
        <div className={`${styles.grid} ${reportStyles.leaveFields}`}>
          <div className={styles.field}><label htmlFor="leaveReportFrom">Date from</label><input id="leaveReportFrom" type="date" value={from} onChange={event => setFrom(event.target.value)} /></div>
          <div className={styles.field}><label htmlFor="leaveReportTo">Date to</label><input id="leaveReportTo" type="date" value={to} onChange={event => setTo(event.target.value)} /></div>
          <div className={styles.field}><label htmlFor="leaveReportArea">Area</label><select id="leaveReportArea" value={areaId} onChange={event => { setAreaId(event.target.value); setUnitId(""); }}><option value="">Select Area</option>{areas.map(area => <option key={area.areasId} value={area.areasId}>{area.areasName}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="leaveReportUnit">Business Unit</label><select id="leaveReportUnit" value={unitId} disabled={!areaId} onChange={event => setUnitId(event.target.value)}><option value="">All Business Units</option>{filteredUnits.map(unit => <option key={unit.businessUnitsId} value={unit.businessUnitsId}>{unit.businessUnitsName}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="leaveReportType">Leave type</label><select id="leaveReportType" value={leaveType} onChange={event => setLeaveType(event.target.value)}><option value="">All leave types</option>{leaveTypes.map(type => <option key={type.leaveTypesId} value={type.name}>{type.name}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="leaveReportPay">Pay treatment</label><select id="leaveReportPay" value={payFilter} onChange={event => setPayFilter(event.target.value as PayFilter)}><option value="ALL">With and without pay</option><option value="WITH_PAY">With pay</option><option value="WITHOUT_PAY">Without pay</option></select></div>
        </div>
        <div className={`${styles.actions} ${reportStyles.reportActions}`}><button type="button" disabled={printing || Boolean(error)} onClick={() => void print()}>{printing ? "Preparing PDF…" : "Print Leave Summary"}</button></div>
        <p>The PDF displays full approved filing dates and days for leaves overlapping the range; it does not prorate a filing or calculate balances. Employee assignment uses the current Area/Business Unit—verify historical transfers.</p>
      </>}
    </section>
  </>;
}
