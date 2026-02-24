"use client";

import React, { useState } from "react";
import modalStyles from "@/styles/Modal.module.scss";
import styles from "@/styles/LeaveApplication.module.scss";
import Tstyle from "@/styles/TimeCorrection.module.scss";
import ApprovalSection from "@/lib/approvalSection/approvalSection";

interface TimeCorrectionFormData {
  employee: string;
  dateFiled: string;
  date: string;
  timeIn: string;
  breakOut: string;
  breakIn: string;
  timeOut: string;
  details: string;
  status: string;
}

interface TimeCorrectionProps {
  employeeName: string;
  onSubmitTimeCorrection: (data: TimeCorrectionFormData) => void;
}

export default function TimeCorrection({
  employeeName,
  onSubmitTimeCorrection,
}: TimeCorrectionProps) {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: "",
    timeIn: "",
    breakOut: "",
    breakIn: "",
    timeOut: "",
    details: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleClear = () => {
    setForm({
      date: "",
      timeIn: "",
      breakOut: "",
      breakIn: "",
      timeOut: "",
      details: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName) {
      alert("Please select an employee");
      return;
    }

    if (!form.date || !form.timeIn || !form.timeOut || !form.details) {
      alert("Please fill in all required fields");
      return;
    }

    const timeCorrectionData: TimeCorrectionFormData = {
      employee: employeeName,
      dateFiled: today,
      date: form.date,
      timeIn: form.timeIn,
      breakOut: form.breakOut,
      breakIn: form.breakIn,
      timeOut: form.timeOut,
      details: form.details,
      status: "Pending",
    };

    onSubmitTimeCorrection(timeCorrectionData);
    setForm({
      date: "",
      timeIn: "",
      breakOut: "",
      breakIn: "",
      timeOut: "",
      details: "",
    });
  };

  return (
    <div id="timecorrectionModal" className={modalStyles.Modal}>
      <form onSubmit={handleSubmit} className={modalStyles.modalBody}>
        {/* Employee Name (Display Only) */}
        <div className={Tstyle.formRow}>
          <label htmlFor="employee">Employee Name</label>
          <input
            type="text"
            id="employee"
            value={employeeName}
            readOnly
            className={styles.readOnly}
          />
        </div>

        {/* Date Filed (Display Only) */}
        <div className={Tstyle.formRow}>
          <label htmlFor="dateFiled">Date Filed</label>
          <input
            type="date"
            id="dateFiled"
            value={today}
            readOnly
            className={styles.readOnly}
          />
        </div>

        {/* Correction Date */}
        <div className={Tstyle.formRow}>
          <label htmlFor="date">Correction Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className={Tstyle.formRow}>
          <label htmlFor="timeIn">Time In</label>
          <input
            type="time"
            id="timeIn"
            name="timeIn"
            value={form.timeIn}
            onChange={handleChange}
            required
          />
        </div>

        <div className={Tstyle.formRow}>
          <label htmlFor="breakOut">Break Out</label>
          <input
            type="time"
            id="breakOut"
            name="breakOut"
            value={form.breakOut}
            onChange={handleChange}
          />
        </div>

        <div className={Tstyle.formRow}>
          <label htmlFor="breakIn">Break In</label>
          <input
            type="time"
            id="breakIn"
            name="breakIn"
            value={form.breakIn}
            onChange={handleChange}
          />
        </div>

        <div className={Tstyle.formRow}>
          <label htmlFor="timeOut">Time Out</label>
          <input
            type="time"
            id="timeOut"
            name="timeOut"
            value={form.timeOut}
            onChange={handleChange}
            required
          />
        </div>

        {/* Details */}
        <div className={styles.formGroup}>
          <label className={styles.labelDetails}>Details</label>
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

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitBtn}>
            Save
          </button>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
