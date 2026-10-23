import { redirect } from "next/navigation";

export default function AppointmentReportsPage() {
  redirect("/hr-management/reports?report=personnel-action");
}
