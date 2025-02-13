const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, deleteAndRevokeUser } = require('./CAUtil.js');
const { buildCCPSuperOrg, buildCCPHosp2, buildCCPHosp1, buildWallet } = require('./AppUtil.js');
const http = require('http');

const channelName = 'hospitalchannel';
const chaincodeName = 'donor';
const mspOrg1 = 'hosp1MSP';
const mspOrg2 = 'hosp2MSP';
const mspOrg3 = 'superOrgMSP';
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

exports.connectToSuperNetwork = async function (doctorID) {
  const gateway = new Gateway();
  const ccp = buildCCPSuperOrg();

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
  const contractObj = networkObj.contract;
  const gatewayObj = networkObj.gateway;
  let response = null;
  try {
    if (isQuery === true) {
      response = await contractObj.evaluateTransaction(func, args);
      console.log(response);
    } else {
      if (args) {
        let parsedArgs = JSON.parse(args[0]);
        let transientData = args.length > 1 ? JSON.parse(args[1]) : {};
        console.debug(parsedArgs);
        console.debug(transientData);
  
        const transaction = await contractObj.createTransaction(func);
        if ('transientData' in transientData) {
          // transientMap.set("transientData", Buffer.from(JSON.stringify(transientData['transientData'])));
          let wrappedTransientData = {'transientData': Buffer.from(JSON.stringify(transientData['transientData']))};
          response = transaction.setTransient(wrappedTransientData).submit(JSON.stringify(parsedArgs));
        } else {
          // submit wihtout transient data  
          response = transaction.submit(JSON.stringify(parsedArgs));
          // throw new Error("No transientData field in args[1]");
        }
      } else {
        throw new Error("No args found");
      }
    }
  } catch (error) {
    response = { error: error };
    console.error(`Failed to submit transaction: ${error}`);
  } finally {
    await gatewayObj.disconnect();
    return response;
  }
};

exports.invokePDCWriteTransaction = async function (networkObj, func, args = '') {
  const contractObj = networkObj.contract;
  const gatewayObj = networkObj.gateway;
  let response = null;
  try {
    // const transientMap = new Map();  //  not required
    console.log(args);
    if (args) {
      let parsedArgs = JSON.parse(args[0]);
      let transientData = args.length > 1 ? JSON.parse(args[1]) : {};
      console.debug(parsedArgs);
      console.debug(transientData);

      const transaction = await contractObj.createTransaction(func);
      transaction.setEndorsingOrganizations(['superOrgMSP']);
      if ('transientData' in transientData) {
        // transientMap.set("transientData", Buffer.from(JSON.stringify(transientData['transientData'])));
        let wrappedTransientData = {'transientData': Buffer.from(JSON.stringify(transientData['transientData']))};
        response = transaction.setTransient(wrappedTransientData).submit(JSON.stringify(parsedArgs));
      } else {
        // submit wihtout transient data  
        response = transaction.submit(JSON.stringify(parsedArgs));
        // throw new Error("No transientData field in args[1]");
      }
    } else {
      throw new Error("No args found");
    }
  } catch (error) {
    response = { error: error };
    console.error(`Failed to submit transaction: ${error}`);
  } finally {
    await gatewayObj.disconnect();
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
    if (userId.includes("SUP")) {
      const ccp = buildCCPSuperOrg();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.superOrg.lithium.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg3, userId, 'superOrgadmin', attributes);
    } else if (hospitalId === 1) {
      const ccp = buildCCPHosp1();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp1.lithium.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg1, userId, 'hosp1admin', attributes);
    } else if (hospitalId === 2) {
      const ccp = buildCCPHosp2();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp2.lithium.com');
      await registerAndEnrollUser(caClient, wallet, mspOrg2, userId, 'hosp2admin', attributes);
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
    if (userId.includes("SUP")) {
      const ccp = buildCCPSuperOrg();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.superOrg.lithium.com');
      response = await deleteAndRevokeUser(caClient, wallet, userId, adminUserId);
    } else if (hospId === 1) {
      console.log('hello');
      const ccp = buildCCPHosp1();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp1.lithium.com');
      console.log(caClient);
      response = await deleteAndRevokeUser(caClient, wallet, userId, adminUserId);
    } else if (hospId === 2) {
      const ccp = buildCCPHosp2();
      const caClient = buildCAClient(FabricCAServices, ccp, 'ca.hosp2.lithium.com');
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

/**
 * 
 * Attributes [
  { name: 'fullName', value: 'Sudha Murthy', ecert: true },
  { name: 'address', value: 'Hospital2, Earth', ecert: true },
  { name: 'phoneNumber', value: '8526147845', ecert: true },
  { name: 'emergPhoneNumber', value: '9874563354', ecert: true },
  { name: 'role', value: 'super', ecert: true },
  { name: 'registration', value: '', ecert: true },
  { name: 'hf.EnrollmentID', value: 'HOSP2-SUP12227', ecert: true },
  { name: 'hf.Type', value: 'client', ecert: true },
  { name: 'hf.Affiliation', value: '', ecert: true }
]
 */

exports.getAllSupers = async function (networkObj) {
  // Get the User from the identity context

  const users = networkObj.gateway.identityContext.user;
  let caClient;
  const result = [];
  try {
    // TODO: Must be handled in a config file instead of using if
    const ccp = buildCCPSuperOrg();
    caClient = buildCAClient(FabricCAServices, ccp, 'ca.superOrg.lithium.com');

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
        let attributes = identities[i].attrs;
        console.debug("Attributes", attributes);
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
    const response = {"error": error};
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
    }
     else if (hospitalId === 3) {
      const ccp = buildCCPSuperOrg();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.superOrg.lithium.com');
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
    }
     else if (hospitalId === 3) {
      const ccp = buildCCPSuperOrg();
      caClient = buildCAClient(FabricCAServices, ccp, 'ca.superOrg.lithium.com');
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
