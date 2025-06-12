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
  results: any,
  message?: string,
}

export interface MedicalHistory {
  [medicalHistoryId: string]: MedicalHistoryDetails;
}

export interface DeferredDetails {
  deferredOn: string;
  deferredTenure: number;
  deferredAt: string;
  deferredBy: string;
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
  creationTimestamp: string;
  docType: string;
  changedBy: string;
  Timestamp: Timestamp;
  medicalHistory: MedicalHistory;
  sensitiveMedicalHistory?: MedicalHistory;
  deferredDetails: DeferredDetails;
  deferredReason?: string;
  sensitiveDataPermissionGranted: string[];
}

const emptyDeferredDetails: DeferredDetails = {
  deferredAt: '',
  deferredOn: '',
  deferredTenure: 0,
  deferredBy: ''
};

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
  creationTimestamp: string = '';
  Timestamp = '';
  deferredReason = '';
  sensitiveMedicalHistory: MedicalHistory = {};
  deferredDetails: DeferredDetails = emptyDeferredDetails;
  sensitiveDataPermissionGranted: string[];

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
    this.creationTimestamp = patientRecord.creationTimestamp ? new Date(patientRecord.Timestamp.seconds.low * 1000).toDateString() : '';
    this.medicalHistory = patientRecord.medicalHistory;
    this.deferredReason = patientRecord.deferredReason || '';
    this.deferredDetails = patientRecord.deferredDetails || emptyDeferredDetails;
    this.sensitiveMedicalHistory = patientRecord.sensitiveMedicalHistory || {}; // Assuming sensitive medical history is the same as medical history
    this.sensitiveDataPermissionGranted = patientRecord.sensitiveDataPermissionGranted || [];
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
  creationTimestamp: string;
  deferralStatus: string;
  donationHistory: DonationHistory;
  docType: string;
  changedBy: string;
  Timestamp: Timestamp;
  deferredReason: string;
  sensitiveMedicalHistory?: MedicalHistory;
  medicalHistory: MedicalHistory;
  deferredDetails: DeferredDetails;
  sensitiveDataPermissionGranted: string[];

  constructor(readonly patientRecord: PatientRecord, deferredReason: string) {
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
    this.creationTimestamp = patientRecord.creationTimestamp;
    this.deferralStatus = patientRecord.deferralStatus;
    this.donationHistory = patientRecord.donationHistory;
    this.docType = patientRecord.docType;
    this.changedBy = patientRecord.changedBy;
    this.Timestamp = patientRecord.Timestamp;
    this.deferredReason = deferredReason;
    this.medicalHistory = patientRecord.medicalHistory;
    this.sensitiveMedicalHistory = patientRecord.sensitiveMedicalHistory;
    this.deferredDetails = patientRecord.deferredDetails || emptyDeferredDetails;
    this.sensitiveDataPermissionGranted = patientRecord.sensitiveDataPermissionGranted || [];
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
  creationTimestamp = '';
  deferredDetails: DeferredDetails = emptyDeferredDetails;

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
    this.creationTimestamp = patientRecord.creationTimestamp;
    this.deferredDetails = patientRecord.deferredDetails || emptyDeferredDetails;
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
  creationTimestamp = '';
  deferralStatus = '';
  donationHistory = {};
  medicalHistory = {};
  deferredOn = '';
  deferredReason = '';
  sensitiveMedicalHistory: MedicalHistory = {};
  deferredDetails: DeferredDetails = emptyDeferredDetails;

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
    this.creationTimestamp = patientRecord.creationTimestamp;
    this.donationHistory = patientRecord.donationHistory;
    this.medicalHistory = patientRecord.medicalHistory;
    this.deferredReason = patientRecord.deferredReason || '';
    this.deferredOn = (patientRecord.deferredDetails && patientRecord.deferredDetails.deferredOn) || '';
    this.sensitiveMedicalHistory = patientRecord.sensitiveMedicalHistory || {};
    this.deferredDetails = patientRecord.deferredDetails || emptyDeferredDetails;
  }
}

export class DisplayVal {
  keyName: string | number | boolean | DonationHistory | MedicalHistory | DeferredDetails | undefined;
  displayName: string;

  constructor(key: string | number | boolean | DonationHistory | MedicalHistory | DeferredDetails | undefined, value: string) {
    this.keyName = key;
    this.displayName = value;
  }
}

