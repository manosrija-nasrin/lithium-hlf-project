'use strict';

const PrimaryContract = require('./lib/primary-contract.js');
const AdminContract = require('./lib/admin-contract.js');
const PatientContract = require('./lib/patient-contract.js');
const DoctorContract = require('./lib/doctor-contract.js');
const TechnicianContract = require('./lib/technician-contract.js');
const SuperContract = require("./lib/super-contract.js");

module.exports.contracts = [PrimaryContract, AdminContract, PatientContract, DoctorContract, TechnicianContract, SuperContract];
