"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "@/styles/EmployeeAppointment.module.scss";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import Swal from "sweetalert2";
import { toCustomFormat } from "@/lib/utils/dateFormatUtils";
import { formatMoneyInput } from "@/lib/utils/formatMoney";

const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE;
const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;

export type Appointment = {
  appointmentId: string;
  appointmentIssuedDate: string; // expected as YYYY-MM-DD from <input type=date>
  assumptionToDutyDate: string;  // expected as YYYY-MM-DD from <input type=date>
  natureOfAppointmentId: number | "";
  plantillaId: number | "";
  jobPositionId: number | "";
  salaryGrade: string;
  salaryStep: string;
  salaryPerAnnum: string;
  salaryPerMonth: string;
  salaryPerDay: string;
  details: string;
};

type JobPositionDTO = {
  jobPositionId: number;
  jobPositionName: string;
  salaryGrade: number;
  salaryStep: number;
};

type PlantillaDTO = {
  plantillaId: number;
  plantillaName: string;
  jobPositionId: number;
};

type NatureOfAppointmentDTO = {
  natureOfAppointmentId: number;
  code: string;
  nature: string;
};

type Props = {
  initialData?: Appointment;
  onCancel?: () => void;
  onSave?: (saved: Appointment) => void;
};

export default function EmployeeAppointment({ initialData, onCancel }: Props) {
  const [positionList, setPositionList] = useState<JobPositionDTO[]>([]);
  const [plantillaList, setPlantillaList] = useState<PlantillaDTO[]>([]);
  const [natureList, setNatureList] = useState<NatureOfAppointmentDTO[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");

  const [formattedSalaryAnnum, setFormattedSalaryAnnum] = useState("");
  const [formattedSalaryMonth, setFormattedSalaryMonth] = useState("");
  const [formattedSalaryDay, setFormattedSalaryDay] = useState("");

  const emptyForm: Appointment = {
    appointmentId: "",
    appointmentIssuedDate: "",
    assumptionToDutyDate: "",
    natureOfAppointmentId: "",
    plantillaId: "",
    jobPositionId: "",
    salaryGrade: "",
    salaryStep: "",
    salaryPerAnnum: "",
    salaryPerMonth: "",
    salaryPerDay: "",
    details: "",
  };

  const [form, setForm] = useState<Appointment>(initialData || emptyForm);

  // Store the initial state for the Cancel button to reset to
  const [initialFormState, setInitialFormState] = useState<Appointment>(initialData || emptyForm);
  const [isDisabled, setIsDisabled] = useState(!initialData);

  // -------------------- Load Job Positions --------------------
  const loadJobPositions = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/job-position/get-all`);
      if (!res.ok) throw new Error("Failed to load job positions");
      const data: JobPositionDTO[] = await res.json();
      setPositionList(data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Unable to load job positions", "error");
    }
  }, []);

  // -------------------- Load Plantilla --------------------
  const loadPlantillaByJobPosition = async (jobPositionId: number | "") => {
    if (!jobPositionId) {
      setPlantillaList([]);
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/plantilla/by-job-position/${jobPositionId}`);
      if (!res.ok) throw new Error("Failed to load plantilla");
      const data: PlantillaDTO[] = await res.json();
      setPlantillaList(data || []);
    } catch (err) {
      console.error(err);
      setPlantillaList([]);
      Swal.fire("Error", "Unable to load plantilla list", "error");
    }
  };

  // -------------------- Load Nature of Appointment --------------------
  const loadNatureOfAppointment = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/natureOfAppointment/get-all`);
      if (!res.ok) throw new Error("Failed to load nature of appointment");
      const data: NatureOfAppointmentDTO[] = await res.json();
      setNatureList(data || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Unable to load nature of appointment list", "error");
    }
  }, []);

  useEffect(() => {
    loadJobPositions();
    loadNatureOfAppointment();

    if (initialData) {
      setForm(initialData);
      setInitialFormState(initialData); // Set initial state

      setFormattedSalaryAnnum(initialData.salaryPerAnnum ? formatMoneyInput(String(initialData.salaryPerAnnum)) : "");
      setFormattedSalaryMonth(initialData.salaryPerMonth ? formatMoneyInput(String(initialData.salaryPerMonth)) : "");
      setFormattedSalaryDay(initialData.salaryPerDay ? formatMoneyInput(String(initialData.salaryPerDay)) : "");

      if (initialData.jobPositionId) {
        setSelectedPositionId(String(initialData.jobPositionId));
        loadPlantillaByJobPosition(initialData.jobPositionId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // -------------------- Handle form changes --------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Convert select IDs to numbers except when empty
    if (name === "natureOfAppointmentId" || name === "plantillaId" || name === "jobPositionId") {
      const val = value === "" ? "" : Number(value);
      setForm((prev) => ({ ...prev, [name]: val }));
      // keep selectedPositionId in sync for job position selection UI
      if (name === "jobPositionId") setSelectedPositionId(String(value));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------- Handle Job Position selection --------------------
  const handlePositionChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isDisabled) {
      return;
    }

    const selectedId = e.target.value;
    setSelectedPositionId(selectedId);
    const selectedJobPosition = positionList.find((pos) => String(pos.jobPositionId) === selectedId);

    if (!selectedJobPosition) {
      setForm((prev) => ({
        ...prev,
        jobPositionId: "",
        salaryGrade: "",
        salaryStep: "",
        salaryPerAnnum: "",
        salaryPerMonth: "",
        salaryPerDay: "",
      }));
      setFormattedSalaryAnnum("");
      setFormattedSalaryMonth("");
      setFormattedSalaryDay("");
      setPlantillaList([]);
      return;
    }

    // Set jobPositionId, grade, and step
    setForm((prev) => ({
      ...prev,
      jobPositionId: selectedJobPosition.jobPositionId,
      salaryGrade: String(selectedJobPosition.salaryGrade),
      salaryStep: String(selectedJobPosition.salaryStep),
    }));

    await loadPlantillaByJobPosition(selectedJobPosition.jobPositionId);

    // fetch salary schedule if assumptionToDutyDate exists
    if (form.assumptionToDutyDate && selectedJobPosition.salaryGrade && selectedJobPosition.salaryStep) {
      try {
        const dateStr = toCustomFormat(form.assumptionToDutyDate, false);
        const salaryRes = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/salary-schedule/get-by-date-assumption-and-salary-grade-and-salary-step?dateAssumption=${dateStr}&salaryGrade=${selectedJobPosition.salaryGrade}&salaryStep=${selectedJobPosition.salaryStep}`);
        if (!salaryRes.ok) throw new Error("Failed to fetch salary schedule");
        const data = await salaryRes.json();
        if (data) {
          const monthly = Number(data.monthlySalary);
          const perAnnum = monthly * 12;
          const perDay = Number((perAnnum / 365).toFixed(2));

          setForm((prev) => ({
            ...prev,
            salaryPerAnnum: perAnnum.toString(),
            salaryPerMonth: monthly.toString(),
            salaryPerDay: perDay.toString(),
          }));
          setFormattedSalaryAnnum(formatMoneyInput(perAnnum.toString()));
          setFormattedSalaryMonth(formatMoneyInput(monthly.toString()));
          setFormattedSalaryDay(formatMoneyInput(String(perDay)));
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Unable to fetch salary schedule", "error");
      }
    }
  };

  // -------------------- Save or Update API --------------------
  const saveOrUpdate = async () => {
    try {
      // Format dates to backend expected pattern using toCustomFormat util
      const appointmentIssuedDateFormatted = form.appointmentIssuedDate ? toCustomFormat(form.appointmentIssuedDate, true) : null;
      const assumptionToDutyDateFormatted = form.assumptionToDutyDate ? toCustomFormat(form.assumptionToDutyDate, true) : null;

      const payload: any = {
        appointmentIssuedDate: appointmentIssuedDateFormatted,
        assumptionToDutyDate: assumptionToDutyDateFormatted,
        natureOfAppointmentId: form.natureOfAppointmentId === "" ? null : Number(form.natureOfAppointmentId),
        plantillaId: form.plantillaId === "" ? null : Number(form.plantillaId),
        jobPositionId: form.jobPositionId === "" ? null : Number(form.jobPositionId),
        salaryGrade: form.salaryGrade ? Number(form.salaryGrade) : null,
        salaryStep: form.salaryStep ? Number(form.salaryStep) : null,
        salaryPerAnnum: form.salaryPerAnnum ? Number(String(form.salaryPerAnnum).replace(/,/g, "")) : null,
        salaryPerMonth: form.salaryPerMonth ? Number(String(form.salaryPerMonth).replace(/,/g, "")) : null,
        salaryPerDay: form.salaryPerDay ? Number(String(form.salaryPerDay).replace(/,/g, "")) : null,
        details: form.details,
      };

      const isUpdate = Boolean(form.appointmentId);
      const url = isUpdate
        ? `${API_BASE_URL_HRM}/api/employeeAppointment/update/${form.appointmentId}`
        : `${API_BASE_URL_HRM}/api/employeeAppointment/create`;

      const method = isUpdate ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to save appointment");

      Swal.fire("Success", data?.message || "Saved successfully", "success");

      // After successful save, update initial state and disable form
      if (initialData) {
        setInitialFormState(form);
      } else {
        // If it was a new record (no initialData), clear the form as well.
        setForm(emptyForm);
        setFormattedSalaryAnnum("");
        setFormattedSalaryMonth("");
        setFormattedSalaryDay("");
        setSelectedPositionId("");
        setPlantillaList([]);
      }

      setIsDisabled(true);

      if (onCancel) onCancel();
    } catch (err) {
      console.error(err);
      Swal.fire("Failed to save appointment", (err as Error).message || "An error occurred", "error");
    }
  };

  // -------------------- Handle Cancel --------------------
  const handleCancel = () => {
    // Revert to initial state
    setForm(initialFormState);
    setSelectedPositionId(initialFormState.jobPositionId ? String(initialFormState.jobPositionId) : "");
    setFormattedSalaryAnnum(initialFormState.salaryPerAnnum ? formatMoneyInput(String(initialFormState.salaryPerAnnum)) : "");
    setFormattedSalaryMonth(initialFormState.salaryPerMonth ? formatMoneyInput(String(initialFormState.salaryPerMonth)) : "");
    setFormattedSalaryDay(initialFormState.salaryPerDay ? formatMoneyInput(String(initialFormState.salaryPerDay)) : "");

    // Disable the form
    setIsDisabled(true);

    // Execute external cancel handler
    if (onCancel) onCancel();
  };

  // -------------------- Handle Submit --------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveOrUpdate();
  };

  return (
    <div className={styles.CurrentAppointmentWrapper}>
      <form className={styles.CurrentAppointment} onSubmit={handleSubmit}>
        {/* Buttons (TOP) */}
        <div className={styles.actionBtns}>
          {!isDisabled ? (
            <>
              <button type="submit" className={styles.submitBtn}>
                Save
              </button>
              <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.editBtn}
              onClick={(e) => {
                e.preventDefault();
                setIsDisabled(false);
              }}
            >
              Edit
            </button>
          )}
        </div>

        <div>&nbsp;</div>

        {/* Form fields */}
        <div className={styles.formGroup}>
          <label>Appointment Issued</label>
          <input type="date" name="appointmentIssuedDate" value={form.appointmentIssuedDate} onChange={handleChange} disabled={isDisabled} />
        </div>

        <div className={styles.formGroup}>
          <label>Assumption to Duty</label>
          <input type="date" name="assumptionToDutyDate" value={form.assumptionToDutyDate} onChange={handleChange} disabled={isDisabled} />
        </div>

        <div className={styles.formGroup}>
          <label>Nature of Appointment</label>
          <select name="natureOfAppointmentId" value={form.natureOfAppointmentId} onChange={handleChange} disabled={isDisabled}>
            <option value="">-- Select Nature --</option>
            {natureList.map((n) => (
              <option key={n.natureOfAppointmentId} value={n.natureOfAppointmentId}>
                {n.nature}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Job Position</label>
          <select name="jobPositionId" value={selectedPositionId} onChange={handlePositionChange} disabled={isDisabled}>
            <option value="">-- Select Position --</option>
            {positionList.map((pos) => (
              <option key={pos.jobPositionId} value={pos.jobPositionId}>
                {pos.jobPositionName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Plantilla</label>
          <select name="plantillaId" value={form.plantillaId} onChange={handleChange} disabled={isDisabled}>
            <option value="">-- Select Plantilla --</option>
            {plantillaList.map((pl) => (
              <option key={pl.plantillaId} value={pl.plantillaId}>
                {pl.plantillaName}
              </option>
            ))}
          </select>
        </div>

        {/* Salary Fields */}
        <div className={styles.salaryGroup}>
          <div>
            <label>Salary Grade</label>
            <input type="text" name="salaryGrade" value={form.salaryGrade} readOnly />
          </div>
          <div>
            <label>Salary Step</label>
            <input type="text" name="salaryStep" value={form.salaryStep} readOnly />
          </div>
        </div>

        <div className={styles.salaryGroup}>
          <div>
            <label>Salary (Per Annum)</label>
            <input type="text" value={formattedSalaryAnnum} readOnly />
          </div>
          <div>
            <label>Salary (Per Month)</label>
            <input type="text" value={formattedSalaryMonth} readOnly />
          </div>
          <div>
            <label>Salary (Per Day)</label>
            <input type="text" value={formattedSalaryDay} readOnly />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Additional Details</label>
          <textarea name="details" value={form.details} onChange={handleChange} disabled={isDisabled} />
        </div>

        {/* Buttons (BOTTOM) */}
        <div className={styles.actionBtns}>
          {!isDisabled ? (
            <>
              <button type="submit" className={styles.submitBtn}>
                Save
              </button>
              <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.editBtn}
              onClick={(e) => {
                e.preventDefault();
                setIsDisabled(false);
              }}
            >
              Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}