"use client";

import React, { useState } from "react";
import styles from "@/styles/PassSlip.module.scss";
import leaveStyles from "@/styles/LeaveApplication.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import ApprovalSection from "@/lib/approvalSection/approvalSection";

interface PassSlipFormData {
  employee: string;
  dateFiled: string;
  purpose: string;
  departureOut: string;
  arrivalIn: string;
  details: string;
  status: string;
}

interface PassSlipProps {
  employeeName: string;
  onSubmitPassSlip: (data: PassSlipFormData) => void;
}

export default function PassSlip({ employeeName, onSubmitPassSlip }: PassSlipProps) {
  const today = new Date().toISOString().split("T")[0];

  const initialFormState = {
    purpose: "",
    departureOut: "",
    arrivalIn: "",
    details: "",
  };

  const [form, setForm] = useState(initialFormState);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-set time based on purpose
  const handlePurposeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "Official") {
      setForm((prev) => ({
        ...prev,
        purpose: value,
        departureOut: "08:00",
        arrivalIn: "17:00",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        purpose: value,
        departureOut: "",
        arrivalIn: "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName) {
      alert("Please select an employee");
      return;
    }

    if (!form.purpose || !form.departureOut || !form.arrivalIn || !form.details) {
      alert("Please fill in all required fields");
      return;
    }

    const passSlipData: PassSlipFormData = {
      employee: employeeName,
      dateFiled: today,
      purpose: form.purpose,
      departureOut: form.departureOut,
      arrivalIn: form.arrivalIn,
      details: form.details,
      status: "Pending",
    };

    onSubmitPassSlip(passSlipData);
    setForm(initialFormState);
  };

  const handleClear = () => {
    setForm(initialFormState);
  };

  return (
    <div id="passSlipModal" className={modalStyles.Modal}>
      <form className={modalStyles.modalBody} onSubmit={handleSubmit}>
        {/* Employee Name (Display Only) */}
        <div className={styles.formGroup}>
          <label>Employee Name</label>
          <input
            type="text"
            value={employeeName}
            readOnly
            className={styles.readOnly}
          />
        </div>

        {/* Pass Slip Date (Display Only) */}
        <div className={styles.formGroup}>
          <label>Pass Slip Date</label>
          <input
            type="date"
            value={today}
            readOnly
            className={styles.readOnly}
          />
        </div>

        {/* Purpose */}
        <div className={styles.formGroup}>
          <label>Purpose</label>
          <select
            name="purpose"
            value={form.purpose}
            onChange={handlePurposeChange}
            required
          >
            <option value="" disabled>
              Select 
            </option>
            <option value="Personal">Personal</option>
            <option value="Official">Official</option>
          </select>
        </div>

        {/* Time */}
        <div className={styles.formGroup}>
          <label>Time</label>
          <div className={styles.dateRange}>
            <div className={styles.dateItem}>
              <label>Departure Out</label>
              <input
                type="time"
                name="departureOut"
                value={form.departureOut}
                onChange={handleChange}
                disabled={form.purpose === "Official"}
                required
              />
            </div>

            <div className={styles.dateItem}>
              <label>Arrival In</label>
              <input
                type="time"
                name="arrivalIn"
                value={form.arrivalIn}
                onChange={handleChange}
                disabled={form.purpose === "Official"}
                required
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className={leaveStyles.formGroup}>
          <label>Details</label>
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Enter details..."
            required
          />
        </div>

        {/* Approval Section */}
        <div style={{ marginTop: "2rem" }}>
          <ApprovalSection />
        </div>

        {/* Buttons */}
        <div className={leaveStyles.buttonGroup}>
          <button type="submit" className={leaveStyles.submitBtn}>
            Save
          </button>
          <button
            type="button"
            className={leaveStyles.clearBtn}
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
