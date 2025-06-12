export interface Timestamp {
  nanos: number;
  seconds: ISeconds;
}

export interface ISeconds {
  high: number;
  low: number;
  unsigned: boolean;
}

export interface DonationDetails {
  dateOfDonation: string;
  status: string;
  bloodBagUnitNo: string;
  bloodBagSegmentNo: string;
  quantity: string;
  reason: string;
  screenedBy: string;
  collectedBy: string;
}

export interface DonationHistory {
  [donationNumber: string]: DonationDetails;
}

export interface TestDetails {
  pulse: string,
  systolic: string,
  diastolic: string,
  weight: string,
  haemoglobin: string,
  anaemia?: string,
  cardiovascularDisease?: string,
  haemophiliaA?: string,
  haemophiliaB?: string,
  hypertension?: string,
  asthma?: string,
}

export interface MedicalHistoryDetails {
  dateOfTest: string,
  status: string,
  reason?: string,
  testedAt: string,
  results: any
}

export interface MedicalHistory {
  [medicalHistoryId: string]: MedicalHistoryDetails;
}

export interface PatientRecord {
  healthId: string;
  firstName: string;
  lastName: string;
  address: string;
  dob: string;
  aadhar: string;
  phoneNumber: string;
  bloodGroup: string;
  sex: string,
  alert: boolean;
  isDiseased: boolean;
  healthCreditPoints: string;
  deferralStatus: string;
  donationHistory: DonationHistory;
  docType: string;
  changedBy: string;
  Timestamp: Timestamp;
  medicalHistory: MedicalHistory;
  sensitiveMedicalHistory?: MedicalHistory;
  deferredOn?: string;
  deferredReason?: string;
  deferredTenure?: number;
  deferredAt?: string;
}

export class PatientViewRecord {
  healthId = '';
  firstName = '';
  lastName = '';
  address = '';
  dob = '';
  aadhar = '';
  phoneNumber = '';
  bloodGroup = '';
  sex = '';
  alert = false;
  isDiseased = false;
  healthCreditPoints = '';
  deferralStatus = '';
  donationHistory: DonationHistory = {};
  docType = '';
  changedBy = '';
  medicalHistory: MedicalHistory = {};
  Timestamp = '';
  deferredOn = '';
  deferredReason = '';
  deferredTenure = 0;
  deferredAt = '';
  sensitiveMedicalHistory: MedicalHistory = {};

  constructor(readonly patientRecord: PatientRecord) {
    this.healthId = patientRecord.healthId;
    this.firstName = patientRecord.firstName;
    this.lastName = patientRecord.lastName;
    this.address = patientRecord.address;
    this.dob = patientRecord.dob;
    this.aadhar = patientRecord.aadhar;
    this.phoneNumber = patientRecord.phoneNumber;
    this.bloodGroup = patientRecord.bloodGroup;
    this.sex = patientRecord.sex;
    this.alert = patientRecord.alert;
    this.isDiseased = patientRecord.isDiseased;
    this.healthCreditPoints = patientRecord.healthCreditPoints;
    this.deferralStatus = patientRecord.deferralStatus;
    this.donationHistory = patientRecord.donationHistory;
    this.docType = patientRecord.docType;
    this.changedBy = patientRecord.changedBy;
    this.Timestamp = patientRecord.Timestamp ? new Date(patientRecord.Timestamp.seconds.low * 1000).toDateString() : '';
    this.medicalHistory = patientRecord.medicalHistory;
    this.deferredOn = patientRecord.deferredOn || '';
    this.deferredReason = patientRecord.deferredReason || '';
    this.deferredTenure = patientRecord.deferredTenure || 0;
    this.deferredAt = patientRecord.deferredAt || '';
    this.sensitiveMedicalHistory = patientRecord.medicalHistory; // Assuming sensitive medical history is the same as medical history
  }
}

export class PatientDeferred implements PatientRecord {
  healthId: string;
  firstName: string;
  lastName: string;
  address: string;
  dob: string;
  aadhar: string;
  phoneNumber: string;
  bloodGroup: string;
  sex: string;
  alert: boolean;
  isDiseased: boolean;
  healthCreditPoints: string;
  deferralStatus: string;
  donationHistory: DonationHistory;
  docType: string;
  changedBy: string;
  Timestamp: Timestamp;
  deferredOn: string;
  deferredReason: string;
  deferredTenure: number;
  sensitiveMedicalHistory?: MedicalHistory;
  medicalHistory: MedicalHistory;

  constructor(readonly patientRecord: PatientRecord, deferredOn: string, deferredReason: string, deferredTenure: number) {
    this.healthId = patientRecord.healthId;
    this.firstName = patientRecord.firstName;
    this.lastName = patientRecord.lastName;
    this.address = patientRecord.address;
    this.dob = patientRecord.dob;
    this.aadhar = patientRecord.aadhar;
    this.phoneNumber = patientRecord.phoneNumber;
    this.bloodGroup = patientRecord.bloodGroup;
    this.sex = patientRecord.sex;
    this.alert = patientRecord.alert;
    this.isDiseased = patientRecord.isDiseased;
    this.healthCreditPoints = patientRecord.healthCreditPoints;
    this.deferralStatus = patientRecord.deferralStatus;
    this.donationHistory = patientRecord.donationHistory;
    this.docType = patientRecord.docType;
    this.changedBy = patientRecord.changedBy;
    this.Timestamp = patientRecord.Timestamp;
    this.deferredOn = deferredOn;
    this.deferredReason = deferredReason;
    this.deferredTenure = deferredTenure;
    this.medicalHistory = patientRecord.medicalHistory;
    this.deferredOn = deferredOn;
    this.deferredReason = deferredReason;
    this.deferredTenure = deferredTenure;
    this.sensitiveMedicalHistory = patientRecord.sensitiveMedicalHistory;
  }
}

export class PatientAdminViewRecord {
  healthId = '';
  firstName = '';
  lastName = '';
  docType = '';
  aadhar = '';
  phoneNumber = '';
  sex = '';

  constructor(readonly patientRecord: PatientRecord) {
    this.healthId = patientRecord.healthId;
    this.firstName = patientRecord.firstName;
    this.lastName = patientRecord.lastName;
    this.docType = patientRecord.docType;
    this.aadhar = patientRecord.aadhar;
    this.phoneNumber = patientRecord.phoneNumber;
    this.sex = patientRecord.sex;
  }
}

export class PatientDoctorViewRecord {
  healthId = '';
  firstName = '';
  lastName = '';
  bloodGroup = '';
  sex = '';
  alert = false;
  isDiseased = false;
  healthCreditPoints = '';
  deferralStatus = '';
  donationHistory = {};
  medicalHistory = {};

  constructor(readonly patientRecord: PatientRecord) {
    this.healthId = patientRecord.healthId;
    this.firstName = patientRecord.firstName;
    this.lastName = patientRecord.lastName;
    this.bloodGroup = patientRecord.bloodGroup;
    this.sex = patientRecord.sex;
    this.alert = patientRecord.alert;
    this.isDiseased = patientRecord.isDiseased;
    this.healthCreditPoints = patientRecord.healthCreditPoints;
    this.deferralStatus = patientRecord.deferralStatus;
    this.donationHistory = patientRecord.donationHistory;
    this.medicalHistory = patientRecord.medicalHistory;
  }
}

export class PatientSuperViewRecord {
  healthId = '';
  firstName = '';
  lastName = '';
  bloodGroup = '';
  sex = '';
  alert = false;
  isDiseased = false;
  healthCreditPoints = '';
  deferralStatus = '';
  donationHistory = {};
  medicalHistory = {};
  deferredOn = '';
  deferredReason = '';
  deferredTenure = 0;
  deferredAt = '';
  sensitiveMedicalHistory: MedicalHistory = {};

  constructor(readonly patientRecord: PatientRecord) {
    this.healthId = patientRecord.healthId;
    this.firstName = patientRecord.firstName;
    this.lastName = patientRecord.lastName;
    this.bloodGroup = patientRecord.bloodGroup;
    this.sex = patientRecord.sex;
    this.alert = patientRecord.alert;
    this.isDiseased = patientRecord.isDiseased;
    this.healthCreditPoints = patientRecord.healthCreditPoints;
    this.deferralStatus = patientRecord.deferralStatus;
    this.donationHistory = patientRecord.donationHistory;
    this.medicalHistory = patientRecord.medicalHistory;
    this.deferredOn = patientRecord.deferredOn || '';
    this.deferredReason = patientRecord.deferredReason || '';
    this.deferredTenure = patientRecord.deferredTenure || 0;
    this.deferredAt = patientRecord.deferredAt || '';
    this.sensitiveMedicalHistory = patientRecord.sensitiveMedicalHistory || {};
  }
}

export class DisplayVal {
  keyName: string | number | boolean | DonationHistory;
  displayName: string;

  constructor(key: string | number | boolean | DonationHistory, value: string) {
    this.keyName = key;
    this.displayName = value;
  }
}

