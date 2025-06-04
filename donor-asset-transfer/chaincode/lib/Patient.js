const crypto = require("crypto");

class Patient {
  constructor(healthId, firstName, lastName, password, dob, phoneNumber, aadhar, address, bloodGroup, sex, donationHistory = {}, medicalHistory = {}, deferredDetails = {}, alert = "false", isDiseased = "false", healthCreditPoints = "0", donationStatus = "-"
  ) {
    this.healthId = healthId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = crypto.createHash("sha256").update(password).digest("hex");
    this.dob = dob;
    this.phoneNumber = phoneNumber;
    this.aadhar = aadhar;
    this.address = address;
    this.bloodGroup = bloodGroup;
    this.sex = sex;
    this.donationHistory = donationHistory;
    this.medicalHistory = medicalHistory;
    this.deferredDetails = deferredDetails;
    this.alert = alert;
    this.isDiseased = isDiseased;
    this.healthCreditPoints = healthCreditPoints;
    this.donationStatus = donationStatus;
    this.creationTimestamp = new Date().toISOString();
    this.pwdTemp = true;
    this.permissionGranted = [];
    return this;
  }
}

module.exports = Patient;