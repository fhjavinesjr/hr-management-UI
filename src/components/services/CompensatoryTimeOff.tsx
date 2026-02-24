"use client";

import React, { useState } from "react";
import styles from "@/styles/compensatoryTimeOff.module.scss";
import leaveStyles from "@/styles/LeaveApplication.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import ApprovalSection from "@/lib/approvalSection/approvalSection";

interface CTOFormData {
  dateFiled: string;
  dateWorked: string;
  hours: number | string;
  reason: string;
}

interface CompensatoryTimeOffProps {
  employeeName: string;
  onSubmitCTO: (cto: {
    employee: string;
    dateFiled: string;
    dateWorked: string;
    hours: number | string;
    status: string;
  }) => void;
}

export default function CompensatoryTimeOff({
  employeeName,
  onSubmitCTO,
}: CompensatoryTimeOffProps) {
  const initialFormState: CTOFormData = {
    dateFiled: "",
    dateWorked: "",
    hours: "",
    reason: "",
  };

  const [form, setForm] = useState<CTOFormData>(initialFormState);

  const currentBalance = 65.5; // sample value (readonly)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName) {
      alert("Please select an employee first.");
      return;
    }

    const payload = {
      dateFiled: form.dateFiled,
      dateWorked: form.dateWorked,
      hours: form.hours,
      reason: form.reason,
      status: "Pending",
    };

    console.log("CTO Submitted:", payload);

    onSubmitCTO({
      employee: employeeName,
      dateFiled: form.dateFiled,
      dateWorked: form.dateWorked,
      hours: form.hours,
      status: "Pending",
    });

    setForm(initialFormState);
  };

  const handleCancel = () => {
    setForm(initialFormState);
  };

  return (
    <div id="compensatorytimeoffModal" className={modalStyles.Modal}>
      <form className={modalStyles.modalBody} onSubmit={handleSubmit}>
        {/* Current Balance */}
        <div className={styles.formGroup}>
          <label>Current Balance</label>
          <span>{currentBalance}</span>
        </div>

        {/* Date Filed */}
        <div className={styles.formGroup}>
          <label>Date Filed</label>
          <input
            type="date"
            name="dateFiled"
            value={form.dateFiled}
            onChange={handleChange}
            required
            className={styles.inputBase}
          />
        </div>

        {/* Date Worked */}
        <div className={styles.formGroup}>
          <label>Date Worked</label>
          <input
            type="date"
            name="dateWorked"
            value={form.dateWorked}
            onChange={handleChange}
            required
            className={styles.inputBase}
          />
        </div>

        {/* Hours */}
        <div className={styles.formGroup}>
          <label>Hours</label>
          <input
            type="number"
            name="hours"
            value={form.hours}
            onChange={handleChange}
            className={styles.inputBase}
            min={0.5}
            step={0.5}
            required
          />
        </div>

        {/* Reason */}
        <div className={leaveStyles.formGroup}>
          <label>Details</label>
          <textarea
            name="reason"
            placeholder="Enter Details..."
            value={form.reason}
            onChange={handleChange}
            rows={5}
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
          <button type="button" onClick={handleCancel} className={leaveStyles.clearBtn}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}