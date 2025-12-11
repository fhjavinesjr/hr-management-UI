"use client";

import React, { useEffect, useState } from "react";
import styles from "@/styles/Separation.module.scss";
import Swal from "sweetalert2";
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE;

// Add the type model for the form fields
type SeparationForm = {
  separationDate: string;
  natureOfSeparation: string;
  remarks: string;
  exitInterviewBy: string;
  exitInterviewDate: string;
};

  type NatureOfSeparationDTO = {
      natureOfSeparationId: number;
      code: string;
      nature: string;
  };

export default function Separation() {
  const [natureList, setNatureList] = useState<NatureOfSeparationDTO[]>([]);
  const [isDisabled, setIsDisabled] = useState(true);
  const [formData, setFormData] = useState<SeparationForm>({
    separationDate: "",
    natureOfSeparation: "",
    remarks: "",
    exitInterviewBy: "",
    exitInterviewDate: "",
  });

  useEffect(() => {
    fetchNatureList();
  }, []);

  const fetchNatureList = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL_ADMINISTRATIVE}/api/natureOfSeparation/get-all`
      );

      if (!res.ok) throw new Error("Failed to fetch list");

      const data = await res.json();
      setNatureList(data);
    } catch (error) {
      console.error("Error fetching nature list:", error);
      Swal.fire({ icon: "error", title: "Failed to load Nature of Separation" });
    }
  };


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

  const handleEditToggle = (e: React.FormEvent) => {
    e.preventDefault();
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
              required={!isDisabled}
            >
              <option value="">-- Select --</option>
              {natureList.map((item) => (
                <option
                  key={item.natureOfSeparationId}
                  value={item.nature}
                >
                  {item.code} - {item.nature}
                </option>
              ))}
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