/*
  SPDX-License-Identifier: Apache-2.0
*/

// DeferredPatient describes details that are private to supers
class DeferredPatient {
  constructor(patient, deferredStatus, deferredDate, deferredTenure, deferredReason, deferredAt, sensitiveMedicalHistory = {}, bloodBagUnitNo = '', bloodBagSegmentNo = '') {
    const { healthId, firstName, lastName, password, dob, phoneNumber, aadhar, address, sex, bloodGroup, donationHistory, healthCreditPoints, creationTimestamp, pwdTemp, permissionGranted, deferredDetails } = patient;
    // super(healthId, firstName, lastName, password, dob, phoneNumber, aadhar, address, bloodGroup, donationHistory, alert, isDiseased, healthCreditPoints, donationStatus, pwdTemp, permissionGranted);
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
    this.alert = true;
    this.isDiseased = true;
    this.healthCreditPoints = healthCreditPoints;
    this.donationStatus = deferredStatus ? deferredStatus : "deferred";  // deferred permanently/temporarily
    this.pwdTemp = pwdTemp;
    this.creationTimestamp = creationTimestamp;
    this.permissionGranted = permissionGranted;
    this.deferredDetails = deferredDetails;
    this.deferredDate = deferredDate;
    this.deferredTenure = deferredTenure;
    this.deferredReason = deferredReason;
    this.deferredAt = deferredAt;
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
    result.alert = properties.alert;
    result.isDiseased = properties.isDiseased;
    result.healthCreditPoints = properties.healthCreditPoints;
    result.donationStatus = properties.donationStatus;
    result.deferredDetails = properties.deferredDetails;

    result.bloodBagUnitNo = properties.bloodBagUnitNo;
    result.bloodBagSegmentNo = properties.bloodBagSegmentNo;
    result.deferredDate = properties.deferredDate;
    result.deferredTenure = properties.deferredTenure;
    result.deferredReason = properties.deferredReason;
    result.deferredAt = properties.deferredAt;
    result.sensitiveMedicalHistory = properties.sensitiveMedicalHistory;

    return result;
  }
}

module.exports = DeferredPatient;