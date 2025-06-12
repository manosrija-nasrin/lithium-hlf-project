/*
  SPDX-License-Identifier: Apache-2.0
*/

const defaultPermissionToSensitiveData = ["HOSP1-SUP12226",
  "HOSP2-SUP12227"];

// DeferredPatient describes details that are private to supers
class DeferredPatient {
  constructor(patient, deferredStatus, deferredOn, deferredTenure, deferredReason, deferredAt, sensitiveMedicalHistory = {},
    bloodBagUnitNo = '', bloodBagSegmentNo = '', alert = true, isDiseased = true) {
    const { healthId, firstName, lastName, password, dob, phoneNumber, aadhar, address, sex, bloodGroup, donationHistory,
      healthCreditPoints, creationTimestamp, pwdTemp, permissionGranted, medicalHistory, deferredDetails, sensitiveDataPermissionGranted,
      sensitiveDataRequests } = patient;
    // super(healthId, firstName, lastName, password, dob, phoneNumber, aadhar, address, bloodGroup,
    //  donationHistory, alert, isDiseased, healthCreditPoints, deferralStatus, pwdTemp, permissionGranted);
    let newDeferredDetails = {
      deferredAt: deferredAt,
      deferredOn: deferredOn,
      deferredTenure: deferredTenure,
      deferredStatus: deferredStatus,
    }
    this.healthId = healthId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.dob = dob;
    this.phoneNumber = phoneNumber;
    this.aadhar = aadhar;
    this.address = address;
    this.sex = sex;
    this.bloodGroup = bloodGroup;
    this.donationHistory = donationHistory;
    this.medicalHistory = medicalHistory;
    this.alert = alert;
    this.isDiseased = isDiseased;
    this.healthCreditPoints = healthCreditPoints;
    this.deferralStatus = deferredStatus ? deferredStatus : "not deferred";  // deferred permanently/temporarily
    this.pwdTemp = pwdTemp;
    this.creationTimestamp = creationTimestamp;
    this.permissionGranted = permissionGranted;

    this.deferredDetails = newDeferredDetails;
    this.deferredReason = deferredReason;
    this.sensitiveDataPermissionGranted = sensitiveDataPermissionGranted;
    this.sensitiveDataRequests = sensitiveDataRequests;
    this.sensitiveMedicalHistory = sensitiveMedicalHistory;
    this.bloodBagUnitNo = bloodBagUnitNo;
    this.bloodBagSegmentNo = bloodBagSegmentNo;
  }

  static fromBytes(bytes) {
    if (bytes.length === 0) {
      throw new Error("no deferred patient details");
    }
    const json = Buffer.from(bytes).toString();
    const properties = JSON.parse(json);

    let result = {};
    result.healthId = properties.healthId;
    result.firstName = properties.firstName;
    result.lastName = properties.lastName;
    result.password = properties.password;
    result.dob = properties.dob;
    result.phoneNumber = properties.phoneNumber;
    result.aadhar = properties.aadhar;
    result.bloodGroup = properties.bloodGroup;
    result.sex = properties.sex;
    result.donationHistory = properties.donationHistory;
    result.medicalHistory = properties.medicalHistory;
    result.alert = properties.alert;
    result.isDiseased = properties.isDiseased;
    result.healthCreditPoints = properties.healthCreditPoints;
    result.deferralStatus = properties.deferralStatus;
    result.deferredDetails = properties.deferredDetails;

    result.bloodBagUnitNo = properties.bloodBagUnitNo;
    result.bloodBagSegmentNo = properties.bloodBagSegmentNo;
    result.deferredReason = properties.deferredReason;
    result.sensitiveMedicalHistory = properties.sensitiveMedicalHistory;
    result.sensitiveDataRequests = properties.sensitiveDataRequests;
    result.sensitiveDataPermissionGranted = properties.sensitiveDataPermissionGranted;

    return result;
  }
}

module.exports = DeferredPatient;