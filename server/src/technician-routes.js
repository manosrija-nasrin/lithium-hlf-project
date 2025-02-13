/**
 * @desc Technician specific methods - API documentation in http://localhost:3002/ swagger editor.
 */

// Bring common classes into scope, and Fabric SDK network class
const { ROLE_TECHNICIAN, capitalize, getMessage, getBagId, validateRole } = require('../utils.js');
const network = require('../../donor-asset-transfer/application-javascript/app.js');
const network1 = require('../../receiver-asset-transfer/application-javascript/app.js');
const databaseRoutes = require('./databaseConnect');
const url = require('url');

exports.readBloodBag = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  const rawArgs = req.body;
  console.debug(rawArgs);
  let args = [JSON.stringify(rawArgs)];
  const networkObj = await network.connectToNetwork(req.headers.username);
  const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:readBag', args);
  // const response1 = await network.invoke(networkObj, true, capitalize(userRole) + 'Contract:queryDonorsForBagId', args);
  console.log(response);
  // console.debug("For bag ", rawArgs.bloodBagSegmentNo, response1.toString());
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
  // res.status(200).send(response1);
}

exports.bloodTestOfBloodBags = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  args = [JSON.stringify(args)];
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:inputBloodTestValues', args);
  let x = req.body;
  let parsedVAL = JSON.parse(response);
  if (parsedVAL.healthy === 'true') {
    await databaseRoutes.insertBlood(x.bloodBagUnitNo, x.bloodBagSegmentNo, parsedVAL.hospName, parsedVAL.dateOfCollection, parsedVAL.dateOfExpiry, parsedVAL.quantity, parsedVAL.bloodGroup);
  }
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Blood Test successful.'));
}

exports.bloodRequest = async (req, res) => {
  console.log("TECH ROUTES");

  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);

  let args = req.body;
  let num = Math.ceil(args.quantity / 350);
  let hospName = args.technicianId.startsWith("HOSP1") ? "hospital 1" :
    args.technicianId.startsWith("HOSP2") ? "hospital 2" : "hospital 3";

  const response = await databaseRoutes.getBloodByExpiry(hospName, args.bloodGroup, num);


  if (response.length < num) {
    console.log("INSUFFICIENT");
    res.status(200).json({ message: "Insufficient blood available." });
  } else {
    args.bags = response;
    console.log(args);
    args = [JSON.stringify(args)];

    try {
      const networkObj = await network1.connectToNetwork(req.headers.username);
      let resp = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:createReceiver', args);
      args = JSON.parse(args);
      for (let i = 0; i < response.length; i++) {
        await databaseRoutes.allocateBlood(response[i]["BagUnitNo"], response[i]["BagSegmentNo"], hospName, args.slipNumber);
      }

      res.status(200).json({ message: "Blood request processed successfully." });
    } catch (error) {
      console.error("Error processing blood request:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  }
}

exports.readAllocatedBloodBag = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:readBagsForSlipNumber', args);
  console.log(response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);

}

exports.checkBloodAvailability = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  const parsedUrl = url.parse(req.url, true);
  const tech = parsedUrl.query.technicianId;
  const hospitalId = tech.startsWith("HOSP1") ? "hospital 1" : (tech.startsWith("HOSP2") ? "hospital 2" : "hospital 3");
  const bloodGroup = decodeURIComponent(req.query.bloodGroup);
  try {
    const bloodResult = await databaseRoutes.getBloodByExpiry(hospitalId, bloodGroup);
    res.status(200).json({ success: true, message: 'Blood availability fetched successfully', data: bloodResult });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch blood availability', error: error.message });
  }
}

exports.allocateBag = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  const tech = args.technicianId;
  const hospitalName = tech.startsWith("HOSP1") ? "hospital 1" : (tech.startsWith("HOSP2") ? "hospital 2" : "hospital 3");

  try {
    await databaseRoutes.allocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospitalName, args.aadhar);
    res.status(200).json({ success: true, message: "Blood bag selected successfully" });
  } catch (error) {
    console.error("Error allocating blood bag:", error);
    res.status(500).json({ success: false, message: "Failed to select blood bag", error: error.message });
  }
}

exports.crossMatchResults = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  const hospName = args.technicianId.startsWith("HOSP1") ? "hospital 1" : (args.technicianId.startsWith("HOSP2") ? "hospital 2" : "hospital 3");
  const bloodBagUnitNo = args.bloodBagUnitNo;
  const bloodBagSegmentNo = args.bloodBagSegmentNo;

  let r1 = await databaseRoutes.bagInfo(bloodBagUnitNo, bloodBagSegmentNo, hospName);
  console.log(r1);

  r1 = r1.data;
  args.slipNumber = r1[0]["AllocatedTo"];
  args.bloodGroup = r1[0]["BloodGroup"];
  //args.bloodGroup="AB+";
  y = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:crossmatchCheck', y);
  const responseString = response instanceof Buffer ? response.toString('utf8') : response;
  console.log('Response string:', responseString);
  const ans = JSON.parse(responseString);
  console.log(responseString);

  if (ans.crossmatch === 'false') {
    console.log("CROSS MATCH FAILED FOR THIS BAG. FINDING NEW BAG");
    const bagId = getBagId(bloodBagUnitNo, bloodBagSegmentNo);

    let reasons = [];

    if (args.malaria == "true") reasons.push("Malaria");
    if (args.syphilis == "true") reasons.push("Syphilis");
    if (args.hcv == "true") reasons.push("HCV");
    if (args.hepatitisB == "true") reasons.push("Hepatitis B");
    if (args.ABORhGrouping == "false") reasons.push("ABORh Grouping");
    if (args.irregularAntiBody == "true") reasons.push("Irregular Antibodies");

    // search for bagId in donor history
    // let donorId;
    // let blockedDonorResponse = await databaseRoutes.getDonorOfBloodBag(bloodBagUnitNo, bloodBagSegmentNo, hospName);
    // if (blockedDonorResponse.length > 0) {
    //   donorId = blockedDonorResponse[0]["DonatedBy"];
    // } else {
    //   donorId = "";
    //   console.error("Donor not found");
    // }

    const blockDonorArgs = [JSON.stringify({ bloodBagUnitNo: bloodBagUnitNo, bloodBagSegmentNo: bloodBagSegmentNo, username: req.headers.username }), JSON.stringify({ transientData: { reasons: reasons } })];
    // Set up and connect to Fabric Gateway using the username in header
    let donorNetworkObj = await network.connectToNetwork(req.headers.username);

    const response = await network.invoke(donorNetworkObj, false, capitalize(userRole) + 'Contract:addBagsToBeBlocked', blockDonorArgs);
    console.debug("Response from network for adding pending block ooperations", response.toString());
    const blockedResponse = JSON.parse(response.toString());

    if (blockedResponse.status === "error") {
      console.error("Failed to block donor of bagId: ", bagId);
    } else {
      console.debug("Status", blockedResponse.status);
      await databaseRoutes.updateCrossMatchStatus(bloodBagUnitNo, bloodBagSegmentNo, hospName, ans.crossmatch);
      console.debug("Successfully done");
    }

    //res.status(200).json({ success: false, message: "Blood Cross Match failed. Finding new bag..." });
    const r2 = await databaseRoutes.getBloodByExpiry(hospName, args.bloodGroup, 1);
    console.log(r2);

    if (r2.length == 0) {
      console.log("NOT ENOUGH BAGS. ASK RECEIVER TO GO TO SOME OTHER HOSP");
      res.status(200).json({ success: false, message: "Not Enough Blood Bags for Receiver!!" });
      //Need to implement later
      console.log("DE-SELECT OTHER BAGS SELECTED FOR THE RECEIVER");
    }
    else {
      args.newAllocation = r2;
      console.log(args.newAllocation);
      y = [JSON.stringify(args)];
      const r3 = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:replaceReceiver', y);
      await databaseRoutes.allocateBlood(r2[0]["BagUnitNo"], r2[0]["BagSegmentNo"], hospName, args.slipNumber);
      res.status(200).json({ success: false, message: "Blood Cross-match Unsuccessful!! Selected new bag." });
    }
    await databaseRoutes.deAllocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospName);
  }
  else {
    res.status(200).json({ success: true, message: "Blood Cross Match successful" });
  }
}

exports.confirmbloodReceival = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  const tech = args.technicianId;
  const hospitalName = tech.startsWith("HOSP1") ? "hospital 1" : (tech.startsWith("HOSP2") ? "hospital 2" : "hospital 3");

  try {
    if (args.confirmation === 'false') {
      await databaseRoutes.deAllocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospitalName);
      res.status(200).json({ success: true, message: "Blood bag deallocated successfully" });
    } else {
      const responseFromDB = await databaseRoutes.bagExists(args.bloodBagUnitNo, args.bloodBagSegmentNo, args.aadharOfReceipient);
      if (responseFromDB.data.length === 0) {
        await databaseRoutes.deAllocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospitalName);
        res.status(404).json({ success: false, message: "Blood bag not found in the database" });
      } else {
        args.bloodGroup = responseFromDB.data[0].BloodGroup;
        args.quantity = responseFromDB.data[0].Quantity;
        args.orgName = responseFromDB.data[0].HospitalName;
        args = [JSON.stringify(args)];

        const networkObj = await network1.connectToNetwork(req.headers.username);
        const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:createBag', args);
        args = JSON.parse(args);
        await databaseRoutes.deleteBloodRecord(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospitalName);
        if (response.error) {
          res.status(500).json({ success: false, message: "Failed to create bag", error: response.error });
        } else {
          res.status(200).json({ success: true, message: "Blood Cross Match successful" });
        }
      }
    }
  } catch (error) {
    console.error("Error confirming blood receival:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}


exports.readReceiverBloodBag = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:readBag', args);
  console.log(response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
}

exports.LTapproval = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);

  const parsedUrl = url.parse(req.url, true);
  const tech = parsedUrl.query.technicianId;

  const hospitalName = tech.startsWith("HOSP1") ? "hospital 1" : (tech.startsWith("HOSP2") ? "hospital 2" : "hospital 3");


  let leftforapproval = await databaseRoutes.slips(hospitalName);
  let leftForApprovalSlipNos = leftforapproval.data.map(item => item.AllocatedTo);

  const networkObj = await network1.connectToNetwork(req.headers.username);
  const resultArray = [];

  for (let slipNo of leftForApprovalSlipNos) {
    let args = { slipNumber: slipNo };
    console.log(args);
    args = [JSON.stringify(args)];
    const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:LTapproval', args);
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

exports.sendLTapproval = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:sendLTapproval', args);
  console.log(response);
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
}


exports.getTechnicianById = async (req, res) => {
  // User role from the request header is validated
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  const hospitalId = parseInt(req.params.hospitalId);
  // Set up and connect to Fabric Gateway
  const userId = hospitalId === 1 ? 'hosp1admin' : hospitalId === 2 ? 'hosp2admin' : 'hosp3admin';
  const technicianId = req.params.technicianId;
  const networkObj = await network.connectToNetwork(userId);
  // Use the gateway and identity service to get all users enrolled by the CA
  const response = await network.getAllTechniciansByHospitalId(networkObj, hospitalId);
  // Filter the result using the technicianId
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response.filter(
    function (response) {
      return response.id === technicianId;
    },
  )[0]);


};
