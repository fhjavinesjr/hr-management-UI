"use client";

import React, { useState, useMemo } from "react";
import styles from "@/styles/LeaveApplication.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import ApprovalSection from "@/lib/approvalSection/approvalSection";

interface OvertimeFormData {
  from: string;
  to: string;
  details: string;
}

interface OvertimeRequestProps {
  employeeName: string;
  onSubmitOvertime: (overtime: {
    employee: string;
    from: string;
    to: string;
    duration: string;
    status: string;
  }) => void;
}

export default function OvertimeRequest({
  employeeName,
  onSubmitOvertime,
}: OvertimeRequestProps) {
  const [form, setForm] = useState<OvertimeFormData>({
    from: "",
    to: "",
    details: "",
  });

  const nowLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  };

  const duration = useMemo(() => {
    if (!form.from || !form.to) return null;

    const start = new Date(form.from);
    const end = new Date(form.to);

    if (end <= start) return null;

    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes };
  }, [form.from, form.to]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

    if (!form.from || !form.to || !duration) {
      alert("Please fill in all required fields and set valid times.");
      return;
    }

    const durationStr = `${duration.hours}h ${duration.minutes}m`;

    onSubmitOvertime({
      employee: employeeName,
      from: form.from,
      to: form.to,
      duration: durationStr,
      status: "Pending",
    });

    setForm({ from: "", to: "", details: "" });
  };

  const handleClear = () => {
    setForm({ from: "", to: "", details: "" });
  };

  return (
    <div id="overtimeRequest" className={modalStyles.Modal}>
      <form className={modalStyles.modalBody} onSubmit={handleSubmit}>
        {/* Inclusive Date & Time */}
        <div className={styles.formGroup}>
          <label>Inclusive Date & Time</label>

          <div className={styles.dateRange}>
            <div className={styles.dateItem}>
              <label>From:</label>
              <input
                type="datetime-local"
                name="from"
                value={form.from}
                min={nowLocal()}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.dateItem}>
              <label>To:</label>
              <input
                type="datetime-local"
                name="to"
                value={form.to}
                min={form.from || nowLocal()}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Auto-calculated duration */}
        {duration && (
          <div className={styles.formGroup}>
            <label>Total Overtime</label>
            <div className={styles.readonlyBox}>
              {duration.hours} hour(s) {duration.minutes} minute(s)
            </div>
          </div>
        )}

        {/* Details */}
        <div className={styles.formGroup}>
          <label>Details</label>
          <textarea
            name="details"
            placeholder="Enter details..."
            value={form.details}
            onChange={handleChange}
            required
          />
        </div>

        {/* Approval Section */}
        <div style={{ marginTop: "2rem" }}>
          <ApprovalSection />
        </div>

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn}>
            Save
          </button>
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearBtn}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
