/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const PrimaryContract = require('./lib/primary-contract.js');
const TechnicianContract = require('./lib/technician-contract.js');
const DoctorContract = require('./lib/doctor-contract.js');

module.exports.contracts = [ PrimaryContract, TechnicianContract, DoctorContract ];
