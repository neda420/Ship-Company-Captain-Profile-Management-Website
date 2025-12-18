// src/types.ts

// FIXED: Added "Captain" and "Chief Mate" to match your Sidebar code
export type Rank = 'Master' | 'Captain' | 'Chief Officer' | 'Chief Mate' | '2nd Officer' | 'Chief Engineer';

export type Status = 'Active' | 'Onboard' | 'On Leave' | 'Available';

export interface Filters {
  rank: Rank[];
  status: Status[];
}

export interface Certificate {
  id: string;
  name: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  fileUrl?: string;
}

export interface SeaService {
  id: string;
  vesselName: string;
  vesselType: string;
  rank: string;
  startDate: string;
  endDate: string;
}

// Personal Identity Information
export interface PersonalIdentity {
  fullLegalName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  permanentHomeAddress: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhoneNumber: string;
  emergencyContactEmail: string;
  shirtSize: string;
  pantSize: string;
  shoeSize: string;
  hatSize: string;
}

// Professional & Operational Information
export interface ProfessionalInfo {
  cocNumber: string;
  issuingCountry: string;
  capacity: string; // Rank
  licenseLimitations: string;
  totalSeaTime: string;
  timeInRank: string;
  vesselTypesFlown: string[];
  bankIBAN: string;
  bankSWIFT: string;
  currencyPreference: string;
  nearestAirport: string;
}

// Medical Information
export interface MedicalInfo {
  bloodType: string;
  knownAllergies: string;
  dietaryRestrictions: string;
  correctiveLensesRequired: boolean;
}

// Expiry Date Tracking
export interface ExpiryDates {
  passportExpiryDate: string;
  visaExpiryDate: string;
  cocExpiryDate: string;
  flagStateEndorsementExpiryDate: string;
  medicalCertificateExpiryDate: string;
  stcwTrainingExpiryDate: string;
}

// Document Upload
export interface DocumentUpload {
  passportScan?: string;
  visaDocument?: string;
  passportPhoto?: string;
  certificateOfCompetency?: string;
  flagStateEndorsement?: string;
  gmdssCertificate?: string;
  basicSafetyTrainingCertificate?: string;
  advancedFireFightingCertificate?: string;
  medicalCareOnboardCertificate?: string;
  shipSecurityOfficerCertificate?: string;
  ecdisCertificate?: string;
  bridgeResourceManagementCertificate?: string;
  medicalCertificateENG1?: string;
  drugAlcoholTestResults?: string;
  vaccinationRecord?: string;
  seamanDischargeBookScans?: string;
  referenceLetters?: string;
  currentCVResume?: string;
  employmentContractSEA?: string;
  signedCodeOfConduct?: string;
  signedNDA?: string;
}

export interface CaptainProfile {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
  status: Status;
  email: string;
  phone: string;
  location: string;
  linkedInUrl?: string;
  // New comprehensive fields
  personalIdentity: PersonalIdentity;
  professionalInfo: ProfessionalInfo;
  medicalInfo: MedicalInfo;
  expiryDates: ExpiryDates;
  documents: DocumentUpload;
  // Legacy fields (kept for backward compatibility)
  physicalSpecs?: {
    heightCm: number;
    weightKg: number;
    bloodType: string;
    shoeSize: number;
    coverallSize: string;
  };
  licenses: Certificate[];
  seaServiceHistory: SeaService[];
  skills: string[];
}

// User and Permission Types
export type Permission = 
  | 'view_dashboard'
  | 'view_employees'
  | 'edit_employees'
  | 'view_documents'
  | 'manage_documents'
  | 'view_settings'
  | 'manage_users'
  | 'manage_settings';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  permissions: Permission[];
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
