/**
 * @desc Doctor specific methods - API documentation in http://localhost:3002/ swagger editor.
 */

// Bring common classes into scope, and Fabric SDK network class
const { ROLE_DOCTOR, capitalize, getMessage, validateRole } = require('../utils.js');
const network = require('../../donor-asset-transfer/application-javascript/app.js');
const network1 = require('../../receiver-asset-transfer/application-javascript/app.js');
const databaseRoutes = require('./databaseConnect');
const url = require('url');


/**
 * @param  {Request} req Body must be a json, role in the header and donorId in the url
 * @param  {Response} res A 200 response if donor is updated successfully else a 500 response with s simple message json
 * @description Updates an existing asset(donor medical details) in the ledger. This method can be executed only by the doctor.
 */
exports.updateDonorMedicalDetails = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  let args = req.body;
  args.donorId = req.params.donorId;
  args.changedBy = req.headers.username;
  args = [JSON.stringify(args)];
  // Set up and connect to Fabric Gateway
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:updateDonorMedicalDetails', args);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Successfully Updated Donor.'));
};

exports.screenDonor = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  let args = req.body;
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:screenDonor', args);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Screening successful.'));
}

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
  let parsedVAL = JSON.parse(response);
  // console.log("HELLO" + parsedVAL);
  const hospitalName = rawArgs.doctorId.startsWith("HOSP1") ? "hospital 1" : (rawArgs.doctorId.startsWith("HOSP2") ? "hospital 2" : "hospital 3");
  await databaseRoutes.insertBlood(parsedVAL.bloodBagUnitNo, parsedVAL.bloodBagSegmentNo, parsedVAL.hospName, parsedVAL.dateOfCollection, parsedVAL.dateOfExpiry, parsedVAL.quantity, parsedVAL.bloodGroup);
  await databaseRoutes.insertDonatedBloodBagForCrossMatch(rawArgs.bloodBagUnitNo, rawArgs.bloodBagSegmentNo, hospitalName, rawArgs.donorId);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Blood Collection successful.'));
}
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
  console.log(doc);
  const hospitalName = doc.startsWith("HOSP1") ? "hospital 1" : (doc.startsWith("HOSP2") ? "hospital 2" : "hospital 3");


  let leftforapproval = await databaseRoutes.slips(hospitalName);
  let leftForApprovalSlipNos = leftforapproval.data.map(item => item.AllocatedTo);

  const networkObj = await network1.connectToNetwork(req.headers.username);
  const resultArray = [];

  for (let slipNo of leftForApprovalSlipNos) {
    let args = { slipNumber: slipNo };
    console.log(args);
    args = [JSON.stringify(args)];
    const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:MOCapproval', args);
    console.log(response);
    if (response && !response.error && response !== 'null') {
      try {
        //let jsonResponse = JSON.parse(response);

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
}

exports.sendMOCapproval = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_DOCTOR], userRole, res);
  let args = req.body;
  const doc = args.doctorId;
  const slipNumber = args.slipNumber;
  const hospitalName = doc.startsWith("HOSP1") ? "hospital 1" : (doc.startsWith("HOSP2") ? "hospital 2" : "hospital 3");
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:sendMOCapproval', args);
  console.log(response);
  //update database for final-dispatch
  await databaseRoutes.donateBloodRecord(slipNumber, hospitalName);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
}

