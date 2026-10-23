import { redirect } from "next/navigation";

export default function ApprovedLeaveSummaryPage() {
  redirect("/hr-management/reports?report=leave");
}
