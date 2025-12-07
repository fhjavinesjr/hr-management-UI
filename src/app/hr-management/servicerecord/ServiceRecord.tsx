"use client";

import React, { useEffect, useState } from "react";
import tableStyles from "@/styles/DTRTable.module.scss";
import styles from "@/styles/ServiceRecord.module.scss";
import { Employee } from "@/lib/types/Employee";
import { EmployeeAppointmentModel } from "@/lib/types/EmployeeAppointment";

import EmployeeAppointment from "@/app/hr-management/employeeappointment/EmployeeAppointment";
import Swal from "sweetalert2";
import {
  fetchAllNatureList,
  fetchAllJobPositions,
  fetchAllPlantillas
} from "@/lib/services/api";

type Props = {
  selectedEmployee?: Employee | null;
  employeeAppointments?: EmployeeAppointmentModel[] | null;
  fetchEmploymentRecords?: () => Promise<void>;
};

export default function ServiceRecord({
  selectedEmployee,
  employeeAppointments,
  fetchEmploymentRecords,
}: Props) {
  const [natureList, setNatureList] = useState<any[]>([]);
  const [positionList, setPositionList] = useState<any[]>([]);
  const [plantillaList, setPlantillaList] = useState<any[]>([]);

  const [appointments, setAppointments] = useState<EmployeeAppointmentModel[]>([]);
  const [showForm, setShowForm] = useState(false);

  const getNatureLabel = (id?: string | null) => {
    if (!id) {
      return "";
    }
    const item = natureList.find((n) => String(n.natureOfAppointmentId) === String(id));
    return item?.nature;
  };

  const getPlantillaLabel = (id?: string | null) => {
    if (!id) {
      return "";
    }
    const item = plantillaList.find((p) => String(p.plantillaId) === String(id));
    return item?.plantillaName;
  };

  const getPositionLabel = (id?: string | null) => {
    if (!id) {
      return "";
    }
    const item = positionList.find((p) => String(p.jobPositionId) === String(id));
    return item?.jobPositionName;
  };

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [nature, positions, plantillas] = await Promise.all([
          fetchAllNatureList(),
          fetchAllJobPositions(),
          fetchAllPlantillas(),
        ]);

        setNatureList(nature || []);
        setPositionList(positions || []);
        setPlantillaList(plantillas || []);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load lookup data", "error");
      }
    };

    loadLookups();
  }, []);

  // Sync from parent props
  useEffect(() => {
    if (employeeAppointments) {
      const filtered = employeeAppointments.filter(a => !a.activeAppointment);

      const sorted = [...filtered].sort((a, b) => {
        const da = new Date(a.assumptionToDutyDate || a.appointmentIssuedDate);
        const db = new Date(b.assumptionToDutyDate || b.appointmentIssuedDate);
        return db.getTime() - da.getTime(); // DESC
      });

      setAppointments(sorted);
    } else {
      setAppointments([]);
    }
  }, [employeeAppointments]);

  const handleAddNew = () => setShowForm(true);

  const handleSave = async () => {
    setShowForm(false);

    // Ask parent to re-fetch records (preferred)
    if (fetchEmploymentRecords) {
      await fetchEmploymentRecords();
    }
  };

  const handleCancel = () => setShowForm(false);

  // Details popup
  const handleShowDetails = (a: EmployeeAppointmentModel) => {
    Swal.fire({
      title: `Appointment Details`,
      html: `
        <div style="text-align:left; font-size:14px;">
          <p><b>Date Issued:</b> ${a.appointmentIssuedDate ?? ""}</p>
          <p><b>Assumption:</b> ${a.assumptionToDutyDate ?? ""}</p>
          <p><b>Nature:</b> ${getNatureLabel(a.natureOfAppointmentId)}</p>
          <p><b>Plantilla:</b> ${getPlantillaLabel(a.plantillaId)}</p>
          <p><b>Position:</b> ${getPositionLabel(a.jobPositionId)}</p>
          <p><b>Salary Grade:</b> ${a.salaryGrade ?? ""}</p>
          <p><b>Salary Step:</b> ${a.salaryStep ?? ""}</p>
          <p><b>Salary Annum:</b> ${a.salaryPerAnnum ?? ""}</p>
          <p><b>Salary Month:</b> ${a.salaryPerMonth ?? ""}</p>
          <p><b>Salary Day:</b> ${a.salaryPerDay ?? ""}</p>
          <p><b>Details:</b> ${a.details ?? ""}</p>
          <p><b>Active:</b> ${a.activeAppointment ? "Yes" : "No"}</p>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: "#495057",
      width: "520px",
    });
  };

  return (
    <div className={styles.ServiceRecord}>
      {/* ADD BUTTON */}
      <button onClick={handleAddNew} className={styles.addBtn}>
        New
      </button>

      {/* FORM */}
      {showForm && (
        <EmployeeAppointment
          mode="add_service_record"
          onSave={handleSave}
          onCancel={handleCancel}
          selectedEmployee={selectedEmployee}
          employeeAppointments={employeeAppointments}
        />
      )}

      <div>&nbsp;</div>

      {/* TABLE */}
      <div className={tableStyles.DTRTable}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Date Issued</th>
              <th>Assumption</th>
              <th>Nature</th>
              <th>Position</th>
              <th>Plantilla</th>
              <th>Salary Grade</th>
              <th>Salary Step</th>
              <th>Salary Annum</th>
              <th>Salary Month</th>
              <th>Salary Day</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center" }}>
                  No records yet.
                </td>
              </tr>
            ) : (
              appointments.map((a) => (
                <tr
                  key={a.employeeAppointmentId}
                  className={a.activeAppointment ? styles.activeRow : ""}
                >
                  <td>{a.appointmentIssuedDate}</td>
                  <td>{a.assumptionToDutyDate}</td>
                  <td>{getNatureLabel(a.natureOfAppointmentId)}</td>
                  <td>{getPositionLabel(a.jobPositionId)}</td>
                  <td>{getPlantillaLabel(a.plantillaId)}</td>
                  <td>{a.salaryGrade}</td>
                  <td>{a.salaryStep}</td>
                  <td>{a.salaryPerAnnum}</td>
                  <td>{a.salaryPerMonth}</td>
                  <td>{a.salaryPerDay}</td>
                  <td>
                    <button
                      onClick={() => handleShowDetails(a)}
                      style={{ cursor: "pointer" }}
                    >
                      📋 View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}