/* eslint-disable object-curly-spacing */
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
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_TECHNICIAN], userRole, res);
    const rawArgs = req.body;
    console.debug(rawArgs);
    const args = [JSON.stringify(rawArgs)];
    const networkObj = await network.connectToNetwork(req.headers.username);
    const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:readBag', args);
    // const response1 = await network.invoke(networkObj, true, capitalize(userRole) + 'Contract:queryPatientsForBagId', args);
    console.log(response);
    // console.debug("For bag ", rawArgs.bloodBagSegmentNo, response1.toString());
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
  } catch (error) {
    console.error('Error in readBloodBag:', error);
    res.status(500).send({ error: 'An error occurred while reading the blood bag.' });
  }
  // res.status(200).send(response1);
};

exports.bloodTestOfBloodBags = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  args = [JSON.stringify(args)];
  const networkObj = await network.connectToNetwork(req.headers.username);
  // Invoke the smart contract function
  const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:inputBloodTestValues', args);
  const x = req.body;
  const parsedVAL = JSON.parse(response);
  if (parsedVAL.healthy === 'true') {
    await databaseRoutes.insertBlood(x.bloodBagUnitNo, x.bloodBagSegmentNo, parsedVAL.hospName,
      parsedVAL.dateOfCollection, parsedVAL.dateOfExpiry, parsedVAL.quantity, parsedVAL.bloodGroup);
  }
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Blood Test successful.'));
};

exports.bloodRequest = async (req, res) => {
  console.log('TECH ROUTES');

  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);

  let args = req.body;
  const num = Math.ceil(args.quantity / 350);
  const hospName = args.technicianId.startsWith('HOSP1') ? 'hospital 1' :
    args.technicianId.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3';

  const response = await databaseRoutes.getBloodByExpiry(hospName, args.bloodGroup, num);


  if (response.length < num) {
    console.log('INSUFFICIENT');
    res.status(200).json({ message: 'Insufficient blood available.' });
  } else {
    args.bags = response;
    console.log(args);
    args = [JSON.stringify(args)];

    try {
      const networkObj = await network1.connectToNetwork(req.headers.username);
      const resp = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:createReceiver', args);
      args = JSON.parse(args);
      for (let i = 0; i < response.length; i++) {
        await databaseRoutes.allocateBlood(response[i].BagUnitNo, response[i].BagSegmentNo, hospName, args.slipNumber);
      }

      res.status(200).json({ message: 'Blood request processed successfully.' });
    } catch (error) {
      console.error('Error processing blood request:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  }
};

exports.readAllocatedBloodBag = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  console.log(args);
  args = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:readBagsForSlipNumber', args);
  console.log(response);
  const patientNetworkObj = await network.connectToNetwork(req.headers.username);

  // const bagsResponse = await network.invoke(patientNetworkObj, false, capitalize(userRole) + 'Contract:testDeletion', args);
  // console.debug("Response from network for adding pending defer operations", bagsResponse.toString());
  (response.error) ? res.status(500).send(response.error) : res.status(200).send(response);
};

exports.checkBloodAvailability = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  const parsedUrl = url.parse(req.url, true);
  const tech = parsedUrl.query.technicianId;
  const hospitalId = tech.startsWith('HOSP1') ? 'hospital 1' : (tech.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');
  const bloodGroup = decodeURIComponent(req.query.bloodGroup);
  try {
    const bloodResult = await databaseRoutes.getBloodByExpiry(hospitalId, bloodGroup);
    res.status(200).json({ success: true, message: 'Blood availability fetched successfully', data: bloodResult });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch blood availability', error: error.message });
  }
};

exports.allocateBag = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  const args = req.body;
  const tech = args.technicianId;
  const hospitalName = tech.startsWith('HOSP1') ? 'hospital 1' : (tech.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');

  try {
    await databaseRoutes.allocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospitalName, args.aadhar);
    res.status(200).json({ success: true, message: 'Blood bag selected successfully' });
  } catch (error) {
    console.error('Error allocating blood bag:', error);
    res.status(500).json({ success: false, message: 'Failed to select blood bag', error: error.message });
  }
};

exports.addHealthReportResults = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_TECHNICIAN], userRole, res);
    const args = req.body;
    const { healthId, technicianId, ...diseasesTested } = args;

    const networkObj = await network.connectToNetwork(req.headers.username);

    const argsArr = [JSON.stringify({
      healthId: healthId,
      technicianId: technicianId,
      results: diseasesTested,
      ...args, // spread operator to include other properties
    })];

    const responseBytes = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:addToMedicalHistory', argsArr);
    const response = JSON.parse(responseBytes);
    console.debug(response);

    if (response.status !== undefined && response.status === 'success') {
      console.log(response.deferPatient);
      // add deferred records to the pending PDC
      if (response.deferPatient === true || response.deferPatient === 'true') {
        const deferPatientArgs = [JSON.stringify({
          healthId: healthId,
          username: req.headers.username,
          deferredStatus: response.deferredStatus,
          deferredAt: response.deferredAt,
        }),
        JSON.stringify({
          transientData: {
            deferredReasons: response.deferredReasons,
            deferredTenure: response.deferredTenure,
            results: diseasesTested,
          },
        }),
        ];
        // Set up and connect to Fabric Gateway using the username in header
        const patientNetworkObj = await network.connectToNetwork(req.headers.username);

        const deferredResponseBytes = await network.invokePDCTransaction(patientNetworkObj, false,
          capitalize(userRole) + 'Contract:addPendingAlarmingHistory', deferPatientArgs);

        console.debug('Response from network for adding pending defer operations', deferredResponseBytes.toString());
        const deferredResponse = JSON.parse(deferredResponseBytes.toString());

        if (deferredResponse.status === 'error') {
          console.error('Failed to defer patient with health ID: ', args.healthId);
        } else if (deferredResponse.status === 'success') {
          console.debug('Status', deferredResponse.status);
          console.debug('Successfully done');
        }
      } else {
        const deferPatientArgs = [JSON.stringify({
          healthId: healthId,
          username: req.headers.username,
          deferredStatus: response.deferredStatus,
          deferredAt: response.deferredAt,
        }),
        JSON.stringify({
          transientData: {
            deferredReasons: null,
            deferredTenure: response.deferredTenure,
            results: diseasesTested,
          },
        }),
        ];
        // Set up and connect to Fabric Gateway using the username in header
        const patientNetworkObj = await network.connectToNetwork(req.headers.username);

        const deferredResponseBytes = await network.invokePDCTransaction(patientNetworkObj, false,
          capitalize(userRole) + 'Contract:addPendingAlarmingHistory', deferPatientArgs);

        console.debug('Response from network for adding pending defer operations', deferredResponseBytes.toString());
        const deferredResponse = JSON.parse(deferredResponseBytes.toString());

        if (deferredResponse.status === 'error') {
          console.error('Failed to defer patient with health ID: ', args.healthId);
        } else if (deferredResponse.status === 'success') {
          console.debug('Status', deferredResponse.status);
          console.debug('Successfully done');
        }
      }
      res.status(200).json({ status: 'success', message: 'Medical History updated successfully' });
    } else {
      res.status(500).json({ status: 'error', error: response.error });
    }
  } catch (err) {
    console.error(err);
  }
};

exports.addTtiResults = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_TECHNICIAN], userRole, res);
    const args = req.body;
    const { technicianId, healthId, ...diseasesTested } = args;

    const hospName = technicianId.startsWith('HOSP1') ? 'Hospital 1' :
      (technicianId.startsWith('HOSP2') ? 'Hospital 2' : 'Hospital 3');

    const reasons = [];
    const patientNetworkObj = await network.connectToNetwork(req.headers.username);

    if (args.malaria === 'true') reasons.push('Malaria');
    if (args.syphilis === 'true') reasons.push('Syphilis');
    if (args.hiv === 'true') reasons.push('HIV');
    if (args.hepatitisB === 'true') reasons.push('Hepatitis B');
    if (args.hepatitisC === 'true') reasons.push('Hepatitis C');

    if (reasons.length > 0) {
      // if alarming test results found
      const deferPatientArgs = [JSON.stringify({
        healthId: healthId,
        username: req.headers.username, deferredStatus: 'deferred permanently',
        deferredAt: hospName,
      }),
      JSON.stringify({ transientData: { deferredReasons: reasons, deferredTenure: 100000000, results: diseasesTested } })];

      const response = await network.invokePDCTransaction(patientNetworkObj, false, capitalize(userRole) +
        'Contract:addPendingAlarmingHistory', deferPatientArgs);
      console.debug('Response from network for adding pending defer operations', response.toString());
      const deferredResponse = JSON.parse(response.toString());

      if (deferredResponse.status === 'error') {
        console.error('Failed to defer patient with health ID: ', args.healthId);
      } else {
        console.debug('Status', deferredResponse.status);

        // TODO: get the bag Ids of the donor and delete the bags from receiver channel and the database table
        const donatedBagsResponseBytes = await network.invoke(patientNetworkObj, true, capitalize(userRole) +
          'Contract:getDonatedBagsForDonor', deferPatientArgs); // TODO: Modify the args
        const donatedBagsResponse = JSON.parse(donatedBagsResponseBytes.toString());
        console.debug('Response from network for getting donated bags', donatedBagsResponse);

        if (donatedBagsResponse.status === 'error') {
          console.error('Failed to get donated bags for health ID: ', args.healthId);
          // res.status(500).json(donatedBagsResponse);
        } else {
          console.debug('Successfully fetched donated bags for health ID: ', args.healthId);
          console.debug('Bags to be deleted:', donatedBagsResponse.bags);

          // delete the bags from the receiver channel and the database table
          for (const bag of donatedBagsResponse.bags) {
            if (bag.bagId.startsWith('T')) {
              console.debug('Deleting bag with ID:', bag.bagId);
              const bagUpdationArgs = [JSON.stringify({
                healthId: healthId,
                username: req.headers.username,
                bloodBagUnitNo: bag.bloodBagUnitNo,
                bloodBagSegmentNo: bag.bloodBagUnitNo,
              })];
              const donationStatusUpdationResponseBytes = await network.invoke(patientNetworkObj,
                false, capitalize(userRole) +
              'Contract:updateBloodDonationStatus', bagUpdationArgs);
              const donationStatusUpdationResponse = JSON.parse(donationStatusUpdationResponseBytes.toString());
              console.debug('Response from network for updating blood donation status', donationStatusUpdationResponse);
            }
            await databaseRoutes.deleteBloodRecord(bag.bagUnitNo, bag.bagSegmentNo, hospName.toLowerCase());
          }
        }
        res.status(200).json({ status: 'success', message: 'TTI results added successfully' });
      }
    } else {
      // simply insert the sensitive medical history 
      const deferPatientArgs = [JSON.stringify({
        healthId: healthId,
        username: req.headers.username,
        deferredStatus: 'not deferred',
        deferredAt: hospName,
      }),
      JSON.stringify({ transientData: { deferredReasons: null, deferredTenure: 0, results: diseasesTested } })];
      const response = await network.invokePDCTransaction(patientNetworkObj, false, capitalize(userRole) +
        'Contract:addPendingAlarmingHistory', deferPatientArgs);
      console.debug('Response from network for adding pending defer operations', response.toString());
      const deferredResponse = JSON.parse(response.toString());

      if (deferredResponse.status === 'error') {
        console.error('Failed to insert record for patient with health ID: ', healthId);
        res.status(500).json(deferredResponse);
      } else {
        console.debug('Status', deferredResponse.status);
        console.debug('Successfully done');
        res.status(200).json({ status: 'success', message: 'TTI results added successfully' });
      }
    }

    // TODO (optional): insert verification records in receiverchannel
  } catch (err) {
    console.error('Error in addTtiResults:', err);
    res.status(500).json({ status: 'error', error: 'An error occurred while adding TTI results.' });
  }

};

exports.crossMatchResults = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  const args = req.body;
  const hospName = args.technicianId.startsWith('HOSP1') ? 'Hospital 1' :
    (args.technicianId.startsWith('HOSP2') ? 'Hospital 2' : 'Hospital 3');
  const { technicianId, slipNumber, bloodBagUnitNo, bloodBagSegmentNo, bloodGroup, ...diseasesTested } = args;

  let r1 = await databaseRoutes.bagInfo(bloodBagUnitNo, bloodBagSegmentNo, hospName);
  console.log(r1);

  r1 = r1.data;
  args.slipNumber = r1[0].AllocatedTo;
  args.bloodGroup = r1[0].BloodGroup;
  // args.bloodGroup="AB+";
  y = [JSON.stringify(args)];
  const networkObj = await network1.connectToNetwork(req.headers.username);
  const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:crossmatchCheck', y);
  const responseString = response instanceof Buffer ? response.toString('utf8') : response;
  console.log('Response string:', responseString);
  const ans = JSON.parse(responseString);
  console.log(responseString);

  if (ans.crossmatch === 'false') {
    console.log('CROSS MATCH FAILED FOR THIS BAG. FINDING NEW BAG');
    const bagId = getBagId(bloodBagUnitNo, bloodBagSegmentNo);

    const reasons = [];

    if (args.malaria === 'true') reasons.push('Malaria');
    if (args.syphilis === 'true') reasons.push('Syphilis');
    if (args.hiv === 'true') reasons.push('HIV');
    if (args.hepatitisB === 'true') reasons.push('Hepatitis B');
    if (args.hepatitisC === 'true') reasons.push('Hepatitis C');
    if (args.ABORhGrouping === 'false') reasons.push('ABORh Grouping');
    if (args.irregularAntiBody === 'true') reasons.push('Irregular Antibodies');

    const deferPatientArgs = [JSON.stringify({
      bloodBagUnitNo: bloodBagUnitNo, bloodBagSegmentNo: bloodBagSegmentNo,
      username: req.headers.username, deferredStatus: 'deferred permanently',
      deferredAt: hospName,
    }),
    JSON.stringify({ transientData: { deferredReasons: reasons, deferredTenure: 100000000, results: diseasesTested } })];
    // Set up and connect to Fabric Gateway using the username in header
    const patientNetworkObj = await network.connectToNetwork(req.headers.username);

    const response = await network.invokePDCTransaction(patientNetworkObj, false, capitalize(userRole) +
      'Contract:addBagsToBeDeferred', deferPatientArgs);
    console.debug('Response from network for adding pending defer operations', response.toString());
    const deferredResponse = JSON.parse(response.toString());

    if (deferredResponse.status === 'error') {
      console.error('Failed to defer patient of bagId: ', bagId);
    } else {
      console.debug('Status', deferredResponse.status);
      await databaseRoutes.updateCrossMatchStatus(bloodBagUnitNo, bloodBagSegmentNo, hospName, ans.crossmatch);
      console.debug('Successfully done');
    }

    // res.status(200).json({ success: false, message: "Blood Cross Match failed. Finding new bag..." });
    const r2 = await databaseRoutes.getBloodByExpiry(hospName, args.bloodGroup, 1);
    console.log(r2);

    if (r2.length === 0) {
      console.log('NOT ENOUGH BAGS. ASK RECEIVER TO GO TO SOME OTHER HOSP');
      res.status(200).json({ success: false, message: 'Not Enough Blood Bags for Receiver!!' });
      // Need to implement later
      console.log('DE-SELECT OTHER BAGS SELECTED FOR THE RECEIVER');
    } else {
      args.newAllocation = r2;
      console.log(args.newAllocation);
      y = [JSON.stringify(args)];
      const r3 = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:replaceReceiver', y);
      await databaseRoutes.allocateBlood(r2[0].BagUnitNo, r2[0].BagSegmentNo, hospName, args.slipNumber);
      res.status(200).json({ success: false, message: 'Blood Cross-match Unsuccessful!! Selected new bag.' });
    }
    await databaseRoutes.deAllocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospName);
  } else {
    res.status(200).json({ success: true, message: 'Blood Cross Match successful' });
  }
};

exports.confirmbloodReceival = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  let args = req.body;
  const tech = args.technicianId;
  const hospitalName = tech.startsWith('HOSP1') ? 'hospital 1' : (tech.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');

  try {
    if (args.confirmation === 'false') {
      await databaseRoutes.deAllocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospitalName);
      res.status(200).json({ success: true, message: 'Blood bag deallocated successfully' });
    } else {
      const responseFromDB = await databaseRoutes.bagExists(args.bloodBagUnitNo, args.bloodBagSegmentNo, args.aadharOfReceipient);
      if (responseFromDB.data.length === 0) {
        await databaseRoutes.deAllocateBlood(args.bloodBagUnitNo, args.bloodBagSegmentNo, hospitalName);
        res.status(404).json({ success: false, message: 'Blood bag not found in the database' });
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
          res.status(500).json({ success: false, message: 'Failed to create bag', error: response.error });
        } else {
          res.status(200).json({ success: true, message: 'Blood Cross Match successful' });
        }
      }
    }
  } catch (error) {
    console.error('Error confirming blood receival:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};


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
};

exports.LTapproval = async (req, res) => {
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);

  const parsedUrl = url.parse(req.url, true);
  const tech = parsedUrl.query.technicianId;

  const hospitalName = tech.startsWith('HOSP1') ? 'hospital 1' : (tech.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');


  const leftforapproval = await databaseRoutes.slips(hospitalName);
  const leftForApprovalSlipNos = leftforapproval.data.map((item) => item.AllocatedTo);

  const networkObj = await network1.connectToNetwork(req.headers.username);
  const resultArray = [];

  for (const slipNo of leftForApprovalSlipNos) {
    let args = { slipNumber: slipNo };
    console.log(args);
    args = [JSON.stringify(args)];
    const response = await network1.invoke(networkObj, false, capitalize(userRole) + 'Contract:LTapproval', args);
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
};

exports.checkPatientStatus = async (req, res) => {
  const healthId = req.query.healthId;
  const userRole = req.headers.role;
  await validateRole([ROLE_TECHNICIAN], userRole, res);
  const networkObj = await network.connectToNetwork(req.headers.username);
  const response = await network.invoke(networkObj, false,
    capitalize(userRole) + 'Contract:checkIfPatientIsDeferred',
    [JSON.stringify({ healthId: healthId })]);
  const responseJson = JSON.parse(response);
  console.log(responseJson);
  (responseJson.status === 'error') ? res.status(404).send('Patient not found') : res.status(200).send(responseJson);
};

exports.screenPatient = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_TECHNICIAN], userRole, res);
    const args = req.body;
    const { healthId, technicianId, ...diseasesScreened } = args;
    const argsArr = [JSON.stringify({
      healthId: healthId,
      technicianId: technicianId,
      results: diseasesScreened,
      ...args, // spread operator to include other properties
    })];
    const networkObj = await network.connectToNetwork(req.headers.username);
    // Invoke the smart contract function
    const responseBytes = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:screenPatient', argsArr);
    const response = JSON.parse(responseBytes.toString());
    console.debug('Response from network for screening patient', response);
    // check whether patient should be deferred : if yes, execute a PDC write
    if ('deferPatient' in response && (response.deferPatient === true || response.deferPatient === 'true')) {
      console.log('About to defer patient');
      const deferPatientArgs = [JSON.stringify({
        healthId: args.healthId,
        username: req.headers.username,
        deferredAt: response.deferredAt,
        deferredStatus: response.deferredStatus,
      }), JSON.stringify({
        transientData: {
          deferredReasons: response.deferredReasons,
          deferredTenure: response.deferredTenure,
          results: diseasesScreened,
        },
      }),
      ];

      const patientNetworkObj = await network.connectToNetwork(req.headers.username);

      const deferredResponseBytes = await network.invokePDCTransaction(patientNetworkObj, false,
        capitalize(userRole) + 'Contract:addPendingAlarmingHistory', deferPatientArgs);
      const deferredResponse = JSON.parse(deferredResponseBytes.toString());
      console.debug('Response from network for adding pending defer operations', deferredResponse);

      if (deferredResponse.status === 'error') {
        console.error('Failed to defer patient with ID: ', args.healthId);
      } else {
        console.debug('Status', deferredResponse.status);
      }
    }
    if (response.deferPatient === true || response.deferPatient === 'true') {
      res.status(500).json({ status: 'error', message: 'Screening Failed' });
    } else {
      res.status(200).json({ status: 'success', message: 'Screening successful' });
    }
  } catch (error) {
    console.error('Error in technician-routes/screenPatient', error);
    res.status(500).json({ status: 'error', error: error });
  }
};

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

exports.collectBlood = async (req, res) => {
  try {
    const userRole = req.headers.role;
    await validateRole([ROLE_TECHNICIAN], userRole, res);
    let args = req.body;
    const rawArgs = args;
    console.log(args);
    args = [JSON.stringify(args)];
    const networkObj = await network.connectToNetwork(req.headers.username);
    // Invoke the smart contract function
    const response = await network.invoke(networkObj, false, capitalize(userRole) + 'Contract:bloodCollection', args);
    const parsedVAL = JSON.parse(response);
    const hospitalName = rawArgs.technicianId.startsWith('HOSP1') ? 'hospital 1' :
      (rawArgs.technicianId.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');
    await databaseRoutes.insertBlood(parsedVAL.bloodBagUnitNo, parsedVAL.bloodBagSegmentNo,
      hospitalName, parsedVAL.dateOfCollection, parsedVAL.dateOfExpiry, parsedVAL.quantity, parsedVAL.bloodGroup);
    // await databaseRoutes.insertDonatedBloodBagForCrossMatch(rawArgs.bloodBagUnitNo,
    // rawArgs.bloodBagSegmentNo, hospitalName, rawArgs.healthId);
    (response.error) ? res.status(500).send(response.error) : res.status(200).send(getMessage(false, 'Blood Collection successful.'));
  } catch (error) {
    console.error('Error in collectBlood:', error);
    res.status(500).send({ error: 'An error occurred while collecting blood.' });
  }
};