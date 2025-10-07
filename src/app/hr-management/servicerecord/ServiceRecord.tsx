"use client";

import React, { useState } from "react";
import tableStyles from "@/styles/DTRTable.module.scss";
import styles from "@/styles/ServiceRecord.module.scss";
import CurrentAppointment from "@/app/hr-management/currentappointment/CurrentAppointment";
import Swal from "sweetalert2";

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

export default function ServiceRecord() {
  // Sample static data for demonstration
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      appointmentId: "A-001",
      dateIssued: "2023-01-15",
      dateAssumption: "2023-02-01",
      nature: "Permanent",
      plantilla: "Plantilla 1",
      position: "Teacher I",
      otherPosition: "",
      salaryGrade: "11",
      salaryStep: "1",
      salaryAnnum: "300000",
      salaryMonth: "25000",
      salaryDay: "1000",
      details: "First appointment as Teacher I.",
    },
    {
      appointmentId: "A-002",
      dateIssued: "2024-03-10",
      dateAssumption: "2024-03-20",
      nature: "Temporary",
      plantilla: "Plantilla 2",
      position: "Other",
      otherPosition: "Guidance Counselor",
      salaryGrade: "12",
      salaryStep: "2",
      salaryAnnum: "320000",
      salaryMonth: "26666",
      salaryDay: "1066",
      details: "Temporary appointment for Guidance Counselor.",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const handleShowDetails = (appointment: Appointment) => {
    Swal.fire({
      title: `Appointment Details`,
      html: `
        <div style="text-align:left; font-size:14px;">
          <p><b>Date Issued:</b> ${appointment.dateIssued}</p>
          <p><b>Assumption:</b> ${appointment.dateAssumption}</p>
          <p><b>Nature:</b> ${appointment.nature}</p>
          <p><b>Plantilla:</b> ${appointment.plantilla}</p>
          <p><b>Position:</b> ${appointment.position}</p>
          ${
            appointment.position === "Other"
              ? `<p><b>Other Position:</b> ${
                  appointment.otherPosition || ""
                }</p>`
              : ""
          }
          <p><b>Salary Grade:</b> ${appointment.salaryGrade}</p>
          <p><b>Salary Step:</b> ${appointment.salaryStep}</p>
          <p><b>Salary Annum:</b> ${appointment.salaryAnnum}</p>
          <p><b>Salary Month:</b> ${appointment.salaryMonth}</p>
          <p><b>Salary Day:</b> ${appointment.salaryDay}</p>
          <p><b>Details:</b> ${appointment.details}</p>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#495057",
      width: "480px",
    });
  };

  const handleAddNew = () => setShowForm(true);

  const handleSave = (newAppointment: Appointment) => {
    setAppointments((prev) => [...prev, newAppointment]);
    setShowForm(false);
  };

  const handleCancel = () => setShowForm(false);

  return (
    <div className={styles.ServiceRecord}>
      <button onClick={handleAddNew} className={styles.addBtn}>
        New
      </button>
      {showForm && (
        <CurrentAppointment onSave={handleSave} onCancel={handleCancel} />
      )}
      <div>&nbsp;</div>
      <div className={tableStyles.DTRTable}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Date Issued</th>
              <th>Assumption</th>
              <th>Nature</th>
              <th>Plantilla</th>
              <th>Position</th>
              <th>Other Position</th>
              <th>Salary Grade</th>
              <th>Salary Step</th>
              <th>Salary Annum</th>
              <th>Salary Month</th>
              <th>Salary Day</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: "center" }}>
                  No records yet.
                </td>
              </tr>
            ) : (
              appointments.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.dateIssued}</td>
                  <td>{a.dateAssumption}</td>
                  <td>{a.nature}</td>
                  <td>{a.plantilla}</td>
                  <td>{a.position}</td>
                  <td>{a.position === "Other" ? a.otherPosition : ""}</td>
                  <td>{a.salaryGrade}</td>
                  <td>{a.salaryStep}</td>
                  <td>{a.salaryAnnum}</td>
                  <td>{a.salaryMonth}</td>
                  <td>{a.salaryDay}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleShowDetails(a)}
                      style={{ cursor: "pointer" }}
                    >
                      📋 View
                    </button>
                  </td>
                  <td>&nbsp;</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}