/**
 * @desc The file which interacts with the fabric network.
 */

const {Gateway, Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const {buildCAClient, registerAndEnrollUser, deleteAndRevokeUser} = require('./CAUtil.js');
const {buildCCPHosp3, buildCCPHosp2, buildCCPHosp1, buildWallet} = require('./AppUtil.js');
const http = require('http');

const channelName = 'receiverchannel';
const chaincodeName = 'receiver';
const mspOrg1 = 'hosp1MSP';
const mspOrg2 = 'hosp2MSP';
const mspOrg3 = 'hosp3MSP';
const walletPath = path.join(__dirname, 'wallet');
const caUrl = 'https://localhost:7054'; 


/**
 * @param  {string} doctorID
 * @return {networkObj} networkObj if all paramters are correct, the networkObj consists of contract, network, gateway
 * @return {string} response error if there is a error in the method
 * @description Connects to the network using the username - doctorID, networkObj contains the paramters using which
 * @description a connection to the fabric network is possible.
 */
exports.connectToNetwork = async function(doctorID) {
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

    /**
    * setup the gateway instance
    * he user will now be able to create connections to the fabric network and be able to
    * submit transactions and query. All transactions submitted by this gateway will be
    * signed by this user using the credentials stored in the wallet.
    */
    // using asLocalhost as this gateway is using a fabric network deployed locally
    await gateway.connect(ccp, {wallet, identity: doctorID, discovery: {enabled: true, asLocalhost: true}});

    // Build a network instance based on the channel where the smart contract is deployed
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
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

exports.invoke = async function(networkObj, isQuery, func, args= '') {
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
    const response = {};
    response.error = error;
    console.error(`Failed to submit transaction: ${error}`);
    return response;
  }
};

