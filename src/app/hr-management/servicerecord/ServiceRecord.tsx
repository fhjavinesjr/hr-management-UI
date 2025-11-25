"use client";

import React, { useState } from "react";
import tableStyles from "@/styles/DTRTable.module.scss";
import styles from "@/styles/ServiceRecord.module.scss";

import EmployeeAppointment, {
  Appointment,
} from "@/app/hr-management/employeeappointment/EmployeeAppointment";
import Swal from "sweetalert2";

// Helper to simulate readable labels (since your Appointment only stores IDs)
const getNatureLabel = (id: number | "") =>
  id === "" ? "" : `Nature #${id}`;

const getPlantillaLabel = (id: number | "") =>
  id === "" ? "" : `Plantilla #${id}`;

const getPositionLabel = (id: number | "") =>
  id === "" ? "" : `Position #${id}`;

export default function ServiceRecord() {
  // Updated static sample data to match NEW Appointment structure
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      appointmentId: "A-001",
      appointmentIssuedDate: "2023-01-15",
      assumptionToDutyDate: "2023-02-01",
      natureOfAppointmentId: 1,
      plantillaId: 11,
      jobPositionId: 101,
      salaryGrade: "11",
      salaryStep: "1",
      salaryPerAnnum: "300000",
      salaryPerMonth: "25000",
      salaryPerDay: "1000",
      details: "First appointment as Teacher I.",
    },
    {
      appointmentId: "A-002",
      appointmentIssuedDate: "2024-03-10",
      assumptionToDutyDate: "2024-03-20",
      natureOfAppointmentId: 2,
      plantillaId: 22,
      jobPositionId: 202,
      salaryGrade: "12",
      salaryStep: "2",
      salaryPerAnnum: "320000",
      salaryPerMonth: "26666",
      salaryPerDay: "1066",
      details: "Temporary appointment for Guidance Counselor.",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const handleShowDetails = (a: Appointment) => {
    Swal.fire({
      title: `Appointment Details`,
      html: `
        <div style="text-align:left; font-size:14px;">
          <p><b>Date Issued:</b> ${a.appointmentIssuedDate}</p>
          <p><b>Assumption:</b> ${a.assumptionToDutyDate}</p>
          <p><b>Nature:</b> ${getNatureLabel(a.natureOfAppointmentId)}</p>
          <p><b>Plantilla:</b> ${getPlantillaLabel(a.plantillaId)}</p>
          <p><b>Position:</b> ${getPositionLabel(a.jobPositionId)}</p>
          <p><b>Salary Grade:</b> ${a.salaryGrade}</p>
          <p><b>Salary Step:</b> ${a.salaryStep}</p>
          <p><b>Salary Annum:</b> ${a.salaryPerAnnum}</p>
          <p><b>Salary Month:</b> ${a.salaryPerMonth}</p>
          <p><b>Salary Day:</b> ${a.salaryPerDay}</p>
          <p><b>Details:</b> ${a.details}</p>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#495057",
      width: "480px",
    });
  };

  const handleAddNew = () => setShowForm(true);

  // FIXED: Now Appointment type matches EmployeeAppointment
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
        <EmployeeAppointment onSave={handleSave} onCancel={handleCancel} />
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
                  <td>{a.appointmentIssuedDate}</td>
                  <td>{a.assumptionToDutyDate}</td>
                  <td>{getNatureLabel(a.natureOfAppointmentId)}</td>
                  <td>{getPlantillaLabel(a.plantillaId)}</td>
                  <td>{getPositionLabel(a.jobPositionId)}</td>
                  <td>{a.salaryGrade}</td>
                  <td>{a.salaryStep}</td>
                  <td>{a.salaryPerAnnum}</td>
                  <td>{a.salaryPerMonth}</td>
                  <td>{a.salaryPerDay}</td>
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