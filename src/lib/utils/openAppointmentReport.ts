import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { runtimeConfig } from "@/lib/utils/runtimeConfig";

export async function openAppointmentReport(employeeAppointmentId: string): Promise<void> {
  if (!employeeAppointmentId) {
    throw new Error("No employee appointment was selected.");
  }

  const response = await fetchWithAuth(
    `${runtimeConfig.getApiUrl("hrm")}/api/employeeAppointment/report/${encodeURIComponent(employeeAppointmentId)}`,
  );
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Failed to generate personnel action report (${response.status}).`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
