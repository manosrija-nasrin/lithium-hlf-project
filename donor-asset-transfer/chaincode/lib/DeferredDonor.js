/*
  SPDX-License-Identifier: Apache-2.0
*/

// DeferredDonor describes details that are private to supers
class DeferredDonor {
  constructor(donor, deferredStatus, deferredDate, deferredTenure, deferredReason, deferredBy, bloodBagUnitNo = '', bloodBagSegmentNo = '') {
    const { donorId, firstName, lastName, password, dob, phoneNumber, aadhar, address, sex, bloodGroup, donationHistory, creditCard, pwdTemp, permissionGranted } = donor;
    // super(donorId, firstName, lastName, password, dob, phoneNumber, aadhar, address, bloodGroup, donationHistory, alert, isDiseased, creditCard, donationStatus, pwdTemp, permissionGranted);
    this.donorId = donorId;
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
    this.creditCard = creditCard;
    this.donationStatus = deferredStatus ? deferredStatus : "deferred";  // deferred permanently/temporarily
    this.pwdTemp = pwdTemp;
    this.permissionGranted = permissionGranted;
    this.deferredDate = deferredDate;
    this.deferredTenure = deferredTenure;
    this.deferredReason = deferredReason;
    this.deferredBy = deferredBy;
    this.bloodBagUnitNo = bloodBagUnitNo;
    this.bloodBagSegmentNo = bloodBagSegmentNo;
  }

  static fromBytes(bytes) {
    if (bytes.length === 0) {
      throw new Error("no deferred donor details");
    }
    const json = Buffer.from(bytes).toString();
    const properties = JSON.parse(json);

    let result = new DeferredDonor();
    result.donorId = properties.donorId;
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
    result.creditCard = properties.creditCard;
    result.donationStatus = properties.donationStatus;

    result.bloodBagUnitNo = properties.bloodBagUnitNo;
    result.bloodBagSegmentNo = properties.bloodBagSegmentNo;
    result.deferredDate = properties.deferredDate;
    result.deferredTenure = properties.deferredTenure;
    result.deferredReason = properties.deferredReason;
    result.deferredBy = properties.deferredBy;

    return result;
  }
}

module.exports = DeferredDonor;