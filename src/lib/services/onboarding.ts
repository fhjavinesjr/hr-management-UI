import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { runtimeConfig } from "@/lib/utils/runtimeConfig";

export type OnboardingItem = { id: string; code: string; label: string; required: boolean; evidenceRequired: boolean;
  status: string; evidenceReference: string | null; completedBy: string | null; verifiedBy: string | null; recordVersion: number };
export type AppointmentIntake = { id: string; handoffId: string; selectionId: string; applicationId: string; applicantId: string;
  status: string; identityDecision: string | null; employeeId: number | null; employeeNo: string | null;
  appointmentId: number | null; recordVersion: number; items: OnboardingItem[] };
export type OnboardingTemplate = { id: string; code: string; definitionVersion: number; status: string;
  effectiveFrom: string | null; effectiveTo: string | null; recordVersion: number };
export type AppointmentResult = { intakeId: string; employeeId: number; appointmentId: number; status: string;
  activationToken: string | null; activationExpiresAt: string | null; recordVersion: number };
export type AppointmentDocumentKind = "OATH_OF_OFFICE" | "ASSUMPTION_TO_DUTY";
export type AppointmentDocument = { id: string; appointmentId: number; onboardingCaseId: string | null;
  kind: AppointmentDocumentKind; status: string; officialTemplateCode: string; officialTemplateVersion: string;
  issueDate: string; oathDate: string | null; assumptionDate: string | null; venue: string;
  administeringEmployeeId: number | null; certifyingEmployeeId: number | null; attestingEmployeeId: number | null;
  supersedesDocumentId: string | null; sourceFingerprint: string; recordVersion: number;
  finalizedBy: string | null; finalizedAt: string | null };

export class OnboardingApiError extends Error { constructor(readonly status: number, message: string) { super(message); } }
async function value<T>(response: Response): Promise<T> { if (!response.ok) { const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null;
  throw new OnboardingApiError(response.status, body?.detail ?? body?.message ?? `Request failed (${response.status}).`); } return response.json() as Promise<T>; }
export function onboardingJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  return fetchWithAuth(`${runtimeConfig.getApiUrl("hrm")}${path}`, { ...init, headers: { ...init.headers,
    "X-Agency-Id": runtimeConfig.getAgencyId() } }).then(value<T>);
}

function safeFilename(response: Response, fallback: string): string {
  const header = response.headers.get("content-disposition") ?? "";
  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = header.match(/filename="?([^";]+)"?/i)?.[1];
  let value = fallback;
  try { value = utf8 ? decodeURIComponent(utf8) : plain ?? fallback; } catch { value = fallback; }
  return value.replace(/[^A-Za-z0-9._-]/g, "_");
}

export async function openHrmPdf(path: string, fallback: string, mode: "open" | "download" = "open"): Promise<void> {
  const response = await fetchWithAuth(`${runtimeConfig.getApiUrl("hrm")}${path}`, {
    headers: { Accept: "application/pdf", "X-Agency-Id": runtimeConfig.getAgencyId() },
  });
  if (!response.ok) {
    const body = await response.clone().json().catch(() => null) as { detail?: string; message?: string } | null;
    throw new OnboardingApiError(response.status, body?.detail ?? body?.message ?? `Report request failed (${response.status}).`);
  }
  if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("application/pdf")) {
    throw new OnboardingApiError(502, "The server returned an invalid report media type.");
  }
  const url = URL.createObjectURL(await response.blob());
  if (mode === "open") {
    const link = document.createElement("a"); link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } else {
    const link = document.createElement("a"); link.href = url; link.download = safeFilename(response, fallback); link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
