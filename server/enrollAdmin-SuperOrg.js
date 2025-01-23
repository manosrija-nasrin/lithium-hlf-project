/**
 * @desc Execute this file to create and enroll an admin at Hospital 3.
 */

const {Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const {buildCAClient, enrollAdmin} = require('../donor-asset-transfer/application-javascript/CAUtil.js');
const {buildWallet, buildCCPSuperOrg} = require('../donor-asset-transfer/application-javascript/AppUtil.js');
const adminsuperOrg = 'superOrgadmin';
const adminsuperOrgPasswd = 'superOrglithium';

const mspSuperOrg = 'superOrgMSP';
const walletPath = path.join(__dirname, '../donor-asset-transfer/application-javascript/wallet');

/**
  * @description This functions enrolls the admin of Hospital 3
  */
exports.enrollAdminSuperOrg = async function() {
  try {
    // build an in memory object with the network configuration (also known as a connection profile)
    const ccp = buildCCPSuperOrg();

    // build an instance of the fabric ca services client based on
    // the information in the network configuration
    const caClient = buildCAClient(FabricCAServices, ccp, 'ca.superOrg.lithium.com');

    // setup the wallet to hold the credentials of the application user
    const wallet = await buildWallet(Wallets, walletPath);

    // to be executed and only once per hospital. Which enrolls admin and creates admin in the wallet
    await enrollAdmin(caClient, wallet, mspSuperOrg, adminsuperOrg, adminsuperOrgPasswd);

    console.log('msg: Successfully enrolled admin user ' + adminsuperOrg + ' and imported it into the wallet');
  } catch (error) {
    console.error(`Failed to enroll admin user ' + ${adminsuperOrg} + : ${error}`);
    process.exit(1);
  }
};
