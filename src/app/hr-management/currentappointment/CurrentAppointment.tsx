"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/CurrentAppointment.module.scss";

type Appointment = {
  appointmentId: string;
  dateIssued: string;
  dateAssumption: string;
  nature: string;
  plantilla: string;
  position: string;
  otherPosition?: string;
  salaryGrade: string;
  salaryStep: string;
  salaryAnnum: string;
  salaryMonth: string;
  salaryDay: string;
  details: string;
};

type Props = {
  onSave?: (a: Appointment) => void;
  initialData?: Appointment;
  onCancel?: () => void;
};

export default function CurrentAppointment({onSave, initialData, onCancel}: Props) {
  const [form, setForm] = useState<Appointment>(
    initialData || {
      appointmentId: "",
      dateIssued: "",
      dateAssumption: "",
      nature: "",
      plantilla: "",
      position: "",
      otherPosition: "",
      salaryGrade: "",
      salaryStep: "",
      salaryAnnum: "",
      salaryMonth: "",
      salaryDay: "",
      details: "",
    }
  );

  const [isDisabled, setIsDisabled] = useState(!onSave); // If onSave is provided, enable editing

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(form);
      if (onCancel) onCancel();
      setForm({
        appointmentId: "",
        dateIssued: "",
        dateAssumption: "",
        nature: "",
        plantilla: "",
        position: "",
        otherPosition: "",
        salaryGrade: "",
        salaryStep: "",
        salaryAnnum: "",
        salaryMonth: "",
        salaryDay: "",
        details: "",
      });
    }
  };

  const handleEditToggle = () => setIsDisabled((prev) => !prev);

  const handleCancel = () => {
    setIsDisabled(true);
    if (onCancel) onCancel();
  };

  return (
    <div className={styles.CurrentAppointmentWrapper}>
      <form className={styles.CurrentAppointment} onSubmit={handleSubmit}>
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
        
        <div className={styles.formGroup}>
          <label>Appointment Issued</label>
          <input
            type="date"
            name="dateIssued"
            value={form.dateIssued}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Assumption to Duty</label>
          <input
            type="date"
            name="dateAssumption"
            value={form.dateAssumption}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Nature of Appointment</label>
          <select
            name="nature"
            value={form.nature}
            onChange={handleChange}
            disabled={isDisabled}
          >
            <option value="">-- Select --</option>
            <option value="Permanent">Permanent</option>
            <option value="Temporary">Temporary</option>
            <option value="Provisional">Provisional</option>
            <option value="Casual">Casual</option>
            <option value="Contractual">Contractual</option>
            <option value="Co-terminous">Co-terminous</option>
            <option value="Job Order">Job Order</option>
            <option value="Contract of Service">Contract of Service</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Plantilla</label>
          <select
            name="plantilla"
            value={form.plantilla}
            onChange={handleChange}
            disabled={isDisabled}
          >
            <option value="">-- Select Plantilla --</option>
            <option value="Plantilla 1">Plantilla 1</option>
            <option value="Plantilla 2">Plantilla 2</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Job Position</label>
          <select
            name="position"
            value={form.position}
            onChange={handleChange}
            disabled={isDisabled}
          >
            <option value="">-- Select Position --</option>
            <option value="Other">Other</option>
            <option value="Teacher I">Teacher I</option>
            <option value="Teacher II">Teacher II</option>
            <option value="Admin Aide">Admin Aide</option>
          </select>
        </div>

        {/* Add this block for "Other" position */}
        {form.position === "Other" && (
          <div className={styles.formGroup}>
            <label>
              Please specify position
              <input
                type="text"
                name="otherPosition"
                value={form.otherPosition}
                onChange={handleChange}
                disabled={isDisabled}
                placeholder="Enter position"
              />
            </label>
          </div>
        )}

        <div className={styles.salaryGroup}>
          <div>
            <label>Salary Grade</label>
            <input
              type="number"
              name="salaryGrade"
              className={styles.numberField}
              value={form.salaryGrade}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </div>
          <div>
            <label>Salary Step</label>
            <input
              type="number"
              name="salaryStep"
              className={styles.numberField}
              value={form.salaryStep}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </div>
        </div>

        <div className={styles.salaryGroup}>
          <div>
            <label>Salary (Per Annum)</label>
            <input
              type="number"
              name="salaryAnnum"
              className={styles.numberField}
              value={form.salaryAnnum}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </div>
          <div>
            <label>Salary (Per Month)</label>
            <input
              type="number"
              name="salaryMonth"
              className={styles.numberField}
              value={form.salaryMonth}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </div>
          <div>
            <label>Salary (Per Day)</label>
            <input
              type="number"
              name="salaryDay"
              className={styles.numberField}
              value={form.salaryDay}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Additional Details</label>
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            disabled={isDisabled}
          ></textarea>
        </div>

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
    </div>
  );
}