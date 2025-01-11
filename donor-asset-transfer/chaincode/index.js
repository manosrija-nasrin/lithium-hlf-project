'use strict';

const PrimaryContract = require('./lib/primary-contract.js');
const AdminContract = require('./lib/admin-contract.js');
const DonorContract = require('./lib/donor-contract.js');
const DoctorContract = require('./lib/doctor-contract.js');
const TechnicianContract = require('./lib/technician-contract.js');
const SuperContract = require("./lib/super-contract.js");

module.exports.contracts = [PrimaryContract, AdminContract, DonorContract, DoctorContract, TechnicianContract, SuperContract];
