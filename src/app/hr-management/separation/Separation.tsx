"use client";

import React, { useState } from "react";
import styles from "@/styles/Separation.module.scss";

// Add the type model for the form fields
type SeparationForm = {
  separationDate: string;
  natureOfSeparation: string;
  remarks: string;
  exitInterviewBy: string;
  exitInterviewDate: string;
};

export default function Separation() {
  const [isDisabled, setIsDisabled] = useState(true);
  const [formData, setFormData] = useState<SeparationForm>({
    separationDate: "",
    natureOfSeparation: "",
    remarks: "",
    exitInterviewBy: "",
    exitInterviewDate: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", formData);
    // TODO: send to API
  };

  const handleEditToggle = () => {
    setIsDisabled((prev) => {
      return !prev;
    });
  };

  const handleCancel = () => {
    setIsDisabled(true); // disable editing again
  };

  return (
    <form className={styles.Separation} onSubmit={handleSubmit}>
      <div className={styles.actionBtns}>
        {!isDisabled ? (
          <>
            <button type="submit" className={styles.submitBtn}>
              Save
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.editBtn}
            onClick={handleEditToggle}
          >
            Edit
          </button>
        )}
      </div>
      
      <div>&nbsp;</div>

      {/* Employee Info (auto-filled) */}
      <section className={styles.section}>
        <h3>Employee Info</h3>
        <div className={styles.grid2}>
          <label>
            Name
            <input
              type="text"
              name="employeeName"
              value="Juan Dela Cruz"
              onChange={handleChange}
              disabled
            />
          </label>
          <label>
            Employee ID
            <input
              type="text"
              name="employeeId"
              value="EMP12345"
              onChange={handleChange}
              disabled
            />
          </label>
          <label>
            Position
            <input
              type="text"
              name="employeePosition"
              value="Administrative Officer II"
              onChange={handleChange}
              disabled
            />
          </label>
          <label>
            Office/Unit
            <input
              type="text"
              name="employeeOffice"
              value="HR Department"
              onChange={handleChange}
              disabled
            />
          </label>
        </div>
      </section>

      {/* Separation Details */}
      <section className={styles.section}>
        <h3>Separation Details</h3>
        <div className={styles.grid2}>
          <label>
            Separation Date
            <input
              type="date"
              name="separationDate"
              value={formData.separationDate}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>

          <label>
            Nature of Separation
            <select
              name="natureOfSeparation"
              value={formData.natureOfSeparation}
              onChange={handleChange}
              disabled={isDisabled}
            >
              <option value="">-- Select --</option>
              <option value="resignation">Resignation</option>
              <option value="retirement_compulsory">Retirement (Compulsory)</option>
              <option value="retirement_optional">Retirement (Optional)</option>
              <option value="death">Death</option>
              <option value="dropped_from_rolls">Dropped from Rolls</option>
              <option value="dismissal">Dismissal/Removal</option>
              <option value="reorganization">Separation due to Reorganization</option>
              <option value="others">Others</option>
            </select>
          </label>
        </div>

        <label className={styles.remarks}>
          Remarks
          <textarea
            name="remarks"
            rows={3}
            value={formData.remarks}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </label>
      </section>

      {/* Exit Interview */}
      <section className={styles.section}>
        <h3>Exit Interview (Optional)</h3>
        <div className={styles.grid2}>
          <label>
            Exit Interview By
            <input
              type="text"
              name="exitInterviewBy"
              value={formData.exitInterviewBy}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Exit Interview Date
            <input
              type="date"
              name="exitInterviewDate"
              value={formData.exitInterviewDate}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
        </div>
      </section>

      {/* Processing */}
      <section className={styles.section}>
        <h3>Processing</h3>
        <div className={styles.grid2}>
          <label>
            Processed By
            <input
              type="text"
              name="processedBy"
              value="HR Officer (auto-filled)"
              onChange={handleChange}
              disabled
            />
          </label>
          <label>
            Approved By
            <input
              type="text"
              name="approvedBy"
              value="Appointing Authority (auto-filled)"
              onChange={handleChange}
              disabled
            />
          </label>
        </div>
      </section>

      {/* Buttons */}
      <div className={styles.actionBtns}>
        {!isDisabled ? (
          <>
            <button type="submit" className={styles.submitBtn}>
              Save
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.editBtn}
            onClick={handleEditToggle}
          >
            Edit
          </button>
        )}
      </div>
    </form>
  );
}