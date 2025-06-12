/**
 * @desc Admin specific methods - API documentation in http://localhost:3002/ swagger editor.
 */

// Bring common classes into scope, and Fabric SDK network class
const { ROLE_ADMIN, ROLE_DOCTOR, ROLE_SUPER, ROLE_TECHNICIAN, capitalize,
  getMessage, validateRole, createRedisClient } = require('../utils.js');
const network = require('../../donor-asset-transfer/application-javascript/app.js');

exports.createPatient = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_ADMIN], userRole, res);
  // Set up and connect to Fabric Gateway using the username in header
  const networkObj = await network.connectToNetwork(req.headers.username);

  // Generally we create patient id by ourself so if patient id is not present in the request then fetch last id
  // from ledger and increment it by one. Since we follow patient id pattern as "PID0", "PID1", ...
  // 'slice' method omits first three letters and take number
  if (!('healthId' in req.body) || req.body.healthId === null || req.body.healthId === '') {
    // const generatedHealthId = await network.invoke(networkObj, true, capitalize(userRole) + 'Contract:generateHealthId');
    // const lastId = await network.invoke(networkObj, true, capitalize(userRole) + 'Contract:getLatestPatientId');
    // req.body.healthId = 'PID' + (parseInt(lastId.slice(3)) + 1);
    req.body.healthId = '';
  }

  // When password is not provided in the request while creating a patient record.
  if (!('password' in req.body) || req.body.password === null || req.body.password === '') {
    req.body.password = Math.random().toString(36).slice(-8);
  }

  req.body.changedBy = req.headers.username;

  // The request present in the body is converted into a single json string
  const data = JSON.stringify(req.body);
  const args = [data];
  // Invoke the smart contract function
  let healthId;
  const createPatientRes = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:createPatient', args);
  const createPatientResJson = JSON.parse(createPatientRes);
  if (createPatientResJson.state && createPatientResJson.state === 'error') {
    res.status(400).send(res.error);
  } else if (createPatientResJson.state && createPatientResJson.state === 'success') {
    healthId = createPatientResJson.healthId;
    console.log('Patient ID:', healthId);
  }

  if (!healthId) {
    res.status(500).send('Error: Patient ID not generated.');
  }

  // Enrol and register the user with the CA and adds the user to the wallet.
  const userData = JSON.stringify({ hospitalId: (req.headers.username).slice(4, 5), userId: healthId, ...data });
  const registerUserRes = await network.registerUser(userData);
  if (registerUserRes.error && healthId) {
    await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:deletePatient', healthId);
    res.send(registerUserRes.error);
  }

  const dat = JSON.parse(data);
  let allDoctors = []; let allSupers = [];
  // Set up and connect to Fabric Gateway
  const networkObjOne = await network.connectToNetwork('hosp1admin');
  const networkObjTwo = await network.connectToNetwork('hosp2admin');
  const networkObjSuper = await network.connectToNetwork('superOrgadmin');

  // grant permissions to all doctors and supers
  // if (dat.changedBy === 'hosp1admin') {
  const doctorsOne = await network.getAllDoctorsByHospitalId(networkObjOne, 1);
  allSupers = await network.getAllSupers(networkObjSuper);
  // }
  // else if (dat.changedBy === 'hosp2admin') {
  const doctorsTwo = await network.getAllDoctorsByHospitalId(networkObjTwo, 2);
  // }

  allDoctors = allDoctors.concat(doctorsOne);
  allDoctors = allDoctors.concat(doctorsTwo);

  // console.debug(typeof allSupers);
  // console.debug(allSupers);

  let response;
  // Invoke the smart contract function
  for (const doc of allDoctors) {
    if (!doc.id) {
      console.error('Doctor ID is undefined for a doctor.');
      continue;
    }

    let args = { healthId: healthId, doctorId: doc.id };
    args = [JSON.stringify(args)];
    response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToDoctor', args);

    if (response.error) {
      res.status(500).send(response.error);
    }
  }

  for (const sup of allSupers) {
    if (!sup.id) {
      console.error('Super ID is undefined for a super.');
      continue;
    }

    let args = { healthId: healthId, superId: sup.id };  // grant access to supers
    args = [JSON.stringify(args)];
    response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToSuper', args);

    if (response.error) {
      res.status(500).send(response.error);
    }
  }

  res.status(201).send(getMessage(false, 'Successfully registered Patient.', healthId, req.body.password));
};

/**
 * @param  {Request} req Body must be a doctor json and role in the header
 * @param  {Response} res 201 response if asset is created else 400 with a simple json message
 * @description Creates a doctor as an user adds the doctor to the wallet
 */
exports.createDoctor = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  let { hospitalId, username, password } = req.body;
  hospitalId = parseInt(hospitalId);

  await validateRole([ROLE_ADMIN], userRole, res);

  req.body.userId = username;
  req.body.role = ROLE_DOCTOR;
  req.body = JSON.stringify(req.body);
  let args = [req.body];
  // Create a redis client and add the doctor to redis
  const redisClient = createRedisClient(hospitalId);
  (await redisClient).SET(username, password);
  // Enrol and register the user with the CA and adds the user to the wallet.
  let response = await network.registerUser(args);
  if (response.error) {
    (await redisClient).DEL(username);
    res.status(400).send(response.error);
  }

  const networkObj = await network.connectToNetwork(req.headers.username);
  const patients = await network.invoke(networkObj, true, capitalize(userRole) + 'Contract:queryAllPatients',
    userRole === ROLE_DOCTOR ? req.headers.username : '');
  const parsedPatients = await JSON.parse(patients);

  for (const patient of parsedPatients) {
    if (!patient.healthId) {
      console.error('Patient ID is undefined for a patient.');
      continue; // Skip to the next iteration
    }

    args = { healthId: patient.healthId, doctorId: username };
    args = [JSON.stringify(args)];
    response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToDoctor', args);

    if (response.error) {
      res.status(500).send(response.error);
    }
  }

  res.status(201).send(getMessage(false, response, username, password));
};

/**
 * @param  {Request} req Body must be a super json and role in the header
 * @param  {Response} res 201 response if asset is created else 400 with a simple json message
 * @description Creates a super as an user adds the doctor to the wallet
 */
exports.createSuper = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  let { hospitalId, username, password } = req.body;
  hospitalId = parseInt(hospitalId);

  // only admin can create super roles
  await validateRole([ROLE_ADMIN], userRole, res);

  req.body.userId = username;
  req.body.role = ROLE_SUPER;
  req.body = JSON.stringify(req.body);

  let args = [req.body];
  // Create a redis client and add the doctor to redis
  const redisClient = createRedisClient(hospitalId);
  (await redisClient).SET(username, password);
  // Enrol and register the user with the CA and adds the user to the wallet.
  let response = await network.registerUser(args);
  if (response.error) {
    (await redisClient).DEL(username);
    res.status(400).send(response.error);
  }

  const networkObj = await network.connectToNetwork('superOrgadmin');
  const patients = await network.invoke(networkObj, true, capitalize(userRole) + 'Contract:queryAllPatients',
    userRole === ROLE_SUPER ? req.headers.username : '');
  const parsedPatients = await JSON.parse(patients);

  for (const patient of parsedPatients) {
    if (!patient.healthId) {
      console.error('Patient ID is undefined for a patient.');
      continue; // Skip to the next iteration
    }

    args = { healthId: patient.healthId, doctorId: username };
    args = [JSON.stringify(args)];
    response = await network.invoke(networkObj, false, 'PatientContract:grantAccessToDoctor', args);

    if (response.error) {
      res.status(500).send(response.error);
    }
  }

  res.status(201).send(getMessage(false, response, username, password));
};

/**
 * @param  {Request} req Role in the header and hospitalId in the url
 * @param  {Response} res 200 response with array of all doctors else 500 with the error message
 * @description Get all the doctors of the mentioned hospitalId
 */
exports.getSupersByHospitalId = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_ADMIN], userRole, res);
  // Set up and connect to Fabric Gateway
  userId = 'superOrgadmin';

  const networkObjSuper = await network.connectToNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllSupers(networkObjSuper);

  console.debug('Supers:', response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
};

/**
 * @param  {Request} req Role in the header and hospitalId in the url
 * @param  {Response} res 200 response with array of all doctors else 500 with the error message
 * @description Get all the doctors of the mentioned hospitalId
 */
exports.getDoctorsByHospitalId = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_ADMIN], userRole, res);
  // Set up and connect to Fabric Gateway
  const hospitalId = parseInt(req.params.hospitalId);
  // Set up and connect to Fabric Gateway
  const userId = hospitalId === 1 ? 'hosp1admin' : hospitalId === 2 ? 'hosp2admin' : 'superOrgadmin';

  const networkObj = await network.connectToNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllDoctorsByHospitalId(networkObj, hospitalId);

  console.debug('Doctors:', response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
};

/**
 * @param  {Request} req Role in the header
 * @param  {Response} res 200 response with the json of all the assets(patients) in the ledger
 * @description Retrieves all the assets(patients) in the ledger
 */
exports.getAllPatients = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_ADMIN, ROLE_DOCTOR], userRole, res);
  // Set up and connect to Fabric Gateway using the username in header
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, true, capitalize(userRole) + 'Contract:queryAllPatients',
    userRole === ROLE_DOCTOR ? req.headers.username : '');

  // grant permissions to all doctors and supers
  const parsedResponse = await JSON.parse(response);
  res.status(200).send(parsedResponse);
};

exports.getTechniciansByHospitalId = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_ADMIN], userRole, res);
  const hospitalId = parseInt(req.params.hospitalId);
  // Set up and connect to Fabric Gateway
  userId = hospitalId === 1 ? 'hosp1admin' : hospitalId === 2 ? 'hosp2admin' : 'superOrgadmin';
  const networkObj = await network.connectToNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllTechniciansByHospitalId(networkObj, hospitalId);

  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
};

exports.createTechnician = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  let { hospitalId, username, password } = req.body;
  hospitalId = parseInt(hospitalId);

  await validateRole([ROLE_ADMIN], userRole, res);

  req.body.userId = username;
  req.body.role = ROLE_TECHNICIAN;
  req.body = JSON.stringify(req.body);
  const args = [req.body];
  // Create a redis client and add the doctor to redis
  const redisClient = createRedisClient(hospitalId);
  (await redisClient).SET(username, password);
  // Enrol and register the user with the CA and adds the user to the wallet.
  const response = await network.registerUser(args);
  if (response.error) {
    (await redisClient).DEL(username);
    res.status(400).send(response.error);
  }
  res.status(201).send(getMessage(false, response, username, password));
};

exports.deleteUser = async (req, res) => {
  try {
    // User role from the request header is validated
    const userRole = req.headers.role;
    await validateRole([ROLE_ADMIN], userRole, res);

    // Extract adminId and doctorId from the request parameters
    const { adminId, Id } = req.params;
    console.log(adminId);
    console.log(Id);
    // Check if adminId and doctorId are present
    if (!adminId || !Id) {
      return res.status(400).json({ error: 'AdminId and Id are required' });
    }

    // Perform deletion logic here, such as deleting the doctor from the Redis database
    const hospitalId = adminId.substring(4, 5);
    const redisClient = createRedisClient(parseInt(hospitalId)); // Assuming adminId is used to select the Redis database
    (await redisClient).DEL(Id); // Delete the doctor using the doctorId

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ error: 'An unexpected error occurred while deleting the doctor' });
  }
};
