"use client";

import { runtimeConfig } from "@/lib/utils/runtimeConfig";
import React, { useState, useEffect } from "react";
import modalStyles from "@/styles/Modal.module.scss";
import styles from "@/styles/PlantillaMonitoring.module.scss";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";
import { Employee } from "@/lib/types/Employee";
import { FaChevronDown, FaChevronRight, FaTrashAlt } from "react-icons/fa";
import Swal from "sweetalert2";

const API_BASE_URL_ADMINISTRATIVE = runtimeConfig.getApiUrl("administrative");
const API_BASE_URL_HRM = runtimeConfig.getApiUrl("hrm");

const pageSizeOptions = [25, 50, 100, 300, 500];

type PlantillaRaw = {
    plantillaId: number;
    plantillaName: string;
    jobPositionId: number;
};

type JobPositionRaw = {
    jobPositionId: number;
    jobPositionName: string;
    salaryGrade: string | number;
    salaryStep: string | number;
};

type AppointmentRaw = {
    employeeAppointmentId: number;
    employeeId: number;
    plantillaId: number;
    activeAppointment: boolean;
};

type AssignedEmployee = {
    appointmentId: number;
    employeeId: string;
    fullName: string;
    employeeNo: string;
};

type PlantillaRow = {
    plantillaId: number;
    itemNo: string;
    position: string;
    grade: string;
    step: string;
    assignedEmployees: AssignedEmployee[];
};

export default function PlantillaMonitoring() {
    const [rows, setRows] = useState<PlantillaRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [selectedAppointments, setSelectedAppointments] = useState<Set<number>>(new Set());

    const load = async () => {
        setLoading(true);
        try {
            const [plantillaRes, posRes, appointmentRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/plantilla/get-all`),
                fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/job-position/get-all`),
                fetchWithAuth(`${API_BASE_URL_HRM}/api/employeeAppointment/get-all`),
            ]);

            const plantillaData: PlantillaRaw[] = await plantillaRes.json();
            const posData: JobPositionRaw[] = await posRes.json();
            const appointmentData: AppointmentRaw[] = await appointmentRes.json();
            const employees: Employee[] = localStorageUtil.getEmployees();

            const posMap = new Map<number, JobPositionRaw>(posData.map(p => [p.jobPositionId, p]));

            const built: PlantillaRow[] = plantillaData.map(pl => {
                const pos = posMap.get(pl.jobPositionId);

                const activeAppts = appointmentData.filter(
                    a => Number(a.plantillaId) === pl.plantillaId && a.activeAppointment === true
                );

                const assignedEmployees: AssignedEmployee[] = activeAppts.map(a => {
                    const emp = employees.find(e => String(e.employeeId) === String(a.employeeId));
                    return {
                        appointmentId: a.employeeAppointmentId,
                        employeeId: String(a.employeeId),
                        fullName: emp?.fullName ?? `Employee #${a.employeeId}`,
                        employeeNo: emp?.employeeNo ?? "—",
                    };
                });

                return {
                    plantillaId: pl.plantillaId,
                    itemNo: pl.plantillaName,
                    position: pos?.jobPositionName ?? "—",
                    grade: String(pos?.salaryGrade ?? "—"),
                    step: String(pos?.salaryStep ?? "—"),
                    assignedEmployees,
                };
            });

            setRows(built);
        } catch (err) {
            console.error("Failed to load Plantilla Monitoring data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clear selection whenever the expanded row changes
    useEffect(() => {
        setSelectedAppointments(new Set());
    }, [expandedId]);

    const toggleSelect = (appointmentId: number) => {
        setSelectedAppointments(prev => {
            const next = new Set(prev);
            if (next.has(appointmentId)) next.delete(appointmentId);
            else next.add(appointmentId);
            return next;
        });
    };

    const toggleSelectAll = (employees: AssignedEmployee[]) => {
        const allIds = employees.map(e => e.appointmentId);
        const allSelected = allIds.every(id => selectedAppointments.has(id));
        setSelectedAppointments(() => {
            const next = new Set<number>();
            if (!allSelected) allIds.forEach(id => next.add(id));
            return next;
        });
    };

    const handleBulkRemove = async (employees: AssignedEmployee[]) => {
        const toRemove = employees.filter(e => selectedAppointments.has(e.appointmentId));
        if (toRemove.length === 0) return;

        const count = toRemove.length;
        const result = await Swal.fire({
            title: `Remove ${count} Assignment${count > 1 ? "s" : ""}?`,
            html: `This will remove the plantilla assignment for <strong>${count} employee${count > 1 ? "s" : ""}</strong>.<br/>Their appointment records will remain active.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#5a67ba",
            confirmButtonText: "Yes, remove all",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        try {
            const results = await Promise.allSettled(
                toRemove.map(e =>
                    fetchWithAuth(
                        `${API_BASE_URL_HRM}/api/employeeAppointment/deactivate/${e.appointmentId}`,
                        { method: "PUT" }
                    )
                )
            );
            const failed = results.filter(r => r.status === "rejected").length;

            if (failed > 0) {
                Swal.fire({
                    icon: "warning",
                    title: "Partial Success",
                    text: `${count - failed} removed, ${failed} failed. Please try again for the remaining.`,
                });
            } else {
                Swal.fire({
                    icon: "success",
                    title: "Assignments Removed",
                    text: `${count} plantilla assignment${count > 1 ? "s" : ""} removed successfully.`,
                    timer: 2500,
                    showConfirmButton: false,
                });
            }

            setSelectedAppointments(new Set());
            await load();
        } catch {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: "Could not remove the assignments. Please try again.",
            });
        }
    };

    const handleRemove = async (appointmentId: number, fullName: string) => {
        const result = await Swal.fire({
            title: "Remove Plantilla Assignment?",
            html: `This will remove the plantilla assignment for <strong>${fullName}</strong>.<br/>Their appointment record will remain active.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#5a67ba",
            confirmButtonText: "Yes, remove it",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetchWithAuth(
                `${API_BASE_URL_HRM}/api/employeeAppointment/deactivate/${appointmentId}`,
                { method: "PUT" }
            );
            if (!res.ok) throw new Error("API error");

            Swal.fire({
                icon: "success",
                title: "Assignment Removed",
                text: `Plantilla assignment for ${fullName} has been deactivated.`,
                timer: 2500,
                showConfirmButton: false,
            });

            await load();
        } catch {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: "Could not remove the plantilla assignment. Please try again.",
            });
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [search, itemsPerPage]);

    const filtered = rows.filter(r => {
        const q = search.toLowerCase();
        return (
            r.itemNo.toLowerCase().includes(q) ||
            r.position.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);

    const totalOccupied = rows.filter(r => r.assignedEmployees.length > 0).length;
    const totalVacant = rows.length - totalOccupied;

    const toggleExpand = (id: number, hasEmployees: boolean) => {
        if (!hasEmployees) return;
        setExpandedId(prev => (prev === id ? null : id));
    };

    return (
        <div className={modalStyles.Modal}>
            <div className={modalStyles.modalContent}>
                <div className={modalStyles.modalHeader}>
                    <h2 className={modalStyles.mainTitle}>Plantilla Monitoring</h2>
                </div>

                <div className={modalStyles.modalBody}>
                    {/* Summary Cards */}
                    <div className={styles.summaryCards}>
                        <div className={styles.card}>
                            <div className={styles.cardValue}>{rows.length}</div>
                            <div className={styles.cardLabel}>Total Plantilla Items</div>
                        </div>
                        <div className={`${styles.card} ${styles.cardOccupied}`}>
                            <div className={styles.cardValue}>{totalOccupied}</div>
                            <div className={styles.cardLabel}>Occupied</div>
                        </div>
                        <div className={`${styles.card} ${styles.cardVacant}`}>
                            <div className={styles.cardValue}>{totalVacant}</div>
                            <div className={styles.cardLabel}>Vacant</div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className={styles.toolbar}>
                        <input
                            type="text"
                            placeholder="Search by Item No or Position..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        <div className={styles.paginationControls}>
                            <label>Rows per page:</label>
                            <select
                                className={styles.rowSelect}
                                value={itemsPerPage}
                                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            >
                                {pageSizeOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <span className={styles.recordInfo}>
                                Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(end, filtered.length)} of {filtered.length}
                            </span>
                            <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>First</button>
                            <button className={styles.pageBtn} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>Prev</button>
                            <span className={styles.pageIndicator}>Page {currentPage} of {totalPages || 1}</span>
                            <button className={styles.pageBtn} disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>Next</button>
                            <button className={styles.pageBtn} disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)}>Last</button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <p className={styles.loading}>Loading plantilla data...</p>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Plantilla / Item No</th>
                                        <th>Position</th>
                                        <th>Grade</th>
                                        <th>Step</th>
                                        <th style={{ textAlign: "center" }}>Assigned Count</th>
                                        <th style={{ textAlign: "center" }}>Status</th>
                                        <th style={{ textAlign: "center" }}>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr className={styles.emptyRow}>
                                            <td colSpan={8}>No plantilla items found.</td>
                                        </tr>
                                    ) : (
                                        paginated.map((row, idx) => (
                                            <React.Fragment key={row.plantillaId}>
                                                <tr
                                                    className={row.assignedEmployees.length > 0 ? styles.rowOccupied : styles.rowVacant}
                                                    onClick={() => toggleExpand(row.plantillaId, row.assignedEmployees.length > 0)}
                                                    style={{ cursor: row.assignedEmployees.length > 0 ? "pointer" : "default" }}
                                                >
                                                    <td>{start + idx + 1}</td>
                                                    <td>{row.itemNo}</td>
                                                    <td>{row.position}</td>
                                                    <td>{row.grade}</td>
                                                    <td>{row.step}</td>
                                                    <td className={styles.countCell}>{row.assignedEmployees.length}</td>
                                                    <td className={styles.statusCell}>
                                                        <span className={row.assignedEmployees.length > 0 ? styles.badgeOccupied : styles.badgeVacant}>
                                                            {row.assignedEmployees.length > 0 ? "Occupied" : "Vacant"}
                                                        </span>
                                                    </td>
                                                    <td className={styles.expandCell}>
                                                        {row.assignedEmployees.length > 0 && (
                                                            expandedId === row.plantillaId
                                                                ? <FaChevronDown size={13} />
                                                                : <FaChevronRight size={13} />
                                                        )}
                                                    </td>
                                                </tr>

                                                {expandedId === row.plantillaId && row.assignedEmployees.length > 0 && (
                                                    <tr className={styles.expandedRow}>
                                                        <td colSpan={8}>
                                                            <div className={styles.employeeList}>
                                                                <div className={styles.employeeListHeader}>
                                                                    <strong>Assigned Employees ({row.assignedEmployees.length})</strong>
                                                                    {selectedAppointments.size > 0 && (
                                                                        <button
                                                                            className={styles.bulkRemoveBtn}
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                handleBulkRemove(row.assignedEmployees);
                                                                            }}
                                                                        >
                                                                            <FaTrashAlt size={12} />
                                                                            Remove Selected ({selectedAppointments.size})
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <table className={styles.innerTable}>
                                                                    <thead>
                                                                        <tr>
                                                                            <th style={{ width: 36, textAlign: "center" }}>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    title="Select all"
                                                                                    checked={row.assignedEmployees.length > 0 && row.assignedEmployees.every(e => selectedAppointments.has(e.appointmentId))}
                                                                                    onChange={ev => {
                                                                                        ev.stopPropagation();
                                                                                        toggleSelectAll(row.assignedEmployees);
                                                                                    }}
                                                                                />
                                                                            </th>
                                                                            <th>Employee No</th>
                                                                            <th>Full Name</th>
                                                                            <th style={{ textAlign: "center" }}>Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {row.assignedEmployees.map(emp => (
                                                                            <tr
                                                                                key={emp.employeeId}
                                                                                className={selectedAppointments.has(emp.appointmentId) ? styles.rowSelected : ""}
                                                                            >
                                                                                <td style={{ textAlign: "center" }}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={selectedAppointments.has(emp.appointmentId)}
                                                                                        onChange={ev => {
                                                                                            ev.stopPropagation();
                                                                                            toggleSelect(emp.appointmentId);
                                                                                        }}
                                                                                        onClick={e => e.stopPropagation()}
                                                                                    />
                                                                                </td>
                                                                                <td>{emp.employeeNo}</td>
                                                                                <td>{emp.fullName}</td>
                                                                                <td style={{ textAlign: "center" }}>
                                                                                    <button
                                                                                        className={styles.removeBtn}
                                                                                        title="Remove plantilla assignment"
                                                                                        onClick={e => {
                                                                                            e.stopPropagation();
                                                                                            handleRemove(emp.appointmentId, emp.fullName);
                                                                                        }}
                                                                                    >
                                                                                        <FaTrashAlt size={12} />
                                                                                        Remove
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
