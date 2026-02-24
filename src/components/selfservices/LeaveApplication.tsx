"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/LeaveApplication.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import ApprovalSection from "@/lib/approvalSection/approvalSection";

interface LeaveApplicationProps {
  employeeName: string;
  onSubmitLeave: (leave: {
    employee: string;
    dateFiled: string;
    from: string;
    to: string;
    leaveType: string;
    status: string;
  }) => void;
}

export default function LeaveApplication({
  employeeName,
  onSubmitLeave,
}: LeaveApplicationProps) {
  const initialFormState = {
    dateFiled: "",
    leaveType: "",
    from: "",
    to: "",
    commutation: "requested",
    details: "",
    noOfDays: "",
  };

  const [form, setForm] = useState(initialFormState);

  // Set dateFiled to today's date on component mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setForm((prev) => ({ ...prev, dateFiled: today }));
  }, []);

  const leaveTypes = [
    "Vacation Leave",
    "Sick Leave",
    "Forced Leave",
    "Special Privilege Leave",
    "Study Leave",
    "Terminal Leave",
    "Paternity Leave",
    "Maternity Leave",
    "Solo Parent Leave",
    "Adoption Leave",
    "Rehabilitation Leave",
    "Gynecological Leave",
    "COVID-19 Treatment Leave",
    "10-Day VAWC Leave",
    "Special Emergency Leave",
    "Leave Monetization",
  ];

  

  const isMonetization = form.leaveType === "Leave Monetization";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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

    // Call the parent component callback with form values
    onSubmitLeave({
      employee: employeeName,
      dateFiled: form.dateFiled,
      from: isMonetization ? "" : form.from,
      to: isMonetization ? "" : form.to,
      leaveType: form.leaveType,
      status: "Pending",
    });

    setForm(initialFormState);
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setForm(initialFormState);
  };

  return (
    <div id="leaveapplicationModal" className={modalStyles.Modal}>
      <form className={modalStyles.modalBody} onSubmit={handleSubmit}>
        {/* Date Filed */}
        <div className={styles.formGroup}>
          <label>Date Filed</label>
          <input
            type="date"
            name="dateFiled"
            value={form.dateFiled}
            onChange={handleChange}
            className={styles.inputBase}
            required
          />
        </div>

        {/* Leave Type */}
        <div className={styles.formGroup}>
          <label>Leave Type</label>
          <select
            name="leaveType"
            value={form.leaveType}
            onChange={handleChange}
            className={styles.selectBase}
            required
          >
            <option value="" disabled>
              Select
            </option>
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Inclusive Dates for normal leaves */}
        {!isMonetization && (
          <div className={styles.formGroup}>
            <label className={styles.labelInclusiveDate}>Inclusive Date</label>

            {/* From */}
            <div className={styles.dateItem}>
              <label>From:</label>
              <input
                type="date"
                name="from"
                value={form.from}
                onChange={handleChange}
                className={styles.inputBase}
                required
              />
            </div>

            {/* To */}
            <div className={styles.dateItem}>
              <label>To:</label>
              <input
                type="date"
                name="to"
                value={form.to}
                onChange={handleChange}
                className={styles.inputBase}
                required
              />
            </div>
          </div>
        )}

        {/* Commutation for normal leaves */}
        {!isMonetization && (
          <div className={styles.formGroup}>
            <label>Commutation</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="commutation"
                  value="requested"
                  checked={form.commutation === "requested"}
                  onChange={handleChange}
                  required
                />
                Requested
              </label>
              <label>
                <input
                  type="radio"
                  name="commutation"
                  value="notRequested"
                  checked={form.commutation === "notRequested"}
                  onChange={handleChange}
                  required
                />
                Not Requested
              </label>
            </div>
          </div>
        )}

        {/* No. of Days for Leave Monetization */}
        {isMonetization && (
          <div className={styles.formGroup}>
            <label>No. of Day(s)</label>
            <input
              type="number"
              name="noOfDays"
              value={form.noOfDays}
              onChange={handleChange}
              className={styles.inputBase}
              min={1}
              required
            />
          </div>
        )}

        {/* Details */}
        <div className={styles.formGroup}>
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
