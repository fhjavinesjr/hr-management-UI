import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";

const API_BASE_URL_ADMINISTRATIVE = process.env.NEXT_PUBLIC_API_BASE_URL_ADMINISTRATIVE;

export async function fetchAllNatureList() {
    const res = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/natureOfAppointment/get-all`);
    if (!res.ok) {
        throw new Error("Failed to load nature appointment");
    }
    return res.json();
}

export async function fetchPlantillaByJobPosition(jobPositionId: number) {
    const res = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/plantilla/by-job-position/${jobPositionId}`);
    if (!res.ok) {
        throw new Error("Failed to load plantilla");
    }
    return res.json();
}

export async function fetchAllJobPositions() {
    const res = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/job-position/get-all`);
    if (!res.ok) {
        throw new Error("Failed to load job positions");
    }
    return res.json();
}

export async function fetchAllPlantillas() {
    const res = await fetchWithAuth(`${API_BASE_URL_ADMINISTRATIVE}/api/plantilla/get-all`);
    if (!res.ok) {
        throw new Error("Failed to load job positions");
    }
    return res.json();
}