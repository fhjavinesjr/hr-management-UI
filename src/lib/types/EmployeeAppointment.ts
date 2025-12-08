
export type EmployeeAppointmentModel = {
  employeeAppointmentId: string;
  employeeId: string;
  appointmentIssuedDate: string;
  assumptionToDutyDate: string;
  natureOfAppointmentId: string;
  plantillaId: string;
  jobPositionId: string;
  salaryGrade: string;
  salaryStep: string;
  salaryPerAnnum: string;
  salaryPerMonth: string;
  salaryPerDay: string;
  details: string;
  activeAppointment: boolean;
};

export type JobPositionDTO = {
  jobPositionId: number;
  jobPositionName: string;
  salaryGrade: number;
  salaryStep: number;
};

export type PlantillaDTO = {
  plantillaId: number;
  plantillaName: string;
  jobPositionId: number;
};

export type NatureOfAppointmentDTO = {
  natureOfAppointmentId: number;
  code: string;
  nature: string;
};