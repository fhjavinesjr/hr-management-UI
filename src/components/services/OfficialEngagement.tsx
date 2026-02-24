"use client";

import React, { useState } from "react";
import styles from "@/styles/LeaveApplication.module.scss";
import modalStyles from "@/styles/Modal.module.scss";
import ApprovalSection from "@/lib/approvalSection/approvalSection";

interface OfficialEngagementFormData {
  officialType: string;
  from: string;
  to: string;
  details: string;
}

interface OfficialEngagementProps {
  employeeName: string;
  onSubmitEngagement: (engagement: {
    employee: string;
    officialType: string;
    from: string;
    to: string;
    status: string;
  }) => void;
}

export default function OfficialEngagement({
  employeeName,
  onSubmitEngagement,
}: OfficialEngagementProps) {
  const initialFormState: OfficialEngagementFormData = {
    officialType: "",
    from: "",
    to: "",
    details: "",
  };

  const [form, setForm] = useState<OfficialEngagementFormData>(
    initialFormState
  );

  const officialTypes = ["Official Business", "Official Time"];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

    if (!form.officialType || !form.from || !form.to) {
      alert("Please fill in all required fields.");
      return;
    }

    onSubmitEngagement({
      employee: employeeName,
      officialType: form.officialType,
      from: form.from,
      to: form.to,
      status: "Pending",
    });

    setForm(initialFormState);
  };

  const handleClear = () => {
    setForm(initialFormState);
  };

  return (
    <div id="officialEngagementModal" className={modalStyles.Modal}>
      <form className={modalStyles.modalBody} onSubmit={handleSubmit}>
        {/* Official Type */}
        <div className={styles.formGroup}>
          <label>Official Type</label>
          <select
            className={styles.selectBase}
            name="officialType"
            value={form.officialType}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select
            </option>
            {officialTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

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
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

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
