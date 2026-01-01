"use client";

import React, { useState, useEffect, useCallback } from "react";
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

// Default educational rows shown when the page loads
const DEFAULT_EDUCATION = [
  { educationalBackgroundId: 0, personalDataId: 0, levelOfEducation: "Elementary", nameOfSchool: "", degreeCourse: "", scoreGrade: "", yearGraduated: "", fromDate: "", toDate: "", honorsReceived: "" },
  { educationalBackgroundId: 0, personalDataId: 0, levelOfEducation: "Secondary", nameOfSchool: "", degreeCourse: "", scoreGrade: "", yearGraduated: "", fromDate: "", toDate: "", honorsReceived: "" },
  { educationalBackgroundId: 0, personalDataId: 0, levelOfEducation: "Vocational/Trade Courses", nameOfSchool: "", degreeCourse: "", scoreGrade: "", yearGraduated: "", fromDate: "", toDate: "", honorsReceived: "" },
  { educationalBackgroundId: 0, personalDataId: 0, levelOfEducation: "College", nameOfSchool: "", degreeCourse: "", scoreGrade: "", yearGraduated: "", fromDate: "", toDate: "", honorsReceived: "" },
  { educationalBackgroundId: 0, personalDataId: 0, levelOfEducation: "Graduate Studies", nameOfSchool: "", degreeCourse: "", scoreGrade: "", yearGraduated: "", fromDate: "", toDate: "", honorsReceived: "" }
];

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
  
  const resetAllPersonalDataFields = useCallback(() => {
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

    setEducation(DEFAULT_EDUCATION);

    setCivilServices([
      {
        civilServiceEligibilityId: 0,
        personalDataId: 0,
        careerServiceName: "",
        civilServiceRating: "",
        dateOfExamination: "",
        placeOfExamination: "",
        licenseNumber: "",
        licenseValidityDate: "",
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
  }, []);

  useEffect(() => {
    if (personalData === null || selectedEmployee === null) {
      resetAllPersonalDataFields();
    }
  }, [personalData, selectedEmployee, resetAllPersonalDataFields]);

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
      setEducation(DEFAULT_EDUCATION);
      setCivilServices([
        {
          civilServiceEligibilityId: 0,
          personalDataId: 0,
          careerServiceName: "",
          civilServiceRating: "",
          dateOfExamination: "",
          placeOfExamination: "",
          licenseNumber: "",
          licenseValidityDate: "",
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
    const maybe = (pd as unknown as Record<string, unknown>)['personalDataId'] ?? (pd as unknown as Record<string, unknown>)['id'] ?? (pd as unknown as Record<string, unknown>)['personalData_id'] ?? pd.personalDataId ?? null;
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

  type RawChild = {
    childrenId?: number | string;
    children_id?: number | string;
    childId?: number | string;
    childFullname?: string;
    childFullName?: string;
    name?: string;
    dob?: string;
    childDob?: string;
    children?: RawChild[];
  };

  // Fetch children from backend with flexible parsing — returns parsed items
  const fetchChildren = useCallback(async (personalDataId: number): Promise<ChildItem[]> => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/fetch/children/by/${personalDataId}`);
      if (!res.ok) {
        const fallback = [{ childrenId: 0, personalDataId, childFullname: "", dob: "" }];
        setChildren(fallback);
        return fallback;
      }

      const data: unknown = await res.json();

      // flexible handling: backend may return { children: [...] } or an array, or a single dto
      let items: unknown[] = [];
      if (Array.isArray(data)) {
        items = data as unknown[];
      } else {
        const maybeObj = data as RawChild | undefined;
        if (maybeObj && Array.isArray(maybeObj.children)) {
          items = maybeObj.children as unknown[];
        } else if (maybeObj && (typeof maybeObj.childFullname === "string" || typeof maybeObj.dob === "string")) {
          items = [maybeObj];
        }
      }

      if (items.length === 0) {
        const fallback = [{ childrenId: 0, personalDataId, childFullname: "", dob: "" }];
        setChildren(fallback);
        return fallback;
      }

      const mapped: ChildItem[] = items.map((c: unknown) => {
        const obj = c as RawChild;
        return {
          childrenId: Number(obj.childrenId ?? obj.children_id ?? obj.childId ?? 0),
          personalDataId: personalDataId,
          childFullname: String(obj.childFullname ?? obj.childFullName ?? obj.name ?? ""),
          dob: toDateInputValue(String(obj.dob ?? obj.childDob ?? "")),
        };
      });

      setChildren(mapped);
      return mapped;
    } catch (err) {
      console.log("Failed to fetch children", err);
      const fallback = [{ childrenId: 0, personalDataId, childFullname: "", dob: "" }];
      setChildren(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    const id = extractPersonalDataId(personalData);
    if (id) {
      fetchChildren(id);
    }
  }, [personalData, fetchChildren]);

  const [isDisabled, setIsDisabled] = useState(true);

  // Dynamic rows for repeating sections
  // Civil Service Eligibility rows (mapped to backend entity)
  const [civilServices, setCivilServices] = useState([
    {
      civilServiceEligibilityId: 0,
      personalDataId: 0,
      careerServiceName: "",
      civilServiceRating: "",
      dateOfExamination: "",
      placeOfExamination: "",
      licenseNumber: "",
      licenseValidityDate: "",
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
  const [education, setEducation] = useState(DEFAULT_EDUCATION);
  const [children, setChildren] = useState<ChildItem[]>([{ childrenId: 0, personalDataId: 0, childFullname: "", dob: "" }]);
  // Holds IDs of children removed in the UI that need to be deleted on the server when saving
  const [deletedChildrenIds, setDeletedChildrenIds] = useState<number[]>([]);



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
              console.log("Failed to delete child id", id, await delRes.text());
            }
          } catch (err) {
            console.log("Error deleting child id", id, err);
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
        console.log("Updating child payload:", payload, "id:", c.childrenId);

        const updateRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/children/update/${c.childrenId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });

        if (updateRes.ok) {
          try {
            const json = await updateRes.json();
            if (json) anyUpdated = true;
          } catch {
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
            console.log("Children create response:", createRes.status, txt);
          } else {
            console.log("Failed to create child", await createRes.text());
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
      console.log("Failed to upsert children", err);
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

  // Types for educational background parsing
  type RawEducation = {
    educationalBackgroundId?: number | string;
    educational_background_id?: number | string;
    id?: number | string;
    // possible server shapes (old keys and entity keys)
    level?: string;
    levelOfEducation?: string;
    school?: string;
    nameOfSchool?: string;
    course?: string;
    degreeCourse?: string;
    units?: string;
    scoreGrade?: string | number;
    yearGraduated?: string | number;
    from?: string;
    fromDate?: string;
    to?: string;
    toDate?: string;
    honors?: string;
    honorsReceived?: string;
    educationalBackgrounds?: RawEducation[];
  };

  // Holds IDs of education rows removed in the UI that need to be deleted on the server when saving
  const [deletedEducationIds, setDeletedEducationIds] = useState<number[]>([]);

  // Fetch educational background rows for a personalDataId
  const fetchEducation = useCallback(async (personalDataId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/fetch/educationalBackground/by/${personalDataId}`);
      if (!res.ok) {
        setEducation(DEFAULT_EDUCATION);
        return DEFAULT_EDUCATION;
      }

      const data: unknown = await res.json();

      // normalize shapes: array or single object or wrapper
      let items: unknown[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else {
        const maybe = data as RawEducation | undefined;
        // Prefer typed checks over `any` for ESLint compliance
        if (maybe && Array.isArray(maybe.educationalBackgrounds)) {
          items = maybe.educationalBackgrounds as unknown[];
        } else if (
          maybe && (
            typeof maybe.level === "string" ||
            typeof maybe.levelOfEducation === "string" ||
            typeof maybe.school === "string" ||
            typeof maybe.nameOfSchool === "string"
          )
        ) {
          items = [maybe];
        }
      }

      if (items.length === 0) {
        setEducation(DEFAULT_EDUCATION);
        return DEFAULT_EDUCATION;
      }

      const mapped = items.map((x: unknown) => {
        const obj = x as RawEducation;
        return {
          educationalBackgroundId: Number(obj.educationalBackgroundId ?? obj.educational_background_id ?? obj.id ?? 0),
          personalDataId,
          levelOfEducation: String(obj.levelOfEducation ?? obj.level ?? ""),
          nameOfSchool: String(obj.nameOfSchool ?? obj.school ?? ""),
          degreeCourse: String(obj.degreeCourse ?? obj.course ?? ""),
          scoreGrade: String(obj.scoreGrade ?? obj.units ?? ""),
          yearGraduated: String(obj.yearGraduated ?? ""),
          fromDate: toDateInputValue(String(obj.fromDate ?? obj.from ?? "")),
          toDate: toDateInputValue(String(obj.toDate ?? obj.to ?? "")),
          honorsReceived: String(obj.honorsReceived ?? obj.honors ?? ""),
        };
      });

      setEducation(mapped);
      return mapped;
    } catch (err) {
      console.log("Failed to fetch education", err);
      setEducation(DEFAULT_EDUCATION);
      return DEFAULT_EDUCATION;
    }
  }, []);

  // When personalData changes, fetch education rows as well
  useEffect(() => {
    const id = extractPersonalDataId(personalData);
    if (id) {
      fetchEducation(id);
    } else {
      setEducation(DEFAULT_EDUCATION);
    }
  }, [personalData, fetchEducation]);

  // Remove education row and queue its id for deletion on save
  // const handleRemoveEducation = (index: number) => {
  //   setEducation((prev) => {
  //     const removed = prev[index] as any;
  //     if (removed && (removed.educationalBackgroundId ?? 0) > 0) {
  //       setDeletedEducationIds((prevIds) => [...prevIds, Number(removed.educationalBackgroundId)]);
  //     }
  //     return prev.filter((_, i) => i !== index);
  //   });
  // };

  // Create or update educational background rows for a given personalDataId
  const upsertEducation = async (personalDataId: number) => {
    try {
      // remove empty rows
      const filtered = education
        .map((e) => ({ ...e }))
        .filter((e) => (e.levelOfEducation && e.levelOfEducation.trim()) || (e.nameOfSchool && e.nameOfSchool.trim()) || (e.degreeCourse && e.degreeCourse.trim()));

      let anyDeleted = false;
      if (deletedEducationIds.length > 0) {
        for (const id of deletedEducationIds) {
          try {
            const delRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/educationalBackground/delete/${id}`, { method: "DELETE" });
            if (delRes.ok) {
              anyDeleted = true;
            } else {
              console.log("Failed to delete education id", id, await delRes.text());
            }
          } catch (err) {
            console.log("Error deleting education id", id, err);
          }
        }
        setDeletedEducationIds([]);
      }

      const toUpdate = filtered.filter((e) => e.educationalBackgroundId && Number(e.educationalBackgroundId) > 0);
      const toCreate = filtered.filter((e) => !e.educationalBackgroundId || Number(e.educationalBackgroundId) === 0);

      let anyUpdated = false;
      let anyCreated = false;

      // Attempt updates
      for (const e of toUpdate) {
        const payload = {
          personalDataId,
          levelOfEducation: e.levelOfEducation,
          nameOfSchool: e.nameOfSchool,
          degreeCourse: e.degreeCourse,
          scoreGrade: e.scoreGrade ? Number(e.scoreGrade) : null,
          yearGraduated: e.yearGraduated ? Number(e.yearGraduated) : null,
          fromDate: e.fromDate ? toCustomFormat(e.fromDate, false) : null,
          toDate: e.toDate ? toCustomFormat(e.toDate, false) : null,
          honorsReceived: e.honorsReceived,
        };

        const updateRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/educationalBackground/update/${e.educationalBackgroundId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });

        if (updateRes.ok) {
          try {
            const json = await updateRes.json();
            if (json) anyUpdated = true;
          } catch {
            // treat empty body as success
            anyUpdated = true;
          }
        } else {
          // fallback to create
          toCreate.push(e);
        }
      }

      // Creates
      if (toCreate.length > 0) {
        for (const e of toCreate) {
          const payload = {
            personalDataId,
            levelOfEducation: e.levelOfEducation,
            nameOfSchool: e.nameOfSchool,
            degreeCourse: e.degreeCourse,
            scoreGrade: e.scoreGrade ? Number(e.scoreGrade) : null,
            yearGraduated: e.yearGraduated ? Number(e.yearGraduated) : null,
            fromDate: e.fromDate ? toCustomFormat(e.fromDate, false) : null,
            toDate: e.toDate ? toCustomFormat(e.toDate, false) : null,
            honorsReceived: e.honorsReceived,
          };

          const createRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/create/educationalBackground`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          });

          if (createRes.ok) {
            anyCreated = true;
          } else {
            console.log("Failed to create education", await createRes.text());
          }
        }
      }

      if (anyDeleted || anyUpdated || anyCreated) {
        await fetchEducation(personalDataId);
        if (anyUpdated && !anyCreated && !anyDeleted) return "isUpdated";
        return true;
      }

      return false;
    } catch (err) {
      console.log("Failed to upsert education", err);
      return false;
    }
  };

  // --- Civil Service Eligibility integration ---
  type RawCivilService = {
    civilServiceEligibilityId?: number | string;
    id?: number | string;
    civil_service_eligibility_id?: number | string;
    careerServiceName?: string;
    civilServiceRating?: number | string;
    dateOfExamination?: string;
    placeOfExamination?: string;
    licenseNumber?: string;
    licenseValidityDate?: string;
    civilServiceEligibilities?: RawCivilService[];
  };

  const [deletedCivilServiceIds, setDeletedCivilServiceIds] = useState<number[]>([]);

  const fetchCivilService = useCallback(async (personalDataId: number) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL_HRM}/api/fetch/civilServiceEligibility/by/${personalDataId}`);
      if (!res.ok) {
        const fallback = [
          { civilServiceEligibilityId: 0, personalDataId, careerServiceName: "", civilServiceRating: "", dateOfExamination: "", placeOfExamination: "", licenseNumber: "", licenseValidityDate: "" },
        ];
        setCivilServices(fallback);
        return fallback;
      }

      const data: unknown = await res.json();
      let items: unknown[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else {
        const maybe = data as RawCivilService | undefined;
        if (maybe && Array.isArray(maybe.civilServiceEligibilities)) {
          items = maybe.civilServiceEligibilities as unknown[];
        } else if (maybe && (typeof maybe.careerServiceName === "string" || typeof maybe.placeOfExamination === "string")) {
          items = [maybe];
        }
      }

      if (items.length === 0) {
        const fallback = [
          { civilServiceEligibilityId: 0, personalDataId, careerServiceName: "", civilServiceRating: "", dateOfExamination: "", placeOfExamination: "", licenseNumber: "", licenseValidityDate: "" },
        ];
        setCivilServices(fallback);
        return fallback;
      }

      const mapped = items.map((x: unknown) => {
        const obj = x as RawCivilService;
        return {
          civilServiceEligibilityId: Number(obj.civilServiceEligibilityId ?? obj.id ?? obj.civil_service_eligibility_id ?? 0),
          personalDataId,
          careerServiceName: String(obj.careerServiceName ?? ""),
          civilServiceRating: String(obj.civilServiceRating ?? ""),
          dateOfExamination: toDateInputValue(String(obj.dateOfExamination ?? "")),
          placeOfExamination: String(obj.placeOfExamination ?? ""),
          licenseNumber: String(obj.licenseNumber ?? ""),
          licenseValidityDate: toDateInputValue(String(obj.licenseValidityDate ?? "")),
        };
      });

      setCivilServices(mapped);
      return mapped;
    } catch (err) {
      console.log("Failed to fetch civil service", err);
      const fallback = [
        { civilServiceEligibilityId: 0, personalDataId, careerServiceName: "", civilServiceRating: "", dateOfExamination: "", placeOfExamination: "", licenseNumber: "", licenseValidityDate: "" },
      ];
      setCivilServices(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    const id = extractPersonalDataId(personalData);
    if (id) {
      fetchCivilService(id);
    }
  }, [personalData, fetchCivilService]);

  const handleRemoveCivilService = (index: number) => {
    setCivilServices((prev) => {
      const removed = prev[index] as any;
      if (removed && (removed.civilServiceEligibilityId ?? 0) > 0) {
        setDeletedCivilServiceIds((prevIds) => [...prevIds, Number(removed.civilServiceEligibilityId)]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const upsertCivilService = async (personalDataId: number) => {
    try {
      const filtered = civilServices
        .map((c) => ({ ...c }))
        .filter((c) => (c.careerServiceName && c.careerServiceName.trim()) || (c.placeOfExamination && c.placeOfExamination.trim()));

      let anyDeleted = false;
      if (deletedCivilServiceIds.length > 0) {
        for (const id of deletedCivilServiceIds) {
          try {
            const delRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/civilServiceEligibility/delete/${id}`, { method: "DELETE" });
            if (delRes.ok) {
              anyDeleted = true;
            } else {
              console.log("Failed to delete civil service id", id, await delRes.text());
            }
          } catch (err) {
            console.log("Error deleting civil service id", id, err);
          }
        }
        setDeletedCivilServiceIds([]);
      }

      const toUpdate = filtered.filter((c) => c.civilServiceEligibilityId && Number(c.civilServiceEligibilityId) > 0);
      const toCreate = filtered.filter((c) => !c.civilServiceEligibilityId || Number(c.civilServiceEligibilityId) === 0);

      let anyUpdated = false;
      let anyCreated = false;

      for (const c of toUpdate) {
        const payload = {
          personalDataId,
          careerServiceName: c.careerServiceName,
          civilServiceRating: c.civilServiceRating ? Number(c.civilServiceRating) : null,
          dateOfExamination: c.dateOfExamination ? toCustomFormat(c.dateOfExamination, false) : null,
          placeOfExamination: c.placeOfExamination,
          licenseNumber: c.licenseNumber,
          licenseValidityDate: c.licenseValidityDate ? toCustomFormat(c.licenseValidityDate, false) : null,
        };

        const updateRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/civilServiceEligibility/update/${c.civilServiceEligibilityId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });

        if (updateRes.ok) {
          try {
            const json = await updateRes.json();
            if (json) anyUpdated = true;
          } catch {
            anyUpdated = true;
          }
        } else {
          toCreate.push(c);
        }
      }

      if (toCreate.length > 0) {
        for (const c of toCreate) {
          const payload = {
            personalDataId,
            careerServiceName: c.careerServiceName,
            civilServiceRating: c.civilServiceRating ? Number(c.civilServiceRating) : null,
            dateOfExamination: c.dateOfExamination ? toCustomFormat(c.dateOfExamination, false) : null,
            placeOfExamination: c.placeOfExamination,
            licenseNumber: c.licenseNumber,
            licenseValidityDate: c.licenseValidityDate ? toCustomFormat(c.licenseValidityDate, false) : null,
          };

          const createRes = await fetchWithAuth(`${API_BASE_URL_HRM}/api/create/civilServiceEligibility`, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
          });

          if (createRes.ok) {
            anyCreated = true;
          } else {
            console.log("Failed to create civil service", await createRes.text());
          }
        }
      }

      if (anyDeleted || anyUpdated || anyCreated) {
        await fetchCivilService(personalDataId);
        if (anyUpdated && !anyCreated && !anyDeleted) return "isUpdated";
        return true;
      }

      return false;
    } catch (err) {
      console.log("Failed to upsert civil service", err);
      return false;
    }
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

      // Additionally sync children and educational background after personal data is saved
      try {
        const personalDataId = Number(form.personalDataId);
        if (form.personalDataId) {
          // Children
          const upserted = await upsertChildren(personalDataId);
          let titleUpdate = "Children saved";
          if (upserted === "isUpdated") {
            titleUpdate = "Children updated";
          }
          if (upserted) {
            console.log(titleUpdate + " successfully.");
            // Swal.fire({ toast: true, position: 'bottom-end', icon: 'success', title: titleUpdate, showConfirmButton: false, timer: 2000 });
          } else {
            // Swal.fire({ toast: true, position: 'bottom-end', icon: 'error', title: 'Failed to save children', showConfirmButton: false, timer: 2000 });
            console.log('Failed to save children');
          }

          // Educational Background
          try {
            const eduResult = await upsertEducation(personalDataId);
            let eduTitle = 'Educational Background saved';
            if (eduResult === 'isUpdated') {
              eduTitle = 'Educational Background updated';
            }
            if (eduResult) {
              console.log(eduTitle + " successfully.");
              // Swal.fire({ toast: true, position: 'bottom-end', icon: 'success', title: eduTitle, showConfirmButton: false, timer: 2000 });
            } else {
              // Swal.fire({ toast: true, position: 'bottom-end', icon: 'error', title: 'Failed to save educational background', showConfirmButton: false, timer: 2000 });
              console.log('Failed to save educational background');
            }
          } catch (err) {
            console.log('Error syncing education:', err);
          }

          // Civil Service
          try {
            const civilResult = await upsertCivilService(personalDataId);
            let civilTitle = 'Civil Service Eligibility saved';
            if (civilResult === 'isUpdated') {
              civilTitle = 'Civil Service Eligibility updated';
            }
            if (civilResult) {
              console.log(civilTitle + " successfully.");
            } else {
              // Swal.fire({ toast: true, position: 'bottom-end', icon: 'error', title: 'Failed to save civil service eligibility', showConfirmButton: false, timer: 2000 });
              console.log('Failed to save civil service eligibility');
            }
          } catch (err) {
            console.log('Error syncing civil service:', err);
          }
        }
      } catch (err) {
        console.log('Error syncing children or education:', err);
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
              name="levelOfEducation"
              value={row.levelOfEducation}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].levelOfEducation = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
              readOnly
            />
            <input
              placeholder="Name of School"
              name="nameOfSchool"
              value={row.nameOfSchool}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].nameOfSchool = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Basic Education/Degree/Course"
              name="degreeCourse"
              value={row.degreeCourse}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].degreeCourse = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Score/Grade"
              name="scoreGrade"
              value={row.scoreGrade}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].scoreGrade = e.target.value;
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
              type="date"
              placeholder="From"
              title="From Date Educational Background (mm/dd/yyyy)"
              name="fromDate"
              value={row.fromDate}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].fromDate = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="To"
              title="To Date Educational Background (mm/dd/yyyy)"
              name="toDate"
              value={row.toDate}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].toDate = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Scholarship/Honors"
              name="honorsReceived"
              value={row.honorsReceived}
              onChange={(e) => {
                const newEducation = [...education];
                newEducation[i].honorsReceived = e.target.value;
                setEducation(newEducation);
              }}
              disabled={isDisabled}
            />
            {/* <button
              type="button"
              onClick={() => handleRemoveEducation(i)}
              disabled={isDisabled}
            >
              Remove
            </button> */}
          </div>
        ))}
        {/* <button
          type="button"
          onClick={() =>
            handleAdd(setEducation, {
              educationalBackgroundId: 0,
              personalDataId: 0,
              levelOfEducation: "",
              nameOfSchool: "",
              degreeCourse: "",
              scoreGrade: "",
              yearGraduated: "",
              fromDate: "",
              toDate: "",
              honorsReceived: "",
            })
          }
          disabled={isDisabled}
        >
          Add Education
        </button> */}
      </section>

      {/* V. CIVIL SERVICE ELIGIBILITY */}
      <section>
        <h2>V. Civil Service Eligibility</h2>
        {civilServices.map((row, i) => (
          <div key={i} className={styles.row}>
            <input
              placeholder="Career Service"
              name="careerServiceName"
              value={row.careerServiceName}
              onChange={(e) => {
                const newList = [...civilServices];
                newList[i].careerServiceName = e.target.value;
                setCivilServices(newList);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Rating"
              name="civilServiceRating"
              value={row.civilServiceRating}
              onChange={(e) => {
                const newList = [...civilServices];
                newList[i].civilServiceRating = e.target.value;
                setCivilServices(newList);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="Date of Exam"
              title="Date of Exam (mm/dd/yyyy)"
              name="dateOfExamination"
              value={row.dateOfExamination}
              onChange={(e) => {
                const newList = [...civilServices];
                newList[i].dateOfExamination = e.target.value;
                setCivilServices(newList);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="Place of Exam"
              name="placeOfExamination"
              value={row.placeOfExamination}
              onChange={(e) => {
                const newList = [...civilServices];
                newList[i].placeOfExamination = e.target.value;
                setCivilServices(newList);
              }}
              disabled={isDisabled}
            />
            <input
              placeholder="License Number"
              name="licenseNumber"
              value={row.licenseNumber}
              onChange={(e) => {
                const newList = [...civilServices];
                newList[i].licenseNumber = e.target.value;
                setCivilServices(newList);
              }}
              disabled={isDisabled}
            />
            <input
              type="date"
              placeholder="Date of Validity"
              name="licenseValidityDate"
              value={row.licenseValidityDate}
              onChange={(e) => {
                const newList = [...civilServices];
                newList[i].licenseValidityDate = e.target.value;
                setCivilServices(newList);
              }}
              disabled={isDisabled}
            />
            <button
              type="button"
              onClick={() => handleRemoveCivilService(i)}
              disabled={isDisabled}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            handleAdd(setCivilServices, {
              civilServiceEligibilityId: 0,
              personalDataId: 0,
              careerServiceName: "",
              civilServiceRating: "",
              dateOfExamination: "",
              placeOfExamination: "",
              licenseNumber: "",
              licenseValidityDate: "",
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