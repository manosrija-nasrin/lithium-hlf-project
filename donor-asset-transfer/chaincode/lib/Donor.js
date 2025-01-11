const crypto = require("crypto");

class Donor {
  constructor(donorId, firstName, lastName, password, dob, phoneNumber, aadhar, address, bloodGroup, donationHistory = {}, alert = "false", isDiseased = "false", creditCard = "0", donationStatus = "-"
  ) {
    this.donorId = donorId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = crypto.createHash("sha256").update(password).digest("hex");
    this.dob = dob;
    this.phoneNumber = phoneNumber;
    this.aadhar = aadhar;
    this.address = address;
    this.bloodGroup = bloodGroup;
    this.donationHistory = donationHistory;
    this.alert = alert;
    this.isDiseased = isDiseased;
    this.creditCard = creditCard;
    this.donationStatus = donationStatus;
    this.pwdTemp = true;
    this.permissionGranted = [];
    return this;
  }
}

module.exports = Donor;