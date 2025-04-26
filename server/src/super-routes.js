/**
 * @desc Doctor specific methods - API documentation in http://localhost:3002/ swagger editor.
 */

// Bring common classes into scope, and Fabric SDK network class
const { capitalize, validateRole, ROLE_SUPER } = require('../utils.js');
const network = require('../../donor-asset-transfer/application-javascript/app.js');

/**
 * @param  {Request} req Role in the header
 * @param  {Response} res 200 response with the json of all the assets(deferred donors) in the PDC
 * @description Retrieves all the assets(deferred donors) in the ledger
 */
exports.getDeferredDonors = async (req, res) => {
	// User role from the request header is validated
	const userRole = req.headers.role;
	await validateRole([ROLE_SUPER], userRole, res);
	// Set up and connect to Fabric Gateway using the username in header
	let networkObj = await network.connectToSuperNetwork(req.headers.username);
	const usernameArgs = { username: userRole === ROLE_SUPER ? req.headers.username : '' };
	const getPendingBagsResponse = await network.invokePDCTransaction(networkObj, true, capitalize(userRole) + 'Contract:getAllPendingBags', [JSON.stringify(usernameArgs)]);
	try {
		const getPendingBagsResponseJson = JSON.parse(getPendingBagsResponse);
		console.debug(getPendingBagsResponseJson);
		if (getPendingBagsResponseJson.count > 0) {
			const deferPendingDonorsRequestArgs = { ...usernameArgs, pendingBags: getPendingBagsResponseJson.pendingBags };
			networkObj = await network.connectToSuperNetwork(req.headers.username);
			const deferPendingDonorsResponse = await network.invokePDCTransaction(networkObj, false, capitalize(userRole) + 'Contract:deferPendingDonors', [JSON.stringify(deferPendingDonorsRequestArgs)]);
			console.debug(JSON.parse(deferPendingDonorsResponse));
		}
		// Invoke the smart contract function
		networkObj = await network.connectToSuperNetwork(req.headers.username);
		const response = await network.invokePDCTransaction(networkObj, true, capitalize(userRole) + 'Contract:queryAllDeferredDonors', JSON.stringify(usernameArgs));
		// console.debug(JSON.parse(response));
		const parsedResponse = JSON.parse(response);
		res.status(200).send(parsedResponse);
	} catch (error) {
		res.status(500).send({ status: "error", message: error });
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
	console.log("Got all supers: ", response);
	// Filter the result using the superId
	(response.error) ? res.status(500).send(response.error) : res.status(200).send(response.filter(
		function (responseObj) {
			return responseObj.id === superId;
		},
	)[0]);
};
