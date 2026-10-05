import { fetchWithAuth } from "@/lib/utils/fetchWithAuth";
import { runtimeConfig } from "@/lib/utils/runtimeConfig";

export type FilingType="ASSUMPTION"|"ANNUAL"|"SEPARATION";
export type OwnerType="DECLARANT"|"SPOUSE"|"CHILD";
export type FilingMode="JOINT"|"SEPARATE"|"NOT_APPLICABLE";
export type SourceType="PAPER"|"LEGACY_MIGRATION"|"ADMIN_ENCODED";
export type SalnStatus="DRAFT"|"SUBMITTED"|"UNDER_REVIEW"|"FOR_CORRECTION"|"RESUBMITTED"|"COMPLIANT"|"LOCKED"|"VOIDED";
export interface Totals{realProperties:number;personalProperties:number;totalAssets:number;totalLiabilities:number;netWorth:number;}
export interface Summary{id:number;employeeId:number;employeeNo:string;employeeName:string;filingType:FilingType;salnYear:number;dueDate:string;submissionDate?:string|null;status:SalnStatus;sourceType:string;versionNo:number;totalAssets:number;totalLiabilities:number;netWorth:number;reviewedBy?:string|null;compliantAt?:string|null;}
export interface OwnedItem{ownerType:OwnerType;ownerName?:string|null;}
export interface RealProperty extends OwnedItem{description:string;kind:string;exactLocation:string;assessedValue:number|string;fairMarketValue:number|string;acquisitionYear:number;acquisitionMode:string;acquisitionCost:number|string;}
export interface PersonalProperty extends OwnedItem{description:string;acquisitionYear:number;acquisitionCost:number|string;}
export interface Liability extends OwnedItem{nature:string;creditorName:string;outstandingBalance:number|string;}
export interface BusinessInterest extends OwnedItem{entityName:string;businessAddress:string;nature:string;dateAcquired:string;}
export interface GovernmentRelative{name:string;relationship:string;position:string;agencyOfficeAddress:string;}
export interface Dependent{name:string;relationship:string;age:number;}
export interface HistoricalDraft{filingType:FilingType;salnYear:number;referenceDate:string;declarantMiddleInitial:string;declarantPosition:string;declarantAgencyOffice:string;declarantOfficeAddress:string;spouseFullName:string;spousePosition:string;spouseAgencyOffice:string;spouseOfficeAddress:string;filingMode:FilingMode;multipleSpouses:string;businessInterestsNone:boolean;relativesInGovernmentNone:boolean;certificationAccepted:boolean;governmentIdType:string;governmentIdNo:string;governmentIdDateIssued:string;dependents:Dependent[];realProperties:RealProperty[];personalProperties:PersonalProperty[];liabilities:Liability[];businessInterests:BusinessInterest[];governmentRelatives:GovernmentRelative[];remarks:string;}
export interface HistoricalRequest{employeeId:number;sourceType:SourceType;originalFilingDate:string;sourceDocumentReference:string;declaration:HistoricalDraft;}
export interface RecordDetail extends Summary{referenceDate:string;asOfDate:string;declarantFamilyName:string;declarantFirstName:string;declarantPosition?:string;declarantAgencyOffice?:string;declarantOfficeAddress?:string;spouseFullName?:string;filingMode:string;businessInterestsNone:boolean;relativesInGovernmentNone:boolean;realProperties:RealProperty[];personalProperties:PersonalProperty[];liabilities:Liability[];businessInterests:BusinessInterest[];governmentRelatives:GovernmentRelative[];totals:Totals;repositoryAgency?:string|null;repositorySubmittedAt?:string|null;repositoryReferenceNo?:string|null;remarks?:string|null;}
export interface Dashboard{totalRequired:number;filed:number;notFiled:number;draft:number;submitted:number;underReview:number;forCorrection:number;compliant:number;overdue:number;}
export interface Audit{id:number;action:string;performedBy:string;performedAt:string;oldStatus?:SalnStatus|null;newStatus?:SalnStatus|null;remarks?:string|null;versionNo:number;}
export interface Requirement{id:number;employeeId:number;employeeNo:string;filingType:FilingType;referenceDate:string;salnYear:number;dueDate:string;status:string;linkedSalnId?:number|null;}
export interface AnnualBulkRequirementResult{salnYear:number;referenceDate:string;dueDate:string;eligibleEmployees:number;requirementsCreated:number;alreadyExisting:number;excludedEmployees:number;}
const base=()=>`${runtimeConfig.getApiUrl("hrm")}/api/saln/admin`;
const message=async(r:Response)=>{const b=await r.json().catch(()=>null) as {detail?:string;message?:string;error?:string}|null;return b?.detail??b?.message??b?.error??`Request failed (${r.status})`;};
const json=async<T>(r:Response):Promise<T>=>{if(!r.ok)throw new Error(await message(r));return r.json() as Promise<T>;};
const mutate=<T>(url:string,body?:unknown)=>fetchWithAuth(url,{method:"POST",body:body===undefined?undefined:JSON.stringify(body)}).then(r=>json<T>(r));
export const salnAdminApi={
 list:(query:URLSearchParams)=>fetchWithAuth(`${base()}?${query}`).then(r=>json<Summary[]>(r)),
 dashboard:(query:URLSearchParams)=>fetchWithAuth(`${base()}/dashboard?${query}`).then(r=>json<Dashboard>(r)),
 get:(id:number)=>fetchWithAuth(`${base()}/${id}`).then(r=>json<RecordDetail>(r)),
 audit:(id:number)=>fetchWithAuth(`${base()}/${id}/audit`).then(r=>json<Audit[]>(r)),
 start:(id:number)=>mutate<RecordDetail>(`${base()}/${id}/start-review`),
 correct:(id:number,section:string,field:string,correctionMessage:string)=>mutate<RecordDetail>(`${base()}/${id}/return-for-correction`,{items:[{section,field,message:correctionMessage}]}),
 compliant:(id:number,remarks:string)=>mutate<RecordDetail>(`${base()}/${id}/mark-compliant`,{remarks}),
 lock:(id:number,remarks:string)=>mutate<RecordDetail>(`${base()}/${id}/lock`,{remarks}),
 repository:(id:number,payload:{repositoryAgency:string;submittedAt:string;referenceNo:string;remarks:string})=>mutate<RecordDetail>(`${base()}/${id}/repository-submission`,payload),
 voidRecord:(id:number,reason:string)=>mutate<RecordDetail>(`${base()}/${id}/void`,{reason,replacementSalnId:null}),
 requirements:()=>fetchWithAuth(`${base()}/requirements/all`).then(r=>json<Requirement[]>(r)),
 createRequirement:(employeeId:number,filingType:FilingType,referenceDate:string)=>mutate<Requirement>(`${base()}/requirements`,{employeeId,filingType,referenceDate}),
 annualRequirementPreview:(year:number)=>fetchWithAuth(`${base()}/requirements/annual-preview?year=${year}`).then(r=>json<AnnualBulkRequirementResult>(r)),
 generateAnnualRequirements:(year:number)=>mutate<AnnualBulkRequirementResult>(`${base()}/requirements/annual-generate`,{salnYear:year}),
 historical:(payload:HistoricalRequest)=>mutate<RecordDetail>(`${base()}/historical`,payload),
 pdf:async(id:number)=>{const response=await fetchWithAuth(`${base()}/${id}/pdf`);if(!response.ok)throw new Error(await message(response));return response.blob();},
 compliance:async(query:URLSearchParams)=>{const response=await fetchWithAuth(`${base()}/report/compliance?${query}`);if(!response.ok)throw new Error(await message(response));return response.blob();},
};
export const newHistoricalDraft=():HistoricalDraft=>{const year=new Date().getFullYear();return{filingType:"ANNUAL",salnYear:year,referenceDate:`${year}-12-31`,declarantMiddleInitial:"",declarantPosition:"",declarantAgencyOffice:"",declarantOfficeAddress:"",spouseFullName:"",spousePosition:"",spouseAgencyOffice:"",spouseOfficeAddress:"",filingMode:"NOT_APPLICABLE",multipleSpouses:"",businessInterestsNone:true,relativesInGovernmentNone:true,certificationAccepted:false,governmentIdType:"",governmentIdNo:"",governmentIdDateIssued:"",dependents:[],realProperties:[],personalProperties:[],liabilities:[],businessInterests:[],governmentRelatives:[],remarks:""};};
