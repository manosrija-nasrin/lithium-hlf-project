/* eslint-disable object-curly-spacing */
/**
 * @desc Doctor specific methods - API documentation in http://localhost:3002/ swagger editor.
 */

// Bring common classes into scope, and Fabric SDK network class
const { capitalize, validateRole, ROLE_SUPER } = require('../utils.js');
const network = require('../../donor-asset-transfer/application-javascript/app.js');
const databaseRoutes = require('./databaseConnect');


/**
 * @param  {Request} req Role in the header
 * @param  {Response} res 200 response with the json of all the assets(deferred patients) in the PDC
 * @description Retrieves all the assets(deferred patients) in the ledger
 */
exports.getDeferredPatients = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_SUPER], userRole, res);
  // Set up and connect to Fabric Gateway using the username in header
  let networkObj = await network.connectToSuperNetwork(req.headers.username);
  const usernameArgs = { username: userRole === ROLE_SUPER ? req.headers.username : '' };
  const getPendingBagsResponse = await network.invokePDCTransaction(networkObj, true,
    capitalize(userRole) + 'Contract:getAllPendingBags', [JSON.stringify(usernameArgs)]);
  try {
    const getPendingBagsResponseJson = JSON.parse(getPendingBagsResponse);
    console.debug(getPendingBagsResponseJson);
    if (getPendingBagsResponseJson.count > 0) {
      const deferPendingPatientsRequestArgs = { ...usernameArgs, pendingBags: getPendingBagsResponseJson.pendingBags };
      networkObj = await network.connectToSuperNetwork(req.headers.username);
      const deferPendingPatientsResponse = await network.invokePDCTransaction(networkObj, false,
        capitalize(userRole) + 'Contract:deferPendingPatients', [JSON.stringify(deferPendingPatientsRequestArgs)]);
      console.debug(JSON.parse(deferPendingPatientsResponse));
    }
    // Invoke the smart contract function
    networkObj = await network.connectToSuperNetwork(req.headers.username);
    const response = await network.invokePDCTransaction(networkObj, true,
      capitalize(userRole) + 'Contract:queryAllDeferredPatients', JSON.stringify(usernameArgs));
    // console.debug(JSON.parse(response));
    const parsedResponse = JSON.parse(response);
    res.status(200).send(parsedResponse);
  } catch (error) {
    res.status(500).send({ status: 'error', message: error });
  }
  // res.status(200s).send({"status": "failed"});
};

/**
 * @param  {Request} req role in the header and hospitalId, doctorId in the url
 * @param  {Response} res A 200 response if doctor is present else a 500 response with a error json
 * @description This method retrives an existing doctor
 */
exports.getSuperById = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_SUPER], userRole, res);
  // Set up and connect to Fabric Gateway
  const userId = 'superOrgadmin';
  const superId = req.params.superId;
  const networkObjSuper = await network.connectToSuperNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllSupers(networkObjSuper);
  console.log('Got all supers: ', response);
  // Filter the result using the superId
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response.filter(
    function (responseObj) {
      return responseObj.id === superId;
    },
  )[0]);
};

exports.checkPatientStatus = async (req, res) => {
  const healthId = req.query.healthId;
  const userRole = req.headers.role;
  await validateRole([ROLE_SUPER], userRole, res);
  const networkObj = await network.connectToNetwork(req.headers.username);
  const response = await network.invoke(networkObj, false,
    capitalize(userRole) + 'Contract:checkIfPatientIsDeferred',
    [JSON.stringify({ healthId: healthId })]);
  const responseJson = JSON.parse(response);
  console.log(responseJson);
  (responseJson.status === 'error') ? res.status(404).send('Patient not found') : res.status(200).send(responseJson);
};

exports.rejectAccessRequest = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_SUPER], userRole, res);
    const superId = req.params.superId;
    const { requestId } = req.body;

    await databaseRoutes.rejectAccessRequest(requestId, superId);
    res.status(200).send({ status: 'success', message: 'Access request rejected' });
  } catch (error) {
    console.error('Error in rejectAccessRequest:', error);
    res.status(500).send({ status: 'error', message: error.message });
  }
};

exports.approveAccessRequest = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_SUPER], userRole, res);
    const superId = req.params.superId;
    const { requestId } = req.body;

    const requestDetails = (await databaseRoutes.queryAccessRequestTableByRequestId(requestId))[0];

    const argsArr = [JSON.stringify({
      healthId: requestDetails.HealthId,
      superId: superId,
      requestor: requestDetails.Requestor,
      reason: requestDetails.Reason,
      requestedTo: requestDetails.RequestedTo,
    })];

    const networkObj = await network.connectToSuperNetwork(req.headers.username);
    const responseBytes = await network.invokePDCTransaction(networkObj, false,
      capitalize(userRole) + 'Contract:grantAccessToSensitiveData',
      argsArr);
    const response = JSON.parse(responseBytes);

    console.debug('Response from network for requesting access to sensitive data:', response);
    if (response.error) {
      console.error('Error requesting access to sensitive data:', response.error);
    } else if (response.status === 'success') {
      console.log('Access request response from network:', response);

      await databaseRoutes.approveAccessRequest(requestId, superId);
      res.status(200).send({ status: 'success', message: 'Access request approved' });
    }
  } catch (error) {
    console.error('Error in requestApproval:', error);
    res.status(500).send({ status: 'error', message: error.message });
  }
};

exports.getAccessRequests = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_SUPER], userRole, res);

    const superId = req.query.superId;

    const pendingRequests = await databaseRoutes.queryPendingAccessRequestTableByRequestedTo(superId);
    const resultArray = [];

    for (const request of pendingRequests) {
      const requestId = request.RequestId;
      const requestor = request.Requestor;
      const healthId = request.HealthId;
      const requestedTo = request.RequestedTo;
      const hospitalName = request.HospitalName;
      const reason = request.Reason;
      const status = request.Status;

      resultArray.push({
        requestId: requestId,
        requestor: requestor,
        healthId: healthId,
        requestedTo: requestedTo,
        hospitalName: hospitalName,
        reason: reason,
        status: status,
      });
    }

    res.status(200).send(resultArray);
  } catch (error) {
    console.error('Error in getAccessRequests:', error);
    res.status(500).send({ status: 'error', message: error.message });
  }
}