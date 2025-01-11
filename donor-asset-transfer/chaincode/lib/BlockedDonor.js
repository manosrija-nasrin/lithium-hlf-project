/*
  SPDX-License-Identifier: Apache-2.0
*/

// BlockedDonor describes details that are private to owners
class BlockedDonor {
  constructor(donor, blockedDate, blockedTenure, blockedReason, blockedBy, bloodBagUnitNo = '', bloodBagSegmentNo = '') {
    const { donorId, firstName, lastName, password, dob, phoneNumber, aadhar, address, bloodGroup, donationHistory, creditCard, pwdTemp, permissionGranted } = donor;
    // super(donorId, firstName, lastName, password, dob, phoneNumber, aadhar, address, bloodGroup, donationHistory, alert, isDiseased, creditCard, donationStatus, pwdTemp, permissionGranted);
    this.donorId = donorId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.dob = dob;    
    this.phoneNumber = phoneNumber;
    this.aadhar = aadhar;
    this.address = address;
    this.bloodGroup = bloodGroup;
    this.donationHistory = donationHistory;
    this.alert = true;
    this.isDiseased = true;
    this.creditCard = creditCard;
    this.donationStatus = 'blocked';
    this.pwdTemp = pwdTemp;
    this.permissionGranted = permissionGranted;
    this.blockedDate = blockedDate;
    this.blockedTenure = blockedTenure;
    this.blockedReason = blockedReason;
    this.blockedBy = blockedBy;
    this.bloodBagUnitNo = bloodBagUnitNo;
    this.bloodBagSegmentNo = bloodBagSegmentNo;
  }

  static fromBytes(bytes) {
    if (bytes.length === 0) {
      throw new Error("no blocked donor details");
    }
    const json = Buffer.from(bytes).toString();
    const properties = JSON.parse(json);

    let result = new BlockedDonor();
    result.donorId = properties.donorId;
    result.firstName = properties.firstName;
    result.lastName = properties.lastName;
    result.password = properties.password;
    result.dob = properties.dob;
    result.phoneNumber = properties.phoneNumber;
    result.aadhar = properties.aadhar;
    result.bloodGroup = properties.bloodGroup;
    result.donationHistory = properties.donationHistory;
    result.alert = properties.alert;
    result.isDiseased = properties.isDiseased;
    result.creditCard = properties.creditCard;
    result.donationStatus = properties.donationStatus;

    result.bloodBagUnitNo = properties.bloodBagUnitNo;
    result.bloodBagSegmentNo = properties.bloodBagSegmentNo;
    result.blockedDate = properties.blockedDate;
    result.blockedTenure = properties.blockedTenure;
    result.blockedReason = properties.blockedReason;
    result.blockedBy = properties.blockedBy;

    return result;
  }
}

module.exports = BlockedDonor;