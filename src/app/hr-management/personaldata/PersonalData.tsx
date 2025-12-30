"use client";

import React, { useState, useEffect } from "react";
import styles from "@/styles/PersonalData.module.scss";
const API_BASE_URL_HRM = process.env.NEXT_PUBLIC_API_BASE_URL_HRM;
import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { toCustomFormat, toDateInputValue } from "@/lib/utils/dateFormatUtils";
import { Employee } from "@/lib/types/Employee";
import Swal from "sweetalert2";
import { PersonalDataModel } from "@/lib/types/PersonalData";
import { ChildItem } from "@/lib/types/Children";
import Image from "next/image";
import { localStorageUtil } from "@/lib/utils/localStorageUtil";

type PersonalDataProps = {
  selectedEmployee?: Employee | null;
  personalData?: PersonalDataModel | null;
  fetchEmploymentRecords?: () => Promise<void>;
  onEmployeeCreated?: (employee: Employee) => void;
  newSetEmployees?: (employees: Employee[]) => void;
};

export default function PersonalData({
  selectedEmployee,
  personalData,
  fetchEmploymentRecords,
  onEmployeeCreated,
  newSetEmployees,
}: PersonalDataProps) {
  const [form, setForm] = useState<PersonalDataModel>({
    personalDataId: "",
    employeeNo: "",
    biometricNo: "",
    userRole: "",
    employeeId: "",
    surname: "",
    firstname: "",
    middlename: "",
    extname: "",
    dob: "",
    pob: "",
    sex_id: 0,
    civilStatus_id: 0,
    height: "",
    weight: "",
    bloodType: "",
    gsisId: "",
    pagibigId: "",
    philhealthNo: "",
    sssNo: "",
    tinNo: "",
    agencyEmpNo: "",
    citizenship: "",
    resAddress: "",
    resZip: "",
    permAddress: "",
    permZip: "",
    telNo: "",
    mobileNo: "",
    email: "",
    employeePicture: null,
    employeeSignature: null,
    govIdNumber: "",
    govIdType: "",
    govIdDate: "",
    govIdPlace: "",
    q34a: "",
    q34b: "",
    q35a: "",
    q35b: "",
    q36: "",
    q37a: "",
    q37b: "",
    q37c: "",
    q38: "",
    q39a: "",
    q39b: "",
    q39c: "",
    q34aDetails: "",
    q34bDetails: "",
    q35aDetails: "",
    q35bDetails: "",
    q35bDateFiled: "",
    q35bStatus: "",
    q36Details: "",
    q37aDetails: "",
    q37bDetails: "",
    q37cDetails: "",
    q38Details: "",
    q39aDetails: "",
    q39bDetails: "",
    q39cDetails: "",
    q42: false,
  });
  
  const resetAllPersonalDataFields = () => {
    setForm({
      personalDataId: "",
      employeeNo: "",
      biometricNo: "",
      userRole: "",
      employeeId: "",
      surname: "",
      firstname: "",
      middlename: "",
      extname: "",
      dob: "",
      pob: "",
      sex_id: 0,
      civilStatus_id: 0,
      height: "",
      weight: "",
      bloodType: "",
      gsisId: "",
      pagibigId: "",
      philhealthNo: "",
      sssNo: "",
      tinNo: "",
      agencyEmpNo: "",
      citizenship: "",
      resAddress: "",
      resZip: "",
      permAddress: "",
      permZip: "",
      telNo: "",
      mobileNo: "",
      email: "",
      employeePicture: null,
      employeeSignature: null,
      govIdNumber: "",
      govIdType: "",
      govIdDate: "",
      govIdPlace: "",
      q34a: "",
      q34b: "",
      q35a: "",
      q35b: "",
      q36: "",
      q37a: "",
      q37b: "",
      q37c: "",
      q38: "",
      q39a: "",
      q39b: "",
      q39c: "",
      q34aDetails: "",
      q34bDetails: "",
      q35aDetails: "",
      q35bDetails: "",
      q35bDateFiled: "",
      q35bStatus: "",
      q36Details: "",
      q37aDetails: "",
      q37bDetails: "",
      q37cDetails: "",
      q38Details: "",
      q39aDetails: "",
      q39bDetails: "",
      q39cDetails: "",
      q42: false,
    });

    // Arrays must also reset
    setChildren([{ childrenId: 0, personalDataId: 0, childFullname: "", dob: "" }]);
    // Clear the queued deletions when fields are reset
    setDeletedChildrenIds([]);

    setEducation([
      {
        level: "",
        school: "",
        course: "",
        from: "",
        to: "",
        units: "",
        yearGraduated: "",
        honors: "",
      },
    ]);

    setEligibilities([
      {
        careerService: "",
        rating: "",
        examDate: "",
        examPlace: "",
        licenseNumber: "",
        validity: "",
      },
    ]);

    setWorkExperience([
      {
        from: "",
        to: "",
        position: "",
        department: "",
        salary: "",
        payGrade: "",
        status: "",
        govService: "",
      },
    ]);

    setVoluntaryWork([
      {
        orgName: "",
        from: "",
        to: "",
        hours: "",
        position: "",
      },
    ]);

    setTrainings([
      {
        title: "",
        from: "",
        to: "",
        hours: "",
        type: "",
        conductedBy: "",
      },
    ]);

    setReferences([
      {
        name: "",
        address: "",
        tel: "",
      },
    ]);
  };

  useEffect(() => {
    if (personalData === null || selectedEmployee === null) {
      resetAllPersonalDataFields();
    }
  }, [personalData, selectedEmployee]);

  useEffect(() => {
    if (selectedEmployee?.isCleared) {
      setForm({
        personalDataId: "",
        employeeNo: "",
        biometricNo: "",
        userRole: "",
        employeeId: "",
        surname: "",
        firstname: "",
        middlename: "",
        extname: "",
        dob: "",
        pob: "",
        sex_id: 0,
        civilStatus_id: 0,
        height: "",
        weight: "",
        bloodType: "",
        gsisId: "",
        pagibigId: "",
        philhealthNo: "",
        sssNo: "",
        tinNo: "",
        agencyEmpNo: "",
        citizenship: "",
        resAddress: "",
        resZip: "",
        permAddress: "",
        permZip: "",
        telNo: "",
        mobileNo: "",
        email: "",
        employeePicture: null,
        employeeSignature: null,
        govIdNumber: "",
        govIdType: "",
        govIdDate: "",
        govIdPlace: "",
        q34a: "",
        q34b: "",
        q35a: "",
        q35b: "",
        q36: "",
        q37a: "",
        q37b: "",
        q37c: "",
        q38: "",
        q39a: "",
        q39b: "",
        q39c: "",
        q34aDetails: "",
        q34bDetails: "",
        q35aDetails: "",
        q35bDetails: "",
        q35bDateFiled: "",
        q35bStatus: "",
        q36Details: "",
        q37aDetails: "",
        q37bDetails: "",
        q37cDetails: "",
        q38Details: "",
        q39aDetails: "",
        q39bDetails: "",
        q39cDetails: "",
        q42: false,
      });

      // Also clear repeating sections
      setChildren([{ childrenId: 0, personalDataId: 0, childFullname: "", dob: "" }]);
      // Clear any pending deletion queue
      setDeletedChildrenIds([]);
      setEducation([
        {
          level: "",
          school: "",
          course: "",
          from: "",
          to: "",
          units: "",
          yearGraduated: "",
          honors: "",
        },
      ]);
      setEligibilities([
        {
          careerService: "",
          rating: "",
          examDate: "",
          examPlace: "",
          licenseNumber: "",
          validity: "",
        },
      ]);
      setWorkExperience([
        {
          from: "",
          to: "",
          position: "",
          department: "",
          salary: "",
          payGrade: "",
          status: "",
          govService: "",
        },
      ]);
      setVoluntaryWork([
        { orgName: "", from: "", to: "", hours: "", position: "" },
      ]);
      setTrainings([
        { title: "", from: "", to: "", hours: "", type: "", conductedBy: "" },
      ]);
      setReferences([{ name: "", address: "", tel: "" }]);
    }
  }, [selectedEmployee?.isCleared]);

  // Helper to extract numeric personalDataId from possible shapes
  const extractPersonalDataId = (pd?: PersonalDataModel | null): number | null => {
    if (!pd) {
      return null;
    }
    const maybe = (pd as any).personalDataId ?? (pd as any).id ?? (pd as any).personalData_id ?? pd.personalDataId ?? null;
    if (typeof maybe === "number") {
      return maybe;
    }
    if (typeof maybe === "string" && maybe.trim() !== "" && !Number.isNaN(Number(maybe))) {
      return Number(maybe);
    }
    return null;
  };

  // Populate personal data when fetched from backend
  useEffect(() => {
    if (personalData) {
      setForm((prev) => ({
        ...prev,
        ...personalData, // map matching fields directly
        email: personalData.email ?? "",
        mobileNo: personalData.mobileNo ?? "",
        employeeNo: personalData.employeeNo ?? "",
        dob: toDateInputValue(personalData.dob != null ? personalData.dob : ""),
        govIdDate: toDateInputValue(personalData.govIdDate != null ? personalData.govIdDate : ""),
        q35bDateFiled: toDateInputValue(personalData.q35bDateFiled || ""),
      }));
    }
  }, [personalData]);

  // Whenever the parent loads or updates personalData, fetch children for it
  useEffect(() => {
    const id = extractPersonalDataId(personalData);
    if (id) {
      fetchChildren(id);
    }
  }, [personalData]);

  const [isDisabled, setIsDisabled] = useState(true);

  // Dynamic rows for repeating sections
  const [eligibilities, setEligibilities] = useState([
    {
      careerService: "",
      rating: "",
      examDate: "",
      examPlace: "",
      licenseNumber: "",
      validity: "",
    },
  ]);
  const [workExperience, setWorkExperience] = useState([
    {
      from: "",
      to: "",
      position: "",
      department: "",
      salary: "",
      payGrade: "",
      status: "",
      govService: "",
    },
  ]);
  const [voluntaryWork, setVoluntaryWork] = useState([
    { orgName: "", from: "", to: "", hours: "", position: "" },
  ]);
  const [trainings, setTrainings] = useState([
    { title: "", from: "", to: "", hours: "", type: "", conductedBy: "" },
  ]);
  const [references, setReferences] = useState([
    { name: "", address: "", tel: "" },
  ]);
  const [education, setEducation] = useState([
    {
      level: "",
      school: "",
      course: "",
      from: "",
      to: "",
      units: "",
      yearGraduated: "",
      honors: "",
    },
  ]);
  const [children, setChildren] = useState<ChildItem[]>([{ childrenId: 0, personalDataId: 0, childFullname: "", dob: "" }]);
  // Holds IDs of children removed in the UI that need to be deleted on the server when saving
  const [deletedChildrenIds, setDeletedChildrenIds] = useState<number[]>([]);

  // Fetch children from backend with flexible parsing — returns parsed items
  const fetchChildren = async (personalDataId: number): Promise<ChildItem[]> => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/fetch/children/by/${personalDataId}`);
      if (!res.ok) {
        const fallback = [{ childrenId: 0, personalDataId, childFullname: "", dob: "" }];
        setChildren(fallback);
        return fallback;
      }

      const data = await res.json();

      // flexible handling: backend may return { children: [...] } or an array, or a single dto
      let items: unknown[] = [];
      if (Array.isArray(data)) {
        items = data as unknown[];
      } else if (data && Array.isArray((data as any).children)) {
        items = (data as any).children;
      } else if (data && ((data as any).childFullname || (data as any).dob)) {
        items = [data];
      }

      if (items.length === 0) {
        const fallback = [{ childrenId: 0, personalDataId, childFullname: "", dob: "" }];
        setChildren(fallback);
        return fallback;
      }

      const mapped: ChildItem[] = items.map((c: any) => ({
        childrenId: Number(c.childrenId ?? c.children_id ?? c.childId ?? 0),
        personalDataId: personalDataId,
        childFullname: String(c.childFullname ?? c.childFullName ?? c.name ?? ""),
        dob: toDateInputValue(String(c.dob ?? c.childDob ?? "")),
      }));

      setChildren(mapped);
      return mapped;
    } catch (err) {
      console.error("Failed to fetch children", err);
      const fallback = [{ childrenId: 0, personalDataId, childFullname: "", dob: "" }];
      setChildren(fallback);
      return fallback;
    }
  };

  // Create or update children for a given personalDataId
  const upsertChildren = async (personalDataId: number) => {
    try {
      // remove empty rows
      const filtered = children
        .map((c) => ({ ...c }))
        .filter((c) => (c.childFullname && c.childFullname.trim()) || (c.dob && c.dob.trim()));

      // Process any removals first (delete by individual child ID)
      let anyDeleted = false;
      if (deletedChildrenIds.length > 0) {
        for (const id of deletedChildrenIds) {
          try {
            const delRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/children/delete/${id}`, { method: "DELETE" });
            if (delRes.ok) {
              anyDeleted = true;
            } else {
              console.warn("Failed to delete child id", id, await delRes.text());
            }
          } catch (err) {
            console.error("Error deleting child id", id, err);
          }
        }
        // Clear the deletion queue regardless — we either deleted or attempted to delete those ids
        setDeletedChildrenIds([]);
      }

      // Split into updates vs creates
      const toUpdate = filtered.filter((c) => c.childrenId && Number(c.childrenId) > 0);
      const toCreate = filtered.filter((c) => !c.childrenId || Number(c.childrenId) === 0);

      let anyUpdated = false;
      let anyCreated = false; 

      // Attempt updates
      for (const c of toUpdate) {
        const payload = { personalDataId, childFullname: c.childFullname, dob: toCustomFormat(c.dob, false) };
        console.debug("Updating child payload:", payload, "id:", c.childrenId);

        const updateRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/children/update/${c.childrenId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });

        if (updateRes.ok) {
          try {
            const json = await updateRes.json();
            if (json) anyUpdated = true;
          } catch (e) {
            // Some endpoints return empty body with ok status — treat as success
            anyUpdated = true;
          }
        } else {
          // If update failed, fallback to create later
          toCreate.push(c);
        }
      }

      // If there are items to create, delete existing entries once, then create them
      if (toCreate.length > 0) {
        for (const c of toCreate) {
          const payload = { personalDataId, childFullname: c.childFullname, dob: toCustomFormat(c.dob, false) };
          const createRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/create/children`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          });

          if (createRes.ok) {
            anyCreated = true;
            const txt = await createRes.text();
            console.debug("Children create response:", createRes.status, txt);
          } else {
            console.warn("Failed to create child", await createRes.text());
          }
        }
      }

      // If anything changed (deleted/updated/created), re-fetch children to update UI and return a result
      if (anyDeleted || anyUpdated || anyCreated) {
        await fetchChildren(personalDataId);
        if (anyUpdated && !anyCreated && !anyDeleted) return "isUpdated";
        return true;
      }

      return false;
    } catch (err) {
      console.error("Failed to upsert children", err);
      return false;
    }
  };

  // Helpers
  const handleAdd = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    data: T
  ) => setter((prev) => [...prev, data]);
  const handleRemove = <T,>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number
  ) => setter((prev) => prev.filter((_, i) => i !== index));

  // Special remove for children: track deleted IDs so they can be deleted on the server when saving
  const handleRemoveChild = (index: number) => {
    setChildren((prev) => {
      const removed = prev[index];
      if (removed && removed.childrenId && Number(removed.childrenId) > 0) {
        setDeletedChildrenIds((prevIds) => [...prevIds, Number(removed.childrenId)]);
      }
      return prev.filter((_, i) => i !== index);
    });
  }; 

  const handleCancel = () => {
    setIsDisabled(true); // disable editing again
  };

  const handleEditToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDisabled((prev) => {
      return !prev;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Auto-convert numeric fields
    const numericFields = ["sex_id", "civilStatus_id", "height", "weight"];

    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }));
  };

  // Convert files to Base64 strings
  const toBase64 = (file?: File | null): Promise<string | null> =>
  new Promise((resolve, reject) => {
    // ✅ Handle null or undefined file gracefully
    if (!file) {
      resolve(null);
      return;
    }

    // ✅ Ensure it's actually a Blob (File is a subclass of Blob)
    if (!(file instanceof Blob)) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;

      // ✅ Safely remove the "data:image/...;base64," prefix
      const base64Data = result.includes(",") ? result.split(",")[1] : result;

      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let employeeUrl = `${API_BASE_URL_HRM}/api/employee/register`;
    let personalDataUrl = `${API_BASE_URL_HRM}/api/create/personal-data`;
    let submitMethod = "POST";
    if (selectedEmployee?.isSearched) {
      // Update existing personal data
      employeeUrl = `${API_BASE_URL_HRM}/api/employee/update/${selectedEmployee.employeeId}`;
      personalDataUrl = `${API_BASE_URL_HRM}/api/personal-data/update/${selectedEmployee.employeeId}`;
      submitMethod = "PUT";
    }

    try {
      if(form.q42 === false) {
        Swal.fire({
              icon: "error",
              title: "Declaration Required",
              text: `Please tick the 'I declare under oath...' checkbox to confirm the truthfulness and completeness of your Personal Data Sheet before saving.`,
            });

        return;
      }

      const employeeMappedData = {
        employeeNo: form.employeeNo,
        biometricNo: form.biometricNo,
        role: form.userRole,
        lastname: form.surname,
        firstname: form.firstname,
        suffix: form.extname,
      };

      // Send as JSON
      const resEmployee = await fetchWithAuth(employeeUrl, {
        method: submitMethod,
        body: JSON.stringify(employeeMappedData),
        headers: { "Content-Type": "application/json" },
      });

      if (!resEmployee.ok) {
        const text = await resEmployee.text();
        throw new Error(`Failed to save employee identification: ${text}`);
      }

      const employeeData = await resEmployee.json();
      
      // Prepare JSON data
      const mappedData = {
        employeeId: employeeData.employeeId !== null ? employeeData.employeeId : selectedEmployee?.employeeId,
        surname: form.surname,
        firstname: form.firstname,
        middlename: form.middlename,
        extname: form.extname,
        dob: form.dob ? toCustomFormat(form.dob, false) : null,
        pob: form.pob,
        sex_id: form.sex_id,
        civilStatus_id: form.civilStatus_id,
        height: form.height !== null ? Number(form.height) : 0,
        weight: form.weight !== null ? Number(form.weight) : 0,
        bloodType: form.bloodType,
        gsisId: form.gsisId,
        pagibigId: form.pagibigId,
        philhealthNo: form.philhealthNo,
        sssNo: form.sssNo,
        tinNo: form.tinNo,
        agencyEmpNo: form.agencyEmpNo,
        citizenship: form.citizenship,
        resAddress: form.resAddress,
        resZip: form.resZip,
        permAddress: form.permAddress,
        permZip: form.permZip,
        telNo: form.telNo,
        mobileNo: form.mobileNo,
        email: form.email,
        spouseSurname: form.spouseSurname ?? "",
        spouseFirstname: form.spouseFirstname ?? "",
        spouseMiddlename: form.spouseMiddlename ?? "",
        spouseOccupation: form.spouseOccupation ?? "",
        spouseEmployer: form.spouseEmployer ?? "",
        spouseBusinessAddress: form.spouseBusinessAddress ?? "",
        spouseTelNo: form.spouseTelNo ?? "",
        fatherSurname: form.fatherSurname ?? "",
        fatherFirstname: form.fatherFirstname ?? "",
        fatherMiddlename: form.fatherMiddlename ?? "",
        motherSurname: form.motherSurname ?? "",
        motherFirstname: form.motherFirstname ?? "",
        motherMiddlename: form.motherMiddlename ?? "",
        govIdNumber: form.govIdNumber,
        govIdType: form.govIdType,
        govIdDate: form.govIdDate
          ? toCustomFormat(form.govIdDate, false)
          : null,
        govIdPlace: form.govIdPlace,
        skillOrHobby: form.skillOrHobby ?? "",
        distinction: form.distinction ?? "",
        association: form.association ?? "",
        q34a: form.q34a ?? "",
        q34b: form.q34b ?? "",
        q35a: form.q35a ?? "",
        q35b: form.q35b ?? "",
        q36: form.q36 ?? "",
        q37a: form.q37a ?? "",
        q37b: form.q37b ?? "",
        q37c: form.q37c ?? "",
        q38: form.q38 ?? "",
        q39a: form.q39a ?? "",
        q39b: form.q39b ?? "",
        q39c: form.q39c ?? "",
        q34aDetails: form.q34aDetails ?? "",
        q34bDetails: form.q34bDetails ?? "",
        q35aDetails: form.q35aDetails ?? "",
        q35bDetails: form.q35bDetails ?? "",
        q35bDateFiled: form.q35bDateFiled
          ? toCustomFormat(form.q35bDateFiled, false)
          : null,
        q35bStatus: form.q35bStatus ?? "",
        q36Details: form.q36Details ?? "",
        q37aDetails: form.q37aDetails ?? "",
        q37bDetails: form.q37bDetails ?? "",
        q37cDetails: form.q37cDetails ?? "",
        q38Details: form.q38Details ?? "",
        q39aDetails: form.q39aDetails ?? "",
        q39bDetails: form.q39bDetails ?? "",
        q39cDetails: form.q39cDetails ?? "",
        q42: form.q42 ? "true" : "false",
        employeePicture:
          form.employeePicture instanceof File
            ? await toBase64(form.employeePicture) // Convert new uploads
            : typeof form.employeePicture === "string"
            ? form.employeePicture.split(",")[1] // Keep existing base64 (remove prefix)
            : null,

        employeeSignature:
          form.employeeSignature instanceof File
            ? await toBase64(form.employeeSignature)
            : typeof form.employeeSignature === "string"
            ? form.employeeSignature.split(",")[1]
            : null,
      };

      // Send as JSON
      const res = await fetchWithAuth(personalDataUrl, {
        method: submitMethod,
        body: JSON.stringify(mappedData),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to save personal data: ${text}`);
      }

      //Additionally sync children data after personal data is saved
      try {
        const personalDataId = Number(form.personalDataId);
        if (form.personalDataId) {
          const upserted = await upsertChildren(personalDataId);
          let titleUpdate = "Children saved";
          if (upserted === "isUpdated") {
            titleUpdate = "Children updated"; 
          }
          if (upserted) {
            Swal.fire({ toast: true, position: 'bottom-end', icon: 'success', title: titleUpdate, showConfirmButton: false, timer: 2000 });
          } else {
            Swal.fire({ toast: true, position: 'bottom-end', icon: 'error', title: 'Failed to save children', showConfirmButton: false, timer: 2000 });
          }
        }
      } catch (err) {
        console.warn('Error syncing children:', err);
      }

      setIsDisabled(true);
      Swal.fire({
        icon: "success",
        title: selectedEmployee?.isSearched ? "Employee Updated" : "Employee Created",
        text: `Employee No: ${employeeData.employeeNo}`,
      }).then(async () => {
        // Re-fetch records so parent can refresh personalData
        if (fetchEmploymentRecords) {
          await fetchEmploymentRecords();
        }

        if(submitMethod === "POST") {
          // Fetch employees
          const empRes = await fetchWithAuth(
            `${API_BASE_URL_HRM}/api/employees/basicInfo`
          );
    
          if (!empRes.ok) {
            throw new Error("Failed to fetch employee list");
          }
    
          const employees: Employee[] = await empRes.json();
          localStorageUtil.setEmployees(employees); //Store employees list to be used later in other module
          const createdEmployee = employees.find(emp => emp.employeeNo === form.employeeNo) || null;

          if (createdEmployee && onEmployeeCreated) {
            onEmployeeCreated(createdEmployee); // 🚀 PASS BACK TO PARENT
            newSetEmployees?.(employees); // Update employees in parent component
          }
        }
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    //Personal Data's Modal placeholder is in the EmploymentRecords.tsx
    <form className={styles.PersonalData} onSubmit={handleSubmit}>
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
            {selectedEmployee && selectedEmployee.isSearched === true
              ? "Edit"
              : "New"}
          </button>
        )}
      </div>

      <div>&nbsp;</div>

      <section>
        <h2>I. Employee Identification</h2>
        <div className={styles.grid2}>
          <label>
            <span>
              Employee No. <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="text"
              name="employeeNo"
              value={form.employeeNo}
              onChange={handleChange}
              disabled={isDisabled}
              required
            />
          </label>

          <label>
            <span>
              Biometric No. <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="text"
              name="biometricNo"
              value={form.biometricNo}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            />
          </label>

          <label>
            <span>
              Role <span style={{ color: "red" }}>*</span>
            </span>
            <select
              name="userRole"
              value={form.userRole}
              onChange={handleChange}
              disabled={isDisabled}
            >
              <option value="">-- Select Role --</option>
              <option value="1">ADMIN</option>
              <option value="2">USER</option>
            </select>
          </label>
        </div>

        {/* II. PERSONAL INFORMATION */}
        <h2>II. Personal Information</h2>
        <div className={styles.grid2}>
          <label>
            <span>
              Surname <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="text"
              name="surname"
              value={form.surname}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            />
          </label>
          <label>
            <span>
              First Name <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="text"
              name="firstname"
              value={form.firstname}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            />
          </label>
          <label>
            <span>
              Middle Name <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="text"
              name="middlename"
              value={form.middlename}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            />
          </label>
          <label>
            Name Extension (Jr, Sr){" "}
            <input
              type="text"
              name="extname"
              value={form.extname}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            <span>
              Date of Birth <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            />
          </label>
          <label>
            Place of Birth{" "}
            <input
              type="text"
              name="pob"
              value={form.pob}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            <span>
              Sex <span style={{ color: "red" }}>*</span>
            </span>
            <select
              name="sex_id"
              value={form.sex_id}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            >
              <option value="">--Select--</option>
              <option value="1">Male</option>
              <option value="2">Female</option>
            </select>
          </label>
          <label>
            <span>
              Civil Status <span style={{ color: "red" }}>*</span>
            </span>
            <select
              name="civilStatus_id"
              value={form.civilStatus_id}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            >
              <option value="">--Select--</option>
              <option value="1">Single</option>
              <option value="2">Married</option>
              <option value="3">Widowed</option>
              <option value="4">Separated</option>
              <option value="5">Other/s</option>
            </select>
          </label>

          <label>
            Height (m){" "}
            <input
              type="text"
              name="height"
              value={form.height}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Weight (kg){" "}
            <input
              type="text"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Blood Type{" "}
            <input
              type="text"
              name="bloodType"
              value={form.bloodType}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            GSIS ID No.{" "}
            <input
              type="text"
              name="gsisId"
              value={form.gsisId}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            PAG-IBIG ID No.{" "}
            <input
              type="text"
              name="pagibigId"
              value={form.pagibigId}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            PhilHealth No.{" "}
            <input
              type="text"
              name="philhealthNo"
              value={form.philhealthNo}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            SSS No.{" "}
            <input
              type="text"
              name="sssNo"
              value={form.sssNo}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            TIN No.{" "}
            <input
              type="text"
              name="tinNo"
              value={form.tinNo}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Agency Employee No.{" "}
            <input
              type="text"
              name="agencyEmpNo"
              value={form.agencyEmpNo}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Citizenship{" "}
            <input
              type="text"
              name="citizenship"
              value={form.citizenship}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Residential Address{" "}
            <input
              type="text"
              name="resAddress"
              value={form.resAddress}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            ZIP Code{" "}
            <input
              type="text"
              name="resZip"
              value={form.resZip}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Permanent Address{" "}
            <input
              type="text"
              name="permAddress"
              value={form.permAddress}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            ZIP Code{" "}
            <input
              type="text"
              name="permZip"
              value={form.permZip}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Telephone No.{" "}
            <input
              type="text"
              name="telNo"
              value={form.telNo}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            <span>
              Mobile No. <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="text"
              name="mobileNo"
              value={form.mobileNo}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            />
          </label>
          <label>
            <span>
              Email Address <span style={{ color: "red" }}>*</span>
            </span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={isDisabled}
              required={true}
            />
          </label>
        </div>

        {/* Employee Picture and Signature Upload */}
        <div className={styles.grid2}>
          <div className={styles.fileUpload}>
            <h3>Employee Picture</h3>
            <label>
              Upload Image File
              <input
                type="file"
                name="employeePicture"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setForm((prev) => ({
                    ...prev,
                    employeePicture: file,
                  }));
                }}
                disabled={isDisabled}
              />
            </label>
            {/* ✅ Image preview */}
            {form.employeePicture && (
              <div className={styles.previewContainer}>
                <Image
                  src={
                    form.employeePicture instanceof File
                      ? URL.createObjectURL(form.employeePicture)
                      : form.employeePicture // base64 data URL
                  }
                  alt="Employee Picture"
                  width={150}
                  height={150}
                  style={{
                    borderRadius: "10px",
                    objectFit: "cover",
                    border: "1px solid #ccc",
                  }}
                  priority={true}
                />
              </div>
            )}
          </div>

          <div className={styles.fileUpload}>
            <h3>Employee Signature</h3>
            <label>
              Upload Image File
              <input
                type="file"
                name="employeeSignature"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setForm((prev) => ({
                    ...prev,
                    employeeSignature: file,
                  }));
                }}
                disabled={isDisabled}
              />
            </label>
            {/* ✅ Signature preview */}
            {form.employeeSignature && (
              <div className={styles.previewContainer}>
                <Image
                  src={
                    form.employeeSignature instanceof File
                      ? URL.createObjectURL(form.employeeSignature)
                      : form.employeeSignature
                  }
                  alt="Employee Signature"
                  width={150}
                  height={100}
                  style={{
                    borderRadius: "6px",
                    objectFit: "contain",
                    border: "1px solid #ccc",
                    backgroundColor: "#f9f9f9",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* III. FAMILY BACKGROUND */}
      <section>
        <h2>III. Family Background</h2>
        <div className={styles.grid2}>
          <label>
            Spouse&apos;s Surname{" "}
            <input
              type="text"
              name="spouseSurname"
              value={form.spouseSurname ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Spouse&apos;s First Name{" "}
            <input
              type="text"
              name="spouseFirstname"
              value={form.spouseFirstname ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Spouse&apos;s Middle Name{" "}
            <input
              type="text"
              name="spouseMiddlename"
              value={form.spouseMiddlename ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Spouse&apos;s Occupation{" "}
            <input
              type="text"
              name="spouseOccupation"
              value={form.spouseOccupation ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Employer/Business Name{" "}
            <input
              type="text"
              name="spouseEmployer"
              value={form.spouseEmployer ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Business Address{" "}
            <input
              type="text"
              name="spouseBusinessAddress"
              value={form.spouseBusinessAddress ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Telephone No.{" "}
            <input
              type="text"
              name="spouseTelNo"
              value={form.spouseTelNo ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
        </div>

        <h3>Children</h3>
        {children.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              placeholder="Name of Child"
              name="childName"
              value={row.childFullname}
              onChange={(e) => {
                const newChildren = [...children];
                newChildren[i].childFullname = e.target.value;
                setChildren(newChildren);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="Date of Birth"
              title="Date of Birth (mm/dd/yyyy)"
              name="childDob"
              value={row.dob}
              onChange={(e) => {
                const newChildren = [...children];
                newChildren[i].dob = e.target.value;
                setChildren(newChildren);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemoveChild(i)}
              disabled={isDisabled}
            >
              Remove
            </button> 
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleAdd(setChildren, { childrenId: 0, personalDataId: 0, childFullname: "", dob: "" })}
          disabled={isDisabled}
        >
          Add Child
        </button>

        <h3>Parents</h3>
        <div className={styles.grid2}>
          <label>
            Father&apos;s Surname{" "}
            <input
              type="text"
              name="fatherSurname"
              value={form.fatherSurname ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Father&apos;s First Name{" "}
            <input
              type="text"
              name="fatherFirstname"
              value={form.fatherFirstname ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Father&apos;s Middle Name{" "}
            <input
              type="text"
              name="fatherMiddlename"
              value={form.fatherMiddlename ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Mother&apos;s Maiden Name (Surname){" "}
            <input
              type="text"
              name="motherSurname"
              value={form.motherSurname ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Mother&apos;s First Name{" "}
            <input
              type="text"
              name="motherFirstname"
              value={form.motherFirstname ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Mother&apos;s Middle Name{" "}
            <input
              type="text"
              name="motherMiddlename"
              value={form.motherMiddlename ?? ""}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
        </div>
      </section>

      {/* IV. EDUCATIONAL BACKGROUND */}
      <section>
        <h2>IV. Educational Background</h2>
        {education.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              placeholder="Level (Elem/HS/College/etc.)"
              name="level"
              value={row.level}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].level = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Name of School"
              name="school"
              value={row.school}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].school = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Basic Education/Degree/Course"
              name="course"
              value={row.course}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].course = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="From"
              title="From Date Educational Background (mm/dd/yyyy)"
              name="from"
              value={row.from}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].from = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="To"
              title="To Date Educational Background (mm/dd/yyyy)"
              name="to"
              value={row.to}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].to = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Highest Level/Units Earned"
              name="units"
              value={row.units}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].units = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Year Graduated"
              name="yearGraduated"
              value={row.yearGraduated}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].yearGraduated = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Scholarship/Honors"
              name="honors"
              value={row.honors}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].honors = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemove(setEducation, i)}
              disabled={isDisabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            handleAdd(setEducation, {
              level: "",
              school: "",
              course: "",
              from: "",
              to: "",
              units: "",
              yearGraduated: "",
              honors: "",
            })
          }
          disabled={isDisabled}
        >
          Add Education
        </button>
      </section>

      {/* V. CIVIL SERVICE ELIGIBILITY */}
      <section>
        <h2>V. Civil Service Eligibility</h2>
        {eligibilities.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              placeholder="Career Service"
              name="careerService"
              value={row.careerService}
              onChange={(e) => {
                const newEligibilities = [...eligibilities];
                newEligibilities[i].careerService = e.target.value;
                setEligibilities(newEligibilities);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Rating"
              name="rating"
              value={row.rating}
              onChange={(e) => {
                const newEligibilities = [...eligibilities];
                newEligibilities[i].rating = e.target.value;
                setEligibilities(newEligibilities);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="Date of Exam"
              title="Date of Exam (mm/dd/yyyy)"
              name="examDate"
              value={row.examDate}
              onChange={(e) => {
                const newEligibilities = [...eligibilities];
                newEligibilities[i].examDate = e.target.value;
                setEligibilities(newEligibilities);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Place of Exam"
              name="examPlace"
              value={row.examPlace}
              onChange={(e) => {
                const newEligibilities = [...eligibilities];
                newEligibilities[i].examPlace = e.target.value;
                setEligibilities(newEligibilities);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="License Number"
              name="licenseNumber"
              value={row.licenseNumber}
              onChange={(e) => {
                const newEligibilities = [...eligibilities];
                newEligibilities[i].licenseNumber = e.target.value;
                setEligibilities(newEligibilities);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Date of Validity"
              name="validity"
              value={row.validity}
              onChange={(e) => {
                const newEligibilities = [...eligibilities];
                newEligibilities[i].validity = e.target.value;
                setEligibilities(newEligibilities);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemove(setEligibilities, i)}
              disabled={isDisabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            handleAdd(setEligibilities, {
              careerService: "",
              rating: "",
              examDate: "",
              examPlace: "",
              licenseNumber: "",
              validity: "",
            })
          }
          disabled={isDisabled}
        >
          Add Eligibility
        </button>
      </section>

      {/* VI. WORK EXPERIENCE */}
      <section>
        <h2>VI. Work Experience</h2>
        {workExperience.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              type="date"
              placeholder="From"
              title="From Date Work Experience (mm/dd/yyyy)"
              name="from"
              value={row.from}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].from = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="To"
              title="To Date Work Experience (mm/dd/yyyy)"
              name="to"
              value={row.to}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].to = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Position Title"
              name="position"
              value={row.position}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].position = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Department/Agency"
              name="department"
              value={row.department}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].department = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Monthly Salary"
              name="salary"
              value={row.salary}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].salary = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Pay Grade"
              name="payGrade"
              value={row.payGrade}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].payGrade = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Status"
              name="status"
              value={row.status}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].status = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Gov’t Service (Y/N)"
              name="govService"
              value={row.govService}
              onChange={(e) => {
                const newWork = [...workExperience];
                newWork[i].govService = e.target.value;
                setWorkExperience(newWork);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemove(setWorkExperience, i)}
              disabled={isDisabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            handleAdd(setWorkExperience, {
              from: "",
              to: "",
              position: "",
              department: "",
              salary: "",
              payGrade: "",
              status: "",
              govService: "",
            })
          }
          disabled={isDisabled}
        >
          Add Work
        </button>
      </section>

      {/* VII. VOLUNTARY WORK */}
      <section>
        <h2>VII. Voluntary Work</h2>
        {voluntaryWork.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              placeholder="Organization Name & Address"
              name="orgName"
              value={row.orgName}
              onChange={(e) => {
                const newVol = [...voluntaryWork];
                newVol[i].orgName = e.target.value;
                setVoluntaryWork(newVol);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="From"
              title="From Date Voluntary Experience (mm/dd/yyyy)"
              name="from"
              value={row.from}
              onChange={(e) => {
                const newVol = [...voluntaryWork];
                newVol[i].from = e.target.value;
                setVoluntaryWork(newVol);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="To"
              title="To Date Voluntary Experience (mm/dd/yyyy)"
              name="to"
              value={row.to}
              onChange={(e) => {
                const newVol = [...voluntaryWork];
                newVol[i].to = e.target.value;
                setVoluntaryWork(newVol);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Hours"
              name="hours"
              value={row.hours}
              onChange={(e) => {
                const newVol = [...voluntaryWork];
                newVol[i].hours = e.target.value;
                setVoluntaryWork(newVol);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Position/Nature of Work"
              name="position"
              value={row.position}
              onChange={(e) => {
                const newVol = [...voluntaryWork];
                newVol[i].position = e.target.value;
                setVoluntaryWork(newVol);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemove(setVoluntaryWork, i)}
              disabled={isDisabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            handleAdd(setVoluntaryWork, {
              orgName: "",
              from: "",
              to: "",
              hours: "",
              position: "",
            })
          }
          disabled={isDisabled}
        >
          Add Voluntary Work
        </button>
      </section>

      {/* VIII. LEARNING & DEVELOPMENT */}
      <section>
        <h2>VIII. Learning & Development</h2>
        {trainings.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              placeholder="Title of Program"
              name="title"
              value={row.title}
              onChange={(e) => {
                const newTrain = [...trainings];
                newTrain[i].title = e.target.value;
                setTrainings(newTrain);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="From"
              title="From Date Learning & Development (mm/dd/yyyy)"
              name="from"
              value={row.from}
              onChange={(e) => {
                const newTrain = [...trainings];
                newTrain[i].from = e.target.value;
                setTrainings(newTrain);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="To"
              title="To Date Learning & Development (mm/dd/yyyy)"
              name="to"
              value={row.to}
              onChange={(e) => {
                const newTrain = [...trainings];
                newTrain[i].to = e.target.value;
                setTrainings(newTrain);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Hours"
              name="hours"
              value={row.hours}
              onChange={(e) => {
                const newTrain = [...trainings];
                newTrain[i].hours = e.target.value;
                setTrainings(newTrain);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Type"
              name="type"
              value={row.type}
              onChange={(e) => {
                const newTrain = [...trainings];
                newTrain[i].type = e.target.value;
                setTrainings(newTrain);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Conducted By"
              name="conductedBy"
              value={row.conductedBy}
              onChange={(e) => {
                const newTrain = [...trainings];
                newTrain[i].conductedBy = e.target.value;
                setTrainings(newTrain);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemove(setTrainings, i)}
              disabled={isDisabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            handleAdd(setTrainings, {
              title: "",
              from: "",
              to: "",
              hours: "",
              type: "",
              conductedBy: "",
            })
          }
          disabled={isDisabled}
        >
          Add Training
        </button>
      </section>

      {/* IX. OTHER INFORMATION */}
      <section>
        <h2>IX. Other Information</h2>

        <h3>Special Skills and Hobbies</h3>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="Skill or Hobby"
            name="skillOrHobby"
            value={form.skillOrHobby ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        <h3>Non-Academic Distinctions / Recognition</h3>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="Distinction / Recognition"
            name="distinction"
            value={form.distinction ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        <h3>Membership in Association/Organization</h3>
        <div className={styles.row}>
          <input
            type="text"
            placeholder="Association / Organization"
            name="association"
            value={form.association ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>
      </section>

      {/* X. ADDITIONAL INFORMATION (34–40) */}
      <section>
        <h2>X. Additional Information</h2>

        {/* 34 */}
        <div className={styles.questionBlock}>
          <p>
            34. Are you related by consanguinity or affinity to the appointing
            or recommending authority, or to the chief of bureau or office, or
            to the person who has immediate supervision over you?
          </p>
          <p>a. within the third degree?</p>
          <label>
            <input
              type="radio"
              name="q34a"
              value="yes"
              checked={form.q34a === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q34a"
              value="no"
              checked={form.q34a === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q34aDetails"
            value={form.q34aDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />

          <p>
            b. within the fourth degree (for Local Government Unit – Career
            Employee)?
          </p>
          <label>
            <input
              type="radio"
              name="q34b"
              value="yes"
              checked={form.q34b === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q34b"
              value="no"
              checked={form.q34b === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q34bDetails"
            value={form.q34bDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        {/* 35 */}
        <div className={styles.questionBlock}>
          <p>
            35a. Have you ever been found guilty of any administrative offense?
          </p>
          <label>
            <input
              type="radio"
              name="q35a"
              value="yes"
              checked={form.q35a === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q35a"
              value="no"
              checked={form.q35a === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q35aDetails"
            value={form.q35aDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />

          <p>35b. Have you ever been criminally charged before any court?</p>
          <label>
            <input
              type="radio"
              name="q35b"
              value="yes"
              checked={form.q35b === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q35b"
              value="no"
              checked={form.q35b === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q35bDetails"
            value={form.q35bDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
          <div className={styles.row}>
            <label>
              Date Filed:{" "}
              <input
                type="date"
                title="Date Filed (mm/dd/yyyy)"
                name="q35bDateFiled"
                value={form.q35bDateFiled ?? ""}
                onChange={handleChange}
                disabled={isDisabled}
              />
            </label>
            <label>
              Status of Case/s:{" "}
              <input
                type="text"
                name="q35bStatus"
                value={form.q35bStatus ?? ""}
                onChange={handleChange}
                disabled={isDisabled}
              />
            </label>
          </div>
        </div>

        {/* 36 */}
        <div className={styles.questionBlock}>
          <p>
            36. Have you ever been convicted of any crime or violation of any
            law, ordinance, or regulation by any court or tribunal?
          </p>
          <label>
            <input
              type="radio"
              name="q36"
              value="yes"
              checked={form.q36 === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q36"
              value="no"
              checked={form.q36 === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q36Details"
            value={form.q36Details ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        {/* 37 */}
        <div className={styles.questionBlock}>
          <p>
            37a. Have you ever been separated from service in any of the
            following modes: resignation, retirement, dropped from the rolls,
            dismissal, termination, end of term, finished contract or phased out
            (abolition) in the public or private sector?
          </p>
          <label>
            <input
              type="radio"
              name="q37a"
              value="yes"
              checked={form.q37a === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q37a"
              value="no"
              checked={form.q37a === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q37aDetails"
            value={form.q37aDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />

          <p>
            37b. Have you ever been a candidate in a national or local election
            held within the last year (except Barangay election)?
          </p>
          <label>
            <input
              type="radio"
              name="q37b"
              value="yes"
              checked={form.q37b === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q37b"
              value="no"
              checked={form.q37b === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q37bDetails"
            value={form.q37bDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />

          <p>
            37c. Have you resigned from the government service during the three
            (3)-month period before the last election to promote/actively
            campaign for a national or local candidate?
          </p>
          <label>
            <input
              type="radio"
              name="q37c"
              value="yes"
              checked={form.q37c === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q37c"
              value="no"
              checked={form.q37c === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q37cDetails"
            value={form.q37cDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        {/* 38 */}
        <div className={styles.questionBlock}>
          <p>
            38. Have you acquired the status of an immigrant or permanent
            resident of another country?
          </p>
          <label>
            <input
              type="radio"
              name="q38"
              value="yes"
              checked={form.q38 === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q38"
              value="no"
              checked={form.q38 === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q38Details"
            value={form.q38Details ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>

        {/* 39 */}
        <div className={styles.questionBlock}>
          <p>
            39. Pursuant to (a) Indigenous People Act (RA 8371); (b) Magna Carta
            for Disabled Persons (RA 7277); and (c) Solo Parents Welfare Act of
            2000 (RA 8972), please answer the following items:
          </p>

          <p>a. Are you a member of any indigenous group?</p>
          <label>
            <input
              type="radio"
              name="q39a"
              value="yes"
              checked={form.q39a === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q39a"
              value="no"
              checked={form.q39a === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q39aDetails"
            value={form.q39aDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />

          <p>b. Are you a person with disability?</p>
          <label>
            <input
              type="radio"
              name="q39b"
              value="yes"
              checked={form.q39b === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q39b"
              value="no"
              checked={form.q39b === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q39bDetails"
            value={form.q39bDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />

          <p>c. Are you a solo parent?</p>
          <label>
            <input
              type="radio"
              name="q39c"
              value="yes"
              checked={form.q39c === "yes"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="q39c"
              value="no"
              checked={form.q39c === "no"}
              onChange={handleChange}
              disabled={isDisabled}
            />{" "}
            No
          </label>
          <input
            type="text"
            placeholder="If YES, give details"
            name="q39cDetails"
            value={form.q39cDetails ?? ""}
            onChange={handleChange}
            disabled={isDisabled}
          />
        </div>
      </section>

      {/* XI. REFERENCES */}
      <section>
        <h2>XI. References</h2>
        {references.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              placeholder="Name"
              name="refName"
              value={row.name}
              onChange={(e) => {
                const newReferences = [...references];
                newReferences[i].name = e.target.value;
                setReferences(newReferences);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Address"
              name="refAddress"
              value={row.address}
              onChange={(e) => {
                const newReferences = [...references];
                newReferences[i].address = e.target.value;
                setReferences(newReferences);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Tel No."
              name="refTel"
              value={row.tel}
              onChange={(e) => {
                const newReferences = [...references];
                newReferences[i].tel = e.target.value;
                setReferences(newReferences);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemove(setReferences, i)}
              disabled={isDisabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            handleAdd(setReferences, { name: "", address: "", tel: "" })
          }
          disabled={isDisabled}
        >
          Add Reference
        </button>
      </section>

      {/* XII. ISSUANCE INFORMATION */}
      <section>
        <h2>XII. Issuance Information</h2>
        <div className={styles.grid2}>
          <label>
            ID/License/Passport No.
            <input
              type="text"
              name="govIdNumber"
              value={form.govIdNumber}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Government Issued ID
            <input
              type="text"
              name="govIdType"
              value={form.govIdType}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
        </div>
        <div className={styles.grid2}>
          <label>
            Date of Issuance
            <input
              type="date"
              name="govIdDate"
              title="Date of Issuance (mm/dd/yyyy)"
              value={form.govIdDate}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
          <label>
            Place of Issuance
            <input
              type="text"
              name="govIdPlace"
              value={form.govIdPlace}
              onChange={handleChange}
              disabled={isDisabled}
            />
          </label>
        </div>
      </section>

      {/* XIII. DECLARATION AND GOVERNMENT ID (42) */}
      <section>
        <h2>XIII. Declaration</h2>
        <div className={styles.questionBlock}>
          <label>
            <input
              type="checkbox"
              name="q42"
              checked={!!form.q42}
              onChange={handleChange}
              disabled={isDisabled}
            />
            42. I declare under oath that I have personally accomplished this
            Personal Data Sheet which is a true, correct and complete statement
            pursuant to the provisions of pertinent laws, rules and regulations
            of the Republic of the Philippines. I authorize the agency
            head/authorized representative to verify the contents stated herein.
            I agree that any misrepresentation made in this document and its
            attachments shall cause the filing of administrative/criminal case/s
            against me.
          </label>
        </div>
      </section>

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
            {selectedEmployee && selectedEmployee.isSearched === true
              ? "Edit"
              : "New"}
          </button>
        )}
      </div>
    </form>
  );
}