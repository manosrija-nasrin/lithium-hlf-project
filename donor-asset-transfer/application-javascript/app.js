const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, deleteAndRevokeUser } = require('./CAUtil.js');
const { buildCCPHosp3, buildCCPHosp2, buildCCPHosp1, buildWallet } = require('./AppUtil.js');
const http = require('http');

const channelName = 'hospitalchannel';
const chaincodeName = 'donor';
const mspOrg1 = 'hosp1MSP';
const mspOrg2 = 'hosp2MSP';
const mspOrg3 = 'hosp3MSP';
const walletPath = path.join(__dirname, 'wallet');
const caUrl = 'https://localhost:7054';

exports.connectToNetwork = async function (doctorID) {
  const gateway = new Gateway();
  const ccp = buildCCPHosp1();

  try {
    const walletPath = path.join(process.cwd(), '../donor-asset-transfer/application-javascript/wallet/');

    const wallet = await buildWallet(Wallets, walletPath);

    const userExists = await wallet.get(doctorID);
    if (!userExists) {
      console.log('An identity for the doctorID: ' + doctorID + ' does not exist in the wallet');
      console.log('Create the doctorID before retrying');
      const response = {};
      response.error = 'An identity for the user ' + doctorID + ' does not exist in the wallet. Register ' + doctorID + ' first';
      return response;
    }

    await gateway.connect(ccp, { wallet, identity: doctorID, discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork(channelName);

    const contract = network.getContract(chaincodeName);

    const networkObj = {
      contract: contract,
      network: network,
      gateway: gateway,
    };
    console.log('Succesfully connected to the network.');
    return networkObj;
  } catch (error) {
    console.log(`Error processing transaction. ${error}`);
    console.log(error.stack);
    const response = {};
    response.error = error;
    return response;
  }
};

exports.invoke = async function (networkObj, isQuery, func, args = '') {
  try {
    if (isQuery === true) {
      const response = await networkObj.contract.evaluateTransaction(func, args);
      console.log(response);
      await networkObj.gateway.disconnect();
      return response;
    } else {
      if (args) {
        args = JSON.parse(args[0]);
        args = JSON.stringify(args);
      }
      const response = await networkObj.contract.submitTransaction(func, args);
      await networkObj.gateway.disconnect();
      return response;
    }
  } catch (error) {
    const response = { error: error };
    console.error(`Failed to submit transaction: ${error}`);
    return response;
  }
};

exports.invokePDCWriteTransaction = async function (networkObj, func, args = '') {
  try {
    const contractObj = networkObj.contract;
    const gatewayObj = networkObj.gateway;
    // const transientMap = new Map();  //  not required
    console.log(args);
    if (args && args.length > 1) {
      let parsedArgs = JSON.parse(args[0]);
      let transientData = JSON.parse(args[1]);
      console.log(parsedArgs);
      console.log(transientData);
      /*
      [
      '{"bloodBagUnitNo":"108","bloodBagSegmentNo":"108","username":"HOSP1-TECH123"}',
      '{"transientData":{"reasons":["Malaria","Syphilis"]}}'
      ]
      {
        bloodBagUnitNo: '108',
        bloodBagSegmentNo: '108',
        username: 'HOSP1-TECH123'
      }
      { transientData: { reasons: [ 'Malaria', 'Syphilis' ] } }
       */
      if ('transientData' in transientData) {
        // transientMap.set("transientData", Buffer.from(JSON.stringify(transientData['transientData'])));
        let wrappedTransientData = {'transientData': Buffer.from(JSON.stringify(transientData['transientData']))};
        const response = await contractObj.createTransaction(func).setTransient(wrappedTransientData).submit(JSON.stringify(parsedArgs));
        await gatewayObj.disconnect();
        return response;
      } else {
        throw new Error("No transientData field in args[1]");
      }
    } else {
      throw new Error("Pass transient data in args[1]");
    }
  } catch (error) {
    const response = { error: error };
    console.error(`Failed to submit transaction: ${error}`);
    return response;
  }
}
exports.registerUser = async function (attributes) {
  const attrs = JSON.parse(attributes);
  const hospitalId = parseInt(attrs.hospitalId);
  const userId = attrs.userId;

  if (!userId || !hospitalId) {
    const response = {};
    response.error = 'Error! You need to fill all fields before you can register!';
    return response;
  }

  try {
    const wallet = await buildWallet(Wallets, walletPath);
    // TODO: Must be handled in a config file instead of using if
    if (hospitalId === 1) {
      const ccp = buildCCPHosp1();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp1.lithium.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg1, userId, 'hosp1admin', attributes);
    } else if (hospitalId === 2) {
      const ccp = buildCCPHosp2();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp2.lithium.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg2, userId, 'hosp2admin', attributes);
    } else if (hospitalId === 3) {
      const ccp = buildCCPHosp3();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp3.lithium.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg3, userId, 'hosp3admin', attributes);
    }
    console.log(`Successfully registered user: + ${userId}`);
    const response = 'Successfully registered user: ' + userId;
    return response;
  } catch (error) {
    console.error(`Failed to register user + ${userId} + : ${error}`);
    const response = {};
    response.error = error;
    return response;
  }
};

exports.deleteUser = async function (userId, hospitalId, adminUserId) {
  try {
    console.log(userId, hospitalId);
    const hospId = parseInt(hospitalId);
    const adminUserId = `hosp${hospId}admin`;
    const wallet = await buildWallet(Wallets, walletPath);
    console.log(wallet);
    let response;

    // Determine the CCP, CA client, and MSP ID based on the hospitalId
    if (hospId === 1) {
      console.log('hello');
      const ccp = buildCCPHosp1();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp1.lithium.com');
      console.log(caClient);
      response = await deleteAndRevokeUser(caClient, wallet, userId, adminUserId);
    } else if (hospId === 2) {
      const ccp = buildCCPHosp2();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp2.lithium.com');
      response = await deleteAndRevokeUser(caClient, wallet, userId, adminUserId);
    } else if (hospId === 3) {
      const ccp = buildCCPHosp3();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp3.lithium.com');
      response = await deleteAndRevokeUser(caClient, wallet, userId, adminUserId);
    } else {
      response = { error: 'Error! Invalid hospitalId.' };
    }

    return response;
  } catch (error) {
    console.error(`Failed to delete user ${userId} : ${error}`);
    return { error: error };
  }
};

/**
 * @param  {NetworkObj} networkObj The object which is generated when connectToNetwork is executed
 * @param  {Number} hospitalId
 * @return {JSON} Returns an JSON array consisting of all doctor object.
 * @description Retrieves all the users(doctors) based on user type(doctor) and hospitalId
 */
async function checkEnrollmentStatus(caUrl, userId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: caUrl.split('://')[1].split(':')[0],
      port: caUrl.split(':')[2].split('/')[0],
      path: `/api/v1/identities/${userId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const httpModule = caUrl.startsWith('https://') ? require('https') : require('http');
    const req = httpModule.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk.toString();
        console.log("chunk");
        console.log(chunk.toString());
      });

      res.on('end', () => {
        try {
          console.log("data");
          console.log(data);
          const responseBody = JSON.parse(data);
          if (res.statusCode === 200) {
            const enrollmentStatus = responseBody.status;
            console.log(`Enrollment status for user ${userId}: ${enrollmentStatus}`);
            resolve(enrollmentStatus);
          } else {
            console.error(`Failed to retrieve enrollment status for user ${userId}.`);
            reject(null);
          }
        } catch (error) {
          console.error(`Error parsing JSON response: ${error}`);
          reject(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error checking enrollment status for user ${userId}: ${error}`);
      reject(null);
    });

    req.end();
  });
}

exports.getAllSupersByHospitalId = async function (networkObj, hospitalId) {
  // Get the User from the identity context

  const users = networkObj.gateway.identityContext.user;
  let caClient;
  const result = [];
  try {
    // TODO: Must be handled in a config file instead of using if
    if (hospitalId === 1) {
      const ccp = buildCCPHosp1();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp1.lithium.com');
    } else if (hospitalId === 2) {
      const ccp = buildCCPHosp2();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp2.lithium.com');
    } else if (hospitalId === 3) {
      const ccp = buildCCPHosp3();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp3.lithium.com');
    }

    // Use the identity service to get the user enrolled using the respective CA
    const idService = caClient.newIdentityService();
    const userList = await idService.getAll(users);

    // for all identities the attrs can be found
    const identities = userList.result.identities;

    for (let i = 0; i < identities.length; i++) {
      tmp = {};
      if (identities[i].type === 'client') {
        tmp.id = identities[i].id;
        tmp.role = identities[i].type;
        attributes = identities[i].attrs;
        // Doctor object will consist of firstName and lastName
        for (let j = 0; j < attributes.length; j++) {
          if (attributes[j].name.endsWith('Name') || attributes[j].name === 'role' || attributes[j].name === 'registration' || attributes[j].name === 'address' || attributes[j].name === 'phoneNumber' || attributes[j].name === 'emergPhoneNumber') {
            tmp[attributes[j].name] = attributes[j].value;
          }
        }
        //const enrollmentStatus = await checkEnrollmentStatus(caUrl, identities[i].id);
        result.push(tmp);
      }
    }
  } catch (error) {
    console.error(`Unable to get all supers : ${error}`);
    const response = {};
    response.error = error;
    return response;
  }
  return result.filter(
    function (result) {
      return result.role === 'super';
    },
  );
};

exports.getAllDoctorsByHospitalId = async function (networkObj, hospitalId) {
  // Get the User from the identity context

  const users = networkObj.gateway.identityContext.user;
  let caClient;
  const result = [];
  try {
    // TODO: Must be handled in a config file instead of using if
    if (hospitalId === 1) {
      const ccp = buildCCPHosp1();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp1.lithium.com');
    } else if (hospitalId === 2) {
      const ccp = buildCCPHosp2();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp2.lithium.com');
    } else if (hospitalId === 3) {
      const ccp = buildCCPHosp3();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp3.lithium.com');
    }

    // Use the identity service to get the user enrolled using the respective CA
    const idService = caClient.newIdentityService();
    const userList = await idService.getAll(users);

    // for all identities the attrs can be found
    const identities = userList.result.identities;

    for (let i = 0; i < identities.length; i++) {
      tmp = {};
      if (identities[i].type === 'client') {
        tmp.id = identities[i].id;
        tmp.role = identities[i].type;
        attributes = identities[i].attrs;
        // Doctor object will consist of firstName and lastName
        for (let j = 0; j < attributes.length; j++) {
          if (attributes[j].name.endsWith('Name') || attributes[j].name === 'role' || attributes[j].name === 'registration' || attributes[j].name === 'address' || attributes[j].name === 'phoneNumber' || attributes[j].name === 'emergPhoneNumber') {
            tmp[attributes[j].name] = attributes[j].value;
          }
        }
        //const enrollmentStatus = await checkEnrollmentStatus(caUrl, identities[i].id);
        result.push(tmp);
      }
    }
  } catch (error) {
    console.error(`Unable to get all doctors : ${error}`);
    const response = {};
    response.error = error;
    return response;
  }
  return result.filter(
    function (result) {
      return result.role === 'doctor';
    },
  );
};


exports.getAllTechniciansByHospitalId = async function (networkObj, hospitalId) {
  // Get the User from the identity context

  const users = networkObj.gateway.identityContext.user;
  let caClient;
  const result = [];
  try {
    // TODO: Must be handled in a config file instead of using if
    if (hospitalId === 1) {
      const ccp = buildCCPHosp1();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp1.lithium.com');
    } else if (hospitalId === 2) {
      const ccp = buildCCPHosp2();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp2.lithium.com');
    } else if (hospitalId === 3) {
      const ccp = buildCCPHosp3();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp3.lithium.com');
    }

    // Use the identity service to get the user enrolled using the respective CA
    const idService = caClient.newIdentityService();
    const userList = await idService.getAll(users);

    // for all identities the attrs can be found
    const identities = userList.result.identities;

    for (let i = 0; i < identities.length; i++) {
      console.log(identities[i]);
      tmp = {};
      if (identities[i].type === 'client') {
        tmp.id = identities[i].id;
        tmp.role = identities[i].type;
        attributes = identities[i].attrs;
        for (let j = 0; j < attributes.length; j++) {
          if (attributes[j].name.endsWith('Name') || attributes[j].name === 'role' || attributes[j].name === 'registration' || attributes[j].name === 'address' || attributes[j].name === 'phoneNumber' || attributes[j].name === 'emergPhoneNumber') {
            tmp[attributes[j].name] = attributes[j].value;
          }
        }
        result.push(tmp);
      }
    }
  } catch (error) {
    console.error(`Unable to get all technicians : ${error}`);
    const response = {};
    response.error = error;
    return response;
  }
  return result.filter(
    function (result) {
      return result.role === 'technician';
    },
  );
};
