"use client";

import { runtimeConfig } from "@/lib/utils/runtimeConfig";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import styles from "@/styles/EmploymentRecord.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import tableStyles from "@/styles/tables.module.scss";
import { Employee } from "@/lib/types/Employee";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import ApprovalSection, {
  ApprovalSectionData,
} from "@/lib/approvalSection/approvalSection";

const API_BASE_URL_HRM = runtimeConfig.getApiUrl("hrm");
const API_BASE_URL_ADMINISTRATIVE = runtimeConfig.getApiUrl("administrative");
const API_BASE_URL_TIMEKEEPING = runtimeConfig.getApiUrl("timekeeping");

const SPECIAL_DUTY_TYPES = ["HOLIDAY_DUTY", "DAY_OFF_DUTY", "REST_DAY_DUTY"];

interface TimeShiftDTO {
  tsCode: string;
  tsName?: string;
  timeIn: string;
  breakOut?: string | null;
  breakIn?: string | null;
  timeOut: string;
}

interface WorkScheduleDTO {
  tsCode?: string | null;
  wsDateTime: string;
  isDayOff?: boolean;
}

interface OvertimeRequestDTO {
  overtimeRequestId?: number;
  employeeId: number;
  dateFiled: string;
  dateTimeFrom: string;
  dateTimeTo: string;
  totalHours?: number;
  purpose: string;
  status: string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalRemarks?: string | null;
  recommendationStatus?: string | null;
  recommendedById?: number | null;
  recommendationRemarks?: string | null;
  workType?: string;
  dutyShiftCode?: string | null;
  authorityReference?: string;
  emergencyPostFiling?: boolean;
  emergencyJustification?: string;
  breakMinutes?: number;
  netAuthorizedHours?: number;
}

interface FormState {
  dateFiled: string;
  dateTimeFrom: string;
  dateTimeTo: string;
  purpose: string;
  workType: string;
  dutyShiftCode: string;
  authorityReference: string;
  emergencyPostFiling: boolean;
  emergencyJustification: string;
  breakMinutes: string;
}

const clockMinutes = (value?: string | null) => {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const localDateKey = (value?: string | null) => {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

const toLocalDateTimeValue = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatWorkScheduleParameter = (value: Date) =>
  `${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}-${value.getFullYear()} ${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;

const parseWorkScheduleDateTime = (value: string) => {
  const match = value?.match(/^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    return new Date(
      Number(match[3]),
      Number(match[1]) - 1,
      Number(match[2]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
    );
  }
  return new Date(value);
};

const shiftDateTimes = (dateKey: string, shift: TimeShiftDTO) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const timeIn = clockMinutes(shift.timeIn);
  const timeOut = clockMinutes(shift.timeOut);
  if (!year || !month || !day || timeIn === null || timeOut === null) return null;

  const from = new Date(year, month - 1, day, 0, 0, 0, 0);
  from.setMinutes(timeIn);
  const to = new Date(year, month - 1, day, 0, 0, 0, 0);
  to.setMinutes(timeOut);
  if (to <= from) to.setDate(to.getDate() + 1);
  return { from: toLocalDateTimeValue(from), to: toLocalDateTimeValue(to) };
};

const shiftBreakMinutes = (shift: TimeShiftDTO) => {
  const start = clockMinutes(shift.breakOut);
  const end = clockMinutes(shift.breakIn);
  if (start === null || end === null) return 0;
  return end >= start ? end - start : end + 24 * 60 - start;
};

const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function HROvertimeRequestModule() {
  const canAdd = localStorageUtil.canAdd("hrm.ss.overtimeReq");
  const canEdit = localStorageUtil.canEdit("hrm.ss.overtimeReq");
  const canDelete = localStorageUtil.canDelete("hrm.ss.overtimeReq");
  const [activeTab, setActiveTab] = useState<"table" | "apply">("table");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const [records, setRecords] = useState<OvertimeRequestDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeShifts, setTimeShifts] = useState<TimeShiftDTO[]>([]);
  const [timeSuggestionMessage, setTimeSuggestionMessage] = useState("");
  const [regularSuggestionVersion, setRegularSuggestionVersion] = useState(0);
  const processedRegularSuggestion = useRef(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [approvalData, setApprovalData] = useState<ApprovalSectionData>({
    recommendationStatus: "Pending",
    recommendationMessage: "",
    recommendingApprovalById: null,
    authorizedOfficialId: null,
    approvedById: null,
    approvedStatus: "Pending",
    approvalMessage: "",
    dueExigencyService: false,
  });
  const [approvalInitialValues, setApprovalInitialValues] = useState<
    Partial<ApprovalSectionData> | undefined
  >(undefined);

  const today = localDateKey();
  const nowLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return toLocalDateTimeValue(now);
  };

  const [form, setForm] = useState<FormState>({
    dateFiled: today,
    dateTimeFrom: nowLocal(),
    dateTimeTo: nowLocal(),
    purpose: "",
    workType: "REGULAR_OVERTIME",
    dutyShiftCode: "",
    authorityReference: "",
    emergencyPostFiling: false,
    emergencyJustification: "",
    breakMinutes: "0",
  });

  const applyDutyShiftSuggestion = useCallback((shiftCode: string, dateKey?: string) => {
    const shift = timeShifts.find((item) => item.tsCode === shiftCode);
    if (!shift) {
      setTimeSuggestionMessage(shiftCode ? "The selected Duty Shift could not be loaded." : "");
      return;
    }
    const suggestion = shiftDateTimes(dateKey ?? localDateKey(form.dateTimeFrom), shift);
    if (!suggestion) {
      setTimeSuggestionMessage("The selected Duty Shift has an invalid time-in or time-out.");
      return;
    }
    setForm((current) => ({
      ...current,
      dutyShiftCode: shiftCode,
      dateTimeFrom: suggestion.from,
      dateTimeTo: suggestion.to,
      breakMinutes: String(shiftBreakMinutes(shift)),
    }));
    setTimeSuggestionMessage(
      `Suggested from Duty Shift ${shift.tsCode}: ${shift.timeIn}–${shift.timeOut}. The officer may adjust the inclusive dates, times, and break.`,
    );
  }, [form.dateTimeFrom, timeShifts]);

  const requestRegularSuggestion = useCallback(() => {
    setRegularSuggestionVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (
      form.workType !== "REGULAR_OVERTIME" ||
      regularSuggestionVersion === 0 ||
      processedRegularSuggestion.current === regularSuggestionVersion ||
      timeShifts.length === 0 ||
      !selectedEmployee
    ) return;

    processedRegularSuggestion.current = regularSuggestionVersion;
    const dateKey = localDateKey(form.dateTimeFrom);
    const [year, month, day] = dateKey.split("-").map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 0);
    let cancelled = false;

    const loadSuggestion = async () => {
      setTimeSuggestionMessage("Checking the employee's assigned Work Schedule…");
      try {
        const params = new URLSearchParams({
          employeeId: String(selectedEmployee.employeeId),
          monthStart: formatWorkScheduleParameter(dayStart),
          monthEnd: formatWorkScheduleParameter(dayEnd),
        });
        const response = await fetchWithAuth(
          `${API_BASE_URL_TIMEKEEPING}/api/getListByEmployeeAndDateRange/work-schedule?${params.toString()}`,
        );
        if (!response.ok && response.status !== 204) {
          throw new Error(`Work Schedule checker returned HTTP ${response.status}.`);
        }
        const schedules: WorkScheduleDTO[] = response.status === 204 ? [] : await response.json();
        const candidates = schedules
          .filter((schedule) => !schedule.isDayOff && schedule.tsCode)
          .map((schedule) => {
            const shift = timeShifts.find(
              (item) => item.tsCode.trim().toUpperCase() === schedule.tsCode!.trim().toUpperCase(),
            );
            if (!shift) return null;
            const scheduleDate = parseWorkScheduleDateTime(schedule.wsDateTime);
            if (Number.isNaN(scheduleDate.getTime())) return null;
            const scheduleKey = `${scheduleDate.getFullYear()}-${pad2(scheduleDate.getMonth() + 1)}-${pad2(scheduleDate.getDate())}`;
            if (scheduleKey !== dateKey) return null;
            const bounds = shiftDateTimes(dateKey, shift);
            return bounds ? { shift, bounds } : null;
          })
          .filter((candidate): candidate is { shift: TimeShiftDTO; bounds: { from: string; to: string } } => candidate !== null)
          .sort((left, right) => new Date(right.bounds.to).getTime() - new Date(left.bounds.to).getTime());

        if (cancelled) return;
        const selected = candidates[0];
        if (!selected) {
          setTimeSuggestionMessage("No working Time Shift is plotted for this employee on the selected date.");
          return;
        }
        setForm((current) => {
          if (current.workType !== "REGULAR_OVERTIME" || localDateKey(current.dateTimeFrom) !== dateKey) return current;
          return { ...current, dateTimeFrom: selected.bounds.to, dateTimeTo: "", breakMinutes: "0" };
        });
        setTimeSuggestionMessage(
          `Suggested overtime start after assigned shift ${selected.shift.tsCode} ends at ${selected.shift.timeOut}. Enter the expected overtime end.`,
        );
      } catch (error) {
        if (!cancelled) {
          setTimeSuggestionMessage(
            error instanceof Error ? error.message : "Unable to load the assigned Work Schedule.",
          );
        }
      }
    };
    void loadSuggestion();
    return () => { cancelled = true; };
  }, [form.dateTimeFrom, form.workType, regularSuggestionVersion, selectedEmployee, timeShifts]);

  useEffect(() => {
    if (activeTab === "apply" && editingId === null && selectedEmployee && form.workType === "REGULAR_OVERTIME") {
      requestRegularSuggestion();
    }
  }, [activeTab, editingId, selectedEmployee?.employeeId]);

  const handleWorkTypeChange = (workType: string) => {
    const dateKey = localDateKey(form.dateTimeFrom);
    setTimeSuggestionMessage("");
    if (workType === "REGULAR_OVERTIME") {
      setForm((current) => ({
        ...current,
        workType,
        dutyShiftCode: "",
        breakMinutes: "0",
        ...(editingId === null ? { dateTimeFrom: `${dateKey}T00:00`, dateTimeTo: "" } : {}),
      }));
      if (editingId === null) requestRegularSuggestion();
      else setTimeSuggestionMessage("Saved inclusive dates were retained. Use Reapply suggestion only if the schedule should replace them.");
      return;
    }
    setForm((current) => ({ ...current, workType, dutyShiftCode: "" }));
  };

  const handleDutyShiftChange = (shiftCode: string) => {
    const shift = timeShifts.find((item) => item.tsCode === shiftCode);
    setForm((current) => ({
      ...current,
      dutyShiftCode: shiftCode,
      breakMinutes: shift ? String(shiftBreakMinutes(shift)) : "0",
    }));
    if (!shiftCode) {
      setTimeSuggestionMessage("");
    } else if (editingId === null) {
      applyDutyShiftSuggestion(shiftCode);
    } else {
      setTimeSuggestionMessage("Duty Shift selected; the request's saved inclusive dates were retained. Use Reapply suggestion only when appropriate.");
    }
  };

  const handleDateTimeFromChange = (value: string) => {
    if (!value) {
      setForm((current) => ({ ...current, dateTimeFrom: "" }));
      return;
    }
    const oldDate = localDateKey(form.dateTimeFrom);
    const newDate = localDateKey(value);
    if (editingId === null && newDate !== oldDate && SPECIAL_DUTY_TYPES.includes(form.workType) && form.dutyShiftCode) {
      applyDutyShiftSuggestion(form.dutyShiftCode, newDate);
      return;
    }
    if (editingId === null && newDate !== oldDate && form.workType === "REGULAR_OVERTIME") {
      setForm((current) => ({ ...current, dateTimeFrom: value, dateTimeTo: "" }));
      requestRegularSuggestion();
      return;
    }
    setForm((current) => ({ ...current, dateTimeFrom: value }));
  };

  const reapplyTimeSuggestion = () => {
    if (SPECIAL_DUTY_TYPES.includes(form.workType) && form.dutyShiftCode) {
      applyDutyShiftSuggestion(form.dutyShiftCode);
    } else if (form.workType === "REGULAR_OVERTIME") {
      requestRegularSuggestion();
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadTimeShifts = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/getAll/time-shift`);
        if (!response.ok) throw new Error();
        const data: TimeShiftDTO[] = await response.json();
        if (!cancelled) setTimeShifts(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setTimeShifts([]);
      }
    };
    void loadTimeShifts();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const stored = localStorageUtil.getEmployees();
    if (stored && stored.length > 0) setEmployees(stored);
    const role = localStorageUtil.getEmployeeRole();
    const fullname = localStorageUtil.getEmployeeFullname();
    const empNo = localStorageUtil.getEmployeeNo();
    const employeeId = localStorageUtil.getEmployeeId();
    setUserRole(role);
    if (
      empNo &&
      ((!canAdd && !canEdit) || (canAdd && !canEdit) || (!canAdd && canEdit))
    ) {
      const empFromList = stored?.find((e) => e.employeeNo === empNo) ?? null;
      if (empFromList) {
        setSelectedEmployee(empFromList);
        setSearch(`[${empFromList.employeeNo}] ${empFromList.fullName}`);
      } else if (fullname) {
        const own: Employee = {
          employeeId: String(employeeId ?? ""),
          employeeNo: empNo,
          fullName: fullname,
          role: role ?? "",
          biometricNo: "",
          isSearched: false,
          isCleared: false,
        };
        setSelectedEmployee(own);
        setSearch(`[${empNo}] ${fullname}`);
      }
    }
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeNo.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, employees]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (dateFrom && r.dateFiled && r.dateFiled < dateFrom) return false;
      if (dateTo && r.dateFiled && r.dateFiled > dateTo) return false;
      return true;
    });
  }, [records, dateFrom, dateTo]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const duration = useMemo(() => {
    if (!form.dateTimeFrom || !form.dateTimeTo) return null;
    const start = new Date(form.dateTimeFrom);
    const end = new Date(form.dateTimeTo);
    if (end <= start) return null;
    const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
  }, [form.dateTimeFrom, form.dateTimeTo]);

  const fetchRecords = useCallback(async (emp: Employee) => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/overtime-request/get-all/${emp.employeeId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch overtime requests");
      const data: OvertimeRequestDTO[] = await res.json();
      setRecords(data);
    } catch {
      Toast.fire({ icon: "error", title: "Could not load overtime records" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchRecords(selectedEmployee);
    } else {
      setRecords([]);
    }
  }, [selectedEmployee, fetchRecords]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedEmployee, itemsPerPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      Swal.fire({ icon: "warning", title: "No employee selected" });
      return;
    }
    if (!duration || (duration.hours <= 0 && duration.minutes <= 0)) {
      Swal.fire({
        icon: "warning",
        title: "End time must be after start time",
      });
      return;
    }
    if (!form.purpose.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Purpose / justification is required",
      });
      return;
    }
    if (SPECIAL_DUTY_TYPES.includes(form.workType) && !form.dutyShiftCode) {
      Swal.fire({ icon: "warning", title: "Duty Shift is required for non-working-day duty" });
      return;
    }

    // A new emergency filing uses the dedicated override-create endpoint.
    // Existing records remain editable through the HRM maintenance endpoint,
    // which applies the administrator's selected workflow values directly.
    const isEmergencyOverride = Boolean(
      form.emergencyPostFiling && editingId === null,
    );
    const desiredRecommendation = (approvalData.recommendationStatus || "Pending").toLowerCase();
    const desiredFinalStatus = (approvalData.approvedStatus || "Pending").toLowerCase();
    const wantsRecommendation =
      desiredRecommendation === "approved" || desiredRecommendation === "recommended";
    const wantsFinalDecision =
      desiredFinalStatus === "approved" || desiredFinalStatus === "disapproved";

    if (!isEmergencyOverride && wantsRecommendation && !approvalData.recommendingApprovalById) {
      Swal.fire({ icon: "warning", title: "Select the IS recommending officer" });
      return;
    }
    if (!isEmergencyOverride && wantsFinalDecision && !approvalData.approvedById) {
      Swal.fire({ icon: "warning", title: "Select the final approving officer" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: OvertimeRequestDTO = {
        employeeId: Number(selectedEmployee.employeeId),
        dateFiled: form.dateFiled,
        dateTimeFrom: form.dateTimeFrom.replace("T", " ") + ":00",
        dateTimeTo: form.dateTimeTo.replace("T", " ") + ":00",
        purpose: form.purpose,
        workType: form.workType,
        dutyShiftCode: form.dutyShiftCode || null,
        authorityReference: form.authorityReference,
        emergencyPostFiling: form.emergencyPostFiling,
        emergencyJustification: form.emergencyJustification,
        breakMinutes: Number(form.breakMinutes || 0),
        status: approvalData.approvedStatus || "Pending",
        approvedById: approvalData.approvedById,
        approvalRemarks: approvalData.approvalMessage,
        recommendationStatus: approvalData.recommendationStatus || "Pending",
        recommendedById: approvalData.recommendingApprovalById,
        recommendationRemarks: approvalData.recommendationMessage,
      };

      const send = async (url: string, method: "POST" | "PUT", body: unknown) => {
        const response = await fetchWithAuth(url, {
          method,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Request failed with HTTP ${response.status}`);
        }
        return response;
      };

      let savedId = editingId;

      if (isEmergencyOverride) {
        const response = await send(
          `${API_BASE_URL_HRM}/api/overtime-request/admin-override/create`,
          "POST",
          payload,
        );
        const metadata = (await response.json()) as { metaId?: number };
        savedId = metadata.metaId ?? null;
      } else if (editingId === null) {
        const response = await send(
          `${API_BASE_URL_HRM}/api/overtime-request/create`,
          "POST",
          {
            ...payload,
            status: "Pending",
            approvedById: null,
            approvalRemarks: null,
            recommendationStatus: "Pending",
            recommendedById: null,
            recommendationRemarks: null,
          },
        );
        const metadata = (await response.json()) as { metaId?: number };
        savedId = metadata.metaId ?? null;
      } else {
        // HRM maintenance edit is status-independent and applies the exact
        // recommendation/final status selected by the administrator.
        await send(
          `${API_BASE_URL_HRM}/api/overtime-request/hrm-update/${editingId}`,
          "PUT",
          payload,
        );
      }

      if (!savedId) throw new Error("Overtime request ID is missing.");

      if (!isEmergencyOverride && editingId === null) {
        // Normal create is intentionally Pending for the employee-safe API.
        // Apply the HRM-selected workflow values through the admin endpoint
        // immediately after the record ID is returned.
        await send(
          `${API_BASE_URL_HRM}/api/overtime-request/hrm-update/${savedId}`,
          "PUT",
          payload,
        );
      }

      Toast.fire({
        icon: "success",
        title: editingId !== null
          ? "Overtime request updated"
          : "Overtime request filed successfully",
      });
      setForm({
        dateFiled: today,
        dateTimeFrom: nowLocal(),
        dateTimeTo: nowLocal(),
        purpose: "",
        workType: "REGULAR_OVERTIME",
        dutyShiftCode: "",
        authorityReference: "",
        emergencyPostFiling: false,
        emergencyJustification: "",
        breakMinutes: "0",
      });
      setTimeSuggestionMessage("");
      setEditingId(null);
      setApprovalInitialValues(undefined);
      setApprovalData({
        recommendationStatus: "Pending",
        recommendationMessage: "",
        recommendingApprovalById: null,
        authorizedOfficialId: null,
        approvedById: null,
        approvedStatus: "Pending",
        approvalMessage: "",
        dueExigencyService: false,
      });
      setActiveTab("table");
      fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to file overtime request",
        text: String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (r: OvertimeRequestDTO) => {
    const toLocal = (dt: string | null | undefined) => {
      if (!dt) return nowLocal();
      return dt.replace(" ", "T").substring(0, 16);
    };
    setForm({
      dateFiled: r.dateFiled ?? today,
      dateTimeFrom: toLocal(r.dateTimeFrom as unknown as string),
      dateTimeTo: toLocal(r.dateTimeTo as unknown as string),
      purpose: r.purpose,
      workType: r.workType ?? "REGULAR_OVERTIME",
      dutyShiftCode: r.dutyShiftCode ?? "",
      authorityReference: r.authorityReference ?? "",
      emergencyPostFiling: r.emergencyPostFiling ?? false,
      emergencyJustification: r.emergencyJustification ?? "",
      breakMinutes: String(r.breakMinutes ?? 0),
    });
    setTimeSuggestionMessage("Saved inclusive dates and times are shown. Approval review will not replace them automatically.");
    const initVals: Partial<ApprovalSectionData> = {
      approvedStatus: r.status ?? "Pending",
      approvalMessage: r.approvalRemarks ?? "",
      approvedById: r.approvedById ?? null,
      recommendationStatus:
        (r.recommendationStatus ?? "Pending").toLowerCase() === "recommended"
          ? "Approved"
          : r.recommendationStatus ?? "Pending",
      recommendationMessage: r.recommendationRemarks ?? "",
      recommendingApprovalById: r.recommendedById ?? null,
      authorizedOfficialId: null,
      dueExigencyService: false,
    };
    setApprovalInitialValues(initVals);
    setApprovalData((prev) => ({ ...prev, ...initVals }));
    setEditingId(r.overtimeRequestId!);
    setActiveTab("apply");
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: "Delete this overtime request?",
      text: "HRM deletion is allowed regardless of workflow status and cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/overtime-request/hrm-delete/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(await res.text());
      Toast.fire({ icon: "success", title: "Record deleted" });
      if (selectedEmployee) fetchRecords(selectedEmployee);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: String(err) });
    }
  };

  const handlePrint = async (id?: number, status?: string) => {
    if (!id) return;
    const normalizedStatus = (status ?? "").toLowerCase();
    if (normalizedStatus !== "approved" && normalizedStatus !== "disapproved") {
      Toast.fire({
        icon: "warning",
        title: "Only approved/disapproved requests can be printed",
      });
      return;
    }

    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL_HRM}/api/overtime-request/report/${id}`,
      );
      if (!response.ok) throw new Error("Failed to generate overtime report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `OvertimeAuthorization_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Print failed", text: String(error) });
    }
  };

  const handleClear = () => {
    setSearch("");
    setSelectedEmployee(null);
    setRecords([]);
    setShowSuggestions(false);
    setEditingId(null);
    setApprovalInitialValues(undefined);
    setApprovalData({
      recommendationStatus: "Pending",
      recommendationMessage: "",
      recommendingApprovalById: null,
      authorizedOfficialId: null,
      approvedById: null,
      approvedStatus: "Pending",
      approvalMessage: "",
      dueExigencyService: false,
    });
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
    setTimeSuggestionMessage("");
    setActiveTab("table");
  };

  const statusBadge = (status: string, recommendationStatus?: string | null) => {
    const displayStatus =
      status === "Pending" && ["recommended", "approved"].includes(
        recommendationStatus?.toLowerCase() ?? "",
      )
        ? "For Final Approval"
        : status === "Pending"
          ? "For IS Recommendation"
          : status;
    const color =
      status === "Approved"
        ? "#16a34a"
        : status === "Disapproved"
          ? "#dc2626"
          : status === "Cancelled"
            ? "#6b7280"
          : displayStatus === "For Final Approval"
            ? "#2563eb"
            : "#ca8a04";
    return (
      <span style={{ color, fontWeight: 600, fontSize: "0.8rem" }}>
        {displayStatus}
      </span>
    );
  };

  const fmtDateTime = (dt: string | null | undefined) => {
    if (!dt) return "—";
    return dt.replace("T", " ").substring(0, 16);
  };

  return (
    <div className={modalStyles.Modal}>
      <div className={modalStyles.modalContent}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.mainTitle}>Overtime Request</h2>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={styles.EmploymentRecord}>
            <div className={styles.stickyHeader}>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.formGroup} style={{ width: "auto" }}>
                  <label>Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div
                  className={styles.formGroup}
                  style={{ flex: 1, minWidth: "220px", position: "relative" }}
                >
                  <label>Search Employee</label>
                  <input
                    id="overtime-employee"
                    type="text"
                    list={"overtime-employee-list"}
                    placeholder="Employee No / Last Name"
                    value={search}
                    readOnly={
                      (!canAdd && !canEdit) ||
                      (canAdd && !canEdit) ||
                      (!canAdd && canEdit)
                    }
                    onChange={(e) => {
                      if (
                        (!canAdd && !canEdit) ||
                        (canAdd && !canEdit) ||
                        (!canAdd && canEdit)
                      )
                        return;
                      setSearch(e.target.value);
                      const match = employees.find(
                        (emp) =>
                          `[${emp.employeeNo}] ${emp.fullName}`.toLowerCase() ===
                          e.target.value.toLowerCase(),
                      );
                      if (match) {
                        setSelectedEmployee(match);
                      } else {
                        setSelectedEmployee(null);
                      }
                    }}
                    className={styles.searchInput}
                    style={{ width: "100%" }}
                  />
                  {
                    <datalist id="overtime-employee-list">
                      {employees.map((emp) => (
                        <option
                          key={emp.employeeNo}
                          value={`[${emp.employeeNo}] ${emp.fullName}`}
                        />
                      ))}
                    </datalist>
                  }
                </div>
                <div
                  style={{
                    alignSelf: "flex-end",
                    marginBottom: "20px",
                    marginLeft: "1rem",
                  }}
                >
                  <button onClick={handleClear} className={styles.clearButton}>
                    Clear
                  </button>
                </div>
              </div>

              <div className={styles.tabsHeader}>
                <button
                  className={activeTab === "table" ? styles.active : ""}
                  onClick={() => setActiveTab("table")}
                >
                  Records
                </button>
                {canAdd && (
                  <button
                    className={activeTab === "apply" ? styles.active : ""}
                    onClick={() => {
                      setEditingId(null);
                      setApprovalInitialValues(undefined);
                      setApprovalData({
                        recommendationStatus: "Pending",
                        recommendationMessage: "",
                        recommendingApprovalById: null,
                        authorizedOfficialId: null,
                        approvedById: null,
                        approvedStatus: "Pending",
                        approvalMessage: "",
                        dueExigencyService: false,
                      });
                      setActiveTab("apply");
                    }}
                  >
                    File Request
                  </button>
                )}
              </div>
            </div>

            <div className={styles.tabContent}>
              {activeTab === "table" && (
                <>
                  <h3>
                    {selectedEmployee
                      ? `Overtime Requests — ${selectedEmployee.fullName}`
                      : "Search and select an employee"}
                  </h3>
                  {isLoading && <p>Loading...</p>}
                  {!isLoading && selectedEmployee && records.length === 0 && (
                    <p>No overtime request records found.</p>
                  )}
                  <div className={tableStyles.paginationContainer}>
                    <div className={tableStyles.paginationLeft}>
                      <label>Rows per page: </label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        {[25, 50, 100, 300, 500].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <span className={tableStyles.recordInfo}>
                        Showing{" "}
                        {filteredRecords.length === 0 ? 0 : startIndex + 1} to{" "}
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredRecords.length,
                        )}{" "}
                        of {filteredRecords.length}
                      </span>
                    </div>
                    <div className={tableStyles.paginationRight}>
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={tableStyles.paginationBtn}
                      >
                        First
                      </button>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className={tableStyles.paginationBtn}
                      >
                        Previous
                      </button>
                      <span className={tableStyles.pageIndicator}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className={tableStyles.paginationBtn}
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={tableStyles.paginationBtn}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                  {!isLoading && filteredRecords.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.85rem",
                        }}
                      >
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={th}>Date Filed</th>
                            <th style={th}>From</th>
                            <th style={th}>To</th>
                            <th style={th}>Authorized Hours</th>
                            <th style={th}>Purpose</th>
                            <th style={th}>Status</th>
                            <th style={th}>Remarks</th>
                            <th style={th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRecords.map((r) => (
                            <tr
                              key={r.overtimeRequestId}
                              style={{ borderBottom: "1px solid #e2e8f0" }}
                            >
                              <td style={td}>{r.dateFiled}</td>
                              <td style={td}>{fmtDateTime(r.dateTimeFrom)}</td>
                              <td style={td}>{fmtDateTime(r.dateTimeTo)}</td>
                              <td style={td}>{(r.netAuthorizedHours ?? r.totalHours ?? 0).toFixed(2)} hrs</td>
                              <td style={td}>{r.purpose}</td>
                              <td style={td}>{statusBadge(r.status, r.recommendationStatus)}</td>
                              <td style={td}>{r.approvalRemarks ?? "—"}</td>
                              <td style={td}>
                                {/* HRM Edit/Delete intentionally have no status condition. */}
                                {(r.status === "Approved" ||
                                  r.status === "Disapproved") && (
                                  <button
                                    onClick={() =>
                                      handlePrint(r.overtimeRequestId, r.status)
                                    }
                                    style={btnPrint}
                                  >
                                    Print
                                  </button>
                                )}
                                {canEdit && (
                                  <button
                                    onClick={() => handleEdit(r)}
                                    style={btnEdit}
                                  >
                                    Edit
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() =>
                                      handleDelete(r.overtimeRequestId!)
                                    }
                                    style={btnDelete}
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "apply" && (
                <>
                  <h3>
                    File Overtime Request
                    {selectedEmployee ? ` — ${selectedEmployee.fullName}` : ""}
                    {editingId ? " (Editing)" : ""}
                  </h3>
                  {!selectedEmployee && (
                    <p style={{ color: "#dc2626" }}>
                      Please search and select an employee first.
                    </p>
                  )}
                  {selectedEmployee && (
                    <form
                      onSubmit={handleSubmit}
                      style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}
                    >
                      <div className={styles.formGroup}>
                        <label>Date Filed</label>
                        <input
                          type="date"
                          value={form.dateFiled}
                          onChange={(e) =>
                            setForm({ ...form, dateFiled: e.target.value })
                          }
                          className={styles.inputField}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Duty / Work Type</label>
                        <select
                          value={form.workType}
                          onChange={(e) => handleWorkTypeChange(e.target.value)}
                          className={styles.inputField}
                          required
                        >
                          <option value="REGULAR_OVERTIME">
                            Regular Workday Overtime
                          </option>
                          <option value="HOLIDAY_DUTY">Holiday Duty</option>
                          <option value="DAY_OFF_DUTY">
                            Scheduled Day-Off Duty
                          </option>
                          <option value="REST_DAY_DUTY">Rest-Day Duty</option>
                        </select>
                      </div>
                      {SPECIAL_DUTY_TYPES.includes(form.workType) && (
                        <div className={styles.formGroup}>
                          <label>Duty Shift Template</label>
                          <select
                            value={form.dutyShiftCode}
                            onChange={(e) => handleDutyShiftChange(e.target.value)}
                            className={styles.inputField}
                            required
                          >
                            <option value="">Select configured duty shift</option>
                            {timeShifts.map((shift) => (
                              <option key={shift.tsCode} value={shift.tsCode}>
                                {shift.tsCode}{shift.tsName ? ` — ${shift.tsName}` : ""} ({shift.timeIn}–{shift.timeOut})
                              </option>
                            ))}
                          </select>
                          <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                            Used as the expected duty plan; it does not replace the regular Work Schedule or Day-Off marker.
                          </span>
                        </div>
                      )}
                      <div className={styles.formGroup}>
                        <label>Authority / Office Order Reference</label>
                        <input
                          value={form.authorityReference}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              authorityReference: e.target.value,
                            })
                          }
                          className={styles.inputField}
                          placeholder="e.g. Office Order No. 2026-015"
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Inclusive Date &amp; Time — From</label>
                        <input
                          type="datetime-local"
                          value={form.dateTimeFrom}
                          onChange={(e) => handleDateTimeFromChange(e.target.value)}
                          className={styles.inputField}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Inclusive Date &amp; Time — To</label>
                        <input
                          type="datetime-local"
                          value={form.dateTimeTo}
                          min={form.dateTimeFrom}
                          onChange={(e) =>
                            setForm({ ...form, dateTimeTo: e.target.value })
                          }
                          className={styles.inputField}
                          required
                        />
                      </div>
                      <div style={{ marginTop: "-0.35rem", color: "#64748b", fontSize: "0.8rem" }}>
                        {timeSuggestionMessage && <span>{timeSuggestionMessage}</span>}
                        {(form.workType === "REGULAR_OVERTIME" || (SPECIAL_DUTY_TYPES.includes(form.workType) && form.dutyShiftCode)) && (
                          <button
                            type="button"
                            onClick={reapplyTimeSuggestion}
                            style={{ marginLeft: timeSuggestionMessage ? "0.45rem" : 0, border: 0, padding: 0, color: "#2563eb", background: "transparent", cursor: "pointer", textDecoration: "underline", fontSize: "0.8rem" }}
                          >
                            Reapply suggestion
                          </button>
                        )}
                      </div>
                      <div className={styles.formGroup}>
                        <label>Non-creditable Break (minutes)</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.breakMinutes}
                          onChange={(e) =>
                            setForm({ ...form, breakMinutes: e.target.value })
                          }
                          className={styles.inputField}
                          required
                        />
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
                          Auto-filled from the selected Duty Shift&apos;s break-out and break-in; the authorized officer may adjust it when the actual approved interval requires a different deduction.
                        </span>
                      </div>
                      <label
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.emergencyPostFiling}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              emergencyPostFiling: e.target.checked,
                            })
                          }
                        />{" "}
                        Emergency / Post-filing authority
                      </label>
                      <span style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "-0.45rem" }}>
                        {editingId === null
                          ? "For a new HRM filing, this is the authorized administrative override path. Employee Portal post-filing requests remain in the normal IS-to-Final workflow."
                          : "Existing Portal post-filing requests retain the normal IS recommendation and final approval workflow."}
                      </span>
                      {form.emergencyPostFiling && (
                        <div className={styles.formGroup}>
                          <label>Emergency / Post-filing Justification</label>
                          <textarea
                            value={form.emergencyJustification}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                emergencyJustification: e.target.value,
                              })
                            }
                            className={styles.inputField}
                            rows={2}
                            required
                          />
                        </div>
                      )}
                      {duration && (
                        <div className={styles.formGroup}>
                          <label>Total Overtime (auto-computed)</label>
                          <div
                            style={{
                              padding: "0.4rem 0.6rem",
                              background: "#f1f5f9",
                              borderRadius: 4,
                              fontSize: "0.9rem",
                            }}
                          >
                            {duration.hours} hr(s) {duration.minutes} min(s)
                            raw; net authorized:{" "}
                            {Math.max(
                              0,
                              (duration.hours * 60 +
                                duration.minutes -
                                Number(form.breakMinutes || 0)) /
                                60,
                            ).toFixed(2)}{" "}
                            hr(s)
                          </div>
                        </div>
                      )}
                      <div className={styles.formGroup}>
                        <label>Purpose / Justification</label>
                        <textarea
                          value={form.purpose}
                          onChange={(e) =>
                            setForm({ ...form, purpose: e.target.value })
                          }
                          className={styles.inputField}
                          rows={3}
                          required
                        />
                      </div>
                      <ApprovalSection
                        key={editingId ?? 0}
                        initialValues={approvalInitialValues}
                        onDataChange={setApprovalData}
                        showAuthorizedOfficial={false}
                        showDueExigency={false}
                      />
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={styles.submitButton}
                        >
                          {isSubmitting ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className={styles.clearButton}
                          onClick={() => {
                            setEditingId(null);
                            setApprovalInitialValues(undefined);
                            setApprovalData({
                              recommendationStatus: "Pending",
                              recommendationMessage: "",
                              recommendingApprovalById: null,
                              authorizedOfficialId: null,
                              approvedById: null,
                              approvedStatus: "Pending",
                              approvalMessage: "",
                              dueExigencyService: false,
                            });
                            setActiveTab("table");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 12px",
  verticalAlign: "middle",
};
const btnPrint: React.CSSProperties = {
  padding: "3px 8px",
  background: "#065f46",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
  marginRight: "4px",
};
const btnEdit: React.CSSProperties = {
  padding: "3px 8px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
  marginRight: "4px",
};
const btnDelete: React.CSSProperties = {
  padding: "3px 8px",
  background: "#6b7280",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: "0.75rem",
};
