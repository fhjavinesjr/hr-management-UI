"use client";

import React, { useEffect, useState } from "react";
import tableStyles from "@/styles/DTRTable.module.scss";
import styles from "@/styles/ServiceRecord.module.scss";
import { Employee } from "@/lib/types/Employee";
import { EmployeeAppointmentModel } from "@/lib/types/EmployeeAppointment";

import EmployeeAppointment, { Appointment } from "@/app/hr-management/employeeappointment/EmployeeAppointment";
import Swal from "sweetalert2";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { toDateInputValue } from "@/lib/utils/dateFormatUtils";

// toast mixin for bottom-right notifications
const Toast = Swal.mixin({
  toast: true,
  position: "bottom-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

import {
  fetchAllNatureList,
  fetchAllJobPositions,
  fetchAllPlantillas
} from "@/lib/services/api";

import {
  JobPositionDTO,
  PlantillaDTO,
  NatureOfAppointmentDTO,
} from "@/lib/types/EmployeeAppointment";

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
  const [natureList, setNatureList] = useState<NatureOfAppointmentDTO[]>([]);
  const [positionList, setPositionList] = useState<JobPositionDTO[]>([]);
  const [plantillaList, setPlantillaList] = useState<PlantillaDTO[]>([]);

  const [appointments, setAppointments] = useState<EmployeeAppointmentModel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

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

  const handleAddNew = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setShowForm(false);
    setEditingAppointment(null);

    // Ask parent to re-fetch records (preferred)
    if (fetchEmploymentRecords) {
      await fetchEmploymentRecords();
    }

    Toast.fire({ icon: "success", title: "Service record saved" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };

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

  // Edit appointment - open the EmployeeAppointment form with initial data
  const handleEditAppointment = (a: EmployeeAppointmentModel) => {
    // Map to Appointment type expected by EmployeeAppointment
    const initialData: Appointment = {
      employeeAppointmentId: a.employeeAppointmentId,
      appointmentIssuedDate: a.appointmentIssuedDate ? toDateInputValue(a.appointmentIssuedDate) : "",
      assumptionToDutyDate: a.assumptionToDutyDate ? toDateInputValue(a.assumptionToDutyDate) : "",
      natureOfAppointmentId: a.natureOfAppointmentId ? Number(a.natureOfAppointmentId) : 0,
      plantillaId: a.plantillaId ? Number(a.plantillaId) : 0,
      jobPositionId: a.jobPositionId ? Number(a.jobPositionId) : 0,
      // Coerce numeric salary/grade values to strings so "0" is preserved (0 is falsy)
      salaryGrade: a.salaryGrade !== undefined && a.salaryGrade !== null ? String(a.salaryGrade) : "",
      salaryStep: a.salaryStep !== undefined && a.salaryStep !== null ? String(a.salaryStep) : "",
      salaryPerAnnum: a.salaryPerAnnum !== undefined && a.salaryPerAnnum !== null ? String(a.salaryPerAnnum) : "",
      salaryPerMonth: a.salaryPerMonth !== undefined && a.salaryPerMonth !== null ? String(a.salaryPerMonth) : "",
      salaryPerDay: a.salaryPerDay !== undefined && a.salaryPerDay !== null ? String(a.salaryPerDay) : "",
      details: a.details ?? "",
      activeAppointment: a.activeAppointment ?? false,
      mode: "edit_service_record"
    };

    setEditingAppointment(initialData);
    setShowForm(true);
  };

  // Delete appointment
  const handleDeleteAppointment = (id?: string | null) => {
    if (!id) return;

    Swal.fire({
      title: "Confirm Deletion",
      text: "Are you sure you want to delete this service record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;
          const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/employeeAppointment/delete/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete");

          // Refresh parent data if available
          if (fetchEmploymentRecords) {
            await fetchEmploymentRecords();
          } else {
            // Fallback: remove locally
            setAppointments((prev) => prev.filter((x) => x.employeeAppointmentId !== id));
          }

          Toast.fire({ icon: "success", title: "Record deleted" });
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "Failed to delete record", "error");
        }
      }
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
          mode="service_record"
          initialData={editingAppointment ?? undefined}
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
              <th>Actions</th>
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
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleShowDetails(a)}
                        style={{ cursor: "pointer" }}
                        title="View"
                      >
                        📋
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditAppointment(a)}
                        style={{ cursor: "pointer" }}
                        title="Edit"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAppointment(a.employeeAppointmentId)}
                        style={{ cursor: "pointer" }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
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