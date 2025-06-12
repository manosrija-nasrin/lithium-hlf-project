const crypto = require("crypto");

const defaultPermissionToSensitiveData = ["HOSP1-SUP12226",
  "HOSP2-SUP12227"];

class Patient {
  constructor(healthId, firstName, lastName, password, dob, phoneNumber, aadhar, address,
    bloodGroup, sex, donationHistory = {}, medicalHistory = {}, deferredDetails = {},
    alert = "false", isDiseased = "false", healthCreditPoints = "0", deferralStatus = "-",
    sensitiveDataRequests = []
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
    this.deferralStatus = deferralStatus;
    this.creationTimestamp = new Date().toISOString();
    this.pwdTemp = true;
    this.permissionGranted = [];
    this.sensitiveDataPermissionGranted = defaultPermissionToSensitiveData;
    this.sensitiveDataRequests = sensitiveDataRequests;
    return this;
  }
}

module.exports = Patient;