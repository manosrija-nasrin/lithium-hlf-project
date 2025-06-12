/* eslint-disable object-curly-spacing */
/**
 * @desc Doctor specific methods - API documentation in http://localhost:3002/ swagger editor.
 */

// Bring common classes into scope, and Fabric SDK network class
const { ROLE_DOCTOR, capitalize, getMessage, validateRole, ROLE_PATIENT } = require('../utils.js');
const network = require('../../donor-asset-transfer/application-javascript/app.js');
const network1 = require('../../receiver-asset-transfer/application-javascript/app.js');
const databaseRoutes = require('./databaseConnect');
const url = require('url');


/**
 * @param  {Request} req Body must be a json, role in the header and healthId in the url
 * @param  {Response} res A 200 response if patient is updated successfully else a 500 response with s simple message json
 * @description Updates an existing asset(patient medical details) in the ledger. This method can be executed only by the doctor.
 */
exports.updatePatientMedicalDetails = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  let args = req.body;
  args.healthId = req.params.healthId;
  args.changedBy = req.headers.username;
  args = [JSON.stringify(args)];
  // Set up and connect to Fabric Gateway
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:updatePatientMedicalDetails', args);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Successfully Updated Patient.'));
};

exports.screenPatient = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  const args = req.body;
  const { healthId, doctorId, dob, ...diseasesScreened } = args;
  const argsArr = [JSON.stringify({
    healthId: healthId,
    doctorId: doctorId,
    dob: dob,
    results: diseasesScreened,
    ...args, // spread operator to include other properties
  })];
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const responseBytes = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:screenPatient', argsArr);
  const response = JSON.parse(responseBytes.toString());
  console.debug('Response from network for screening patient', response);
  // check whether patient should be deferred : if yes, execute a PDC write
  // {"status":"success","deferPatient":true,"deferredStatus":"deferred permanently","deferredAt":"HOSP1-DOC32849",
  // "deferredReasons":["Coagulation Factor Deficiencies"],"deferredTenure":100000000}
  if ('deferPatient' in response && (response.deferPatient === true || response.deferPatient === 'true')) {
    console.log('About to defer patient');
    const deferPatientArgs = [JSON.stringify({
      healthId: args.healthId,
      username: response.deferredAt,
      deferredStatus: response.deferredStatus,
    }), JSON.stringify({
      transientData: {
        deferredReasons: response.deferredReasons,
        deferredTenure: response.deferredTenure,
      },
    }),
    ];

    const patientNetworkObj = await network.connectToNetwork(req.headers.username);

    const deferredResponseBytes = await network.invokePDCTransaction(patientNetworkObj, false,
      capitalize(userRole) + 'Contract:addPatientToBeDeferred', deferPatientArgs);
    console.debug('Response from network for adding pending defer operations', response.toString());
    const deferredResponse = JSON.parse(deferredResponseBytes.toString());

    if (deferredResponse.status === 'error') {
      console.error('Failed to defer patient with ID: ', args.healthId);
    } else {
      console.debug('Status', deferredResponse.status);
    }
  }
  (response.error || response.deferPatient === 'true') ? res.status(500).send(response.error) :
    res.status(200).send(getMessage(false, 'Screening successful.'));
};

exports.collectBlood = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  let args = req.body;
  const rawArgs = args;
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:bloodCollection', args);
  const parsedVAL = JSON.parse(response);
  const hospitalName = rawArgs.doctorId.startsWith('HOSP1') ? 'hospital 1' :
    (rawArgs.doctorId.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');
  await databaseRoutes.insertBlood(parsedVAL.bloodBagUnitNo, parsedVAL.bloodBagSegmentNo,
    hospitalName, parsedVAL.dateOfCollection, parsedVAL.dateOfExpiry, parsedVAL.quantity, parsedVAL.bloodGroup);
  // await databaseRoutes.insertDonatedBloodBagForCrossMatch(rawArgs.bloodBagUnitNo,
  // rawArgs.bloodBagSegmentNo, hospitalName, rawArgs.healthId);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Blood Collection successful.'));
};
/**
 * @param  {Request} req role in the header and hospitalId, doctorId in the url
 * @param  {Response} res A 200 response if doctor is present else a 500 response with a error json
 * @description This method retrives an existing doctor
 */
exports.getDoctorById = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  const hospitalId = parseInt(req.params.hospitalId);
  // Set up and connect to Fabric Gateway
  const userId = hospitalId === 1 ? 'hosp1admin' : hospitalId === 2 ? 'hosp2admin' : 'hosp3admin';
  const doctorId = req.params.doctorId;
  const networkObj = await network.connectToNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllDoctorsByHospitalId(networkObj, hospitalId);
  // Filter the result using the doctorId
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response.filter(
    function (response) {
      return response.id === doctorId;
    },
  )[0]);
};

exports.MOCapproval = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);

  const parsedUrl = url.parse(req.url, true);
  const doc = parsedUrl.query.doctorId;
  const hospitalName = doc.startsWith('HOSP1') ? 'Hospital 1' : (doc.startsWith('HOSP2') ? 'Hospital 2' : 'Hospital 3');


  const leftforapproval = await databaseRoutes.slips(hospitalName);
  const leftForApprovalSlipNos = leftforapproval.data.map((item) => item.AllocatedTo);

  const networkObj = await network1.connectToNetwork(req.headers.username);
  const resultArray = [];

  for (const slipNo of leftForApprovalSlipNos) {
    const args = [JSON.stringify({ slipNumber: slipNo })];
    const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:MOCapproval', args);
    console.log(response);
    if (response && !response.error && response !== 'null') {
      try {
        // let jsonResponse = JSON.parse(response);
        const responseString = response instanceof Buffer ? response.toString('utf8') : response;
        console.log('Response string:', responseString);
        const ans = JSON.parse(responseString);
        ans.slipNumber = slipNo;
        resultArray.push(ans);
      } catch (error) {
        console.error('Failed to parse response:', response);
      }
    }
  }

  res.status(200).send(resultArray);
};

exports.sendMOCapproval = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  let args = req.body;
  const doc = args.doctorId;
  const slipNumber = args.slipNumber;
  const hospitalName = doc.startsWith('HOSP1') ? 'hospital 1' : (doc.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:sendMOCapproval', args);
  console.log(response);
  // update database for final-dispatch
  await databaseRoutes.donateBloodRecord(slipNumber, hospitalName);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
};

exports.checkPatientStatus = async (req, res) => {
  const healthId = req.query.healthId;
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  try {
    const networkObj = await network.connectToNetwork(req.headers.username);
    const responseBytes = await network.invoke(networkObj, false,
      capitalize(userRole) + 'Contract:checkIfPatientIsDeferred',
      [JSON.stringify({ healthId: healthId })]);
    const responseJson = JSON.parse(responseBytes);
    console.log(responseJson);
    (responseJson.status === 'error') ? res.status(404).json('Patient not found') : res.status(200).send(responseJson);
  } catch (error) {
    console.error('Error checking patient status:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.requestAccessToSensitiveData = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_DOCTOR, ROLE_PATIENT], userRole, res);
    const args = req.body;
    const { healthId, doctorId, reason } = args;
    const hospitalName = doctorId.startsWith('HOSP1') ? 'Hospital 1' :
      (doctorId.startsWith('HOSP2') ? 'Hospital 2' : 'Hospital 1');
    const requestedTo = hospitalName === 'Hospital 1' ? 'HOSP1-SUP12226' : 'HOSP2-SUP12227';

    const dbResponse = await databaseRoutes.insertAccessRequest(
      healthId, doctorId, requestedTo, hospitalName, reason, 'View');
    if (dbResponse.error) {
      console.error('Error inserting access request into database:', dbResponse.error);
      res.status(500).json({ status: 'error', message: dbResponse.error });
    }
    console.log('Access request inserted into database successfully:', dbResponse);
    res.status(200).json({ status: 'success', message: 'Access request inserted into database successfully' });
  } catch (error) {
    console.error('Error requesting access to sensitive data:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
