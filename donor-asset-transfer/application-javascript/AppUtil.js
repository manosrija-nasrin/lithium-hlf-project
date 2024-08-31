const fs = require('fs');
const path = require('path');

exports.buildCCPHosp1 = () => {
  
  const ccpPath = path.resolve(__dirname, '..', '..', 'first-network',
    'organizations', 'peerOrganizations', 'hosp1.lithium.com', 'connection-hosp1.json');
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
};

exports.buildCCPHosp2 = () => {
  const ccpPath = path.resolve(__dirname, '..', '..', 'first-network',
    'organizations', 'peerOrganizations', 'hosp2.lithium.com', 'connection-hosp2.json');
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');
  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
};

exports.buildCCPHosp3 = () => {
  
  const ccpPath = path.resolve(__dirname, '..', '..', 'first-network',
    'organizations', 'peerOrganizations', 'hosp3.lithium.com', 'connection-hosp3.json');
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);
  return ccp;
};

exports.buildWallet = async (Wallets, walletPath) => {

  let wallet;
  if (walletPath) {
    wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Built a file system wallet at ${walletPath}`);
  } else {
    wallet = await Wallets.newInMemoryWallet();
    console.log('Built an in memory wallet');
  }

  return wallet;
};

exports.prettyJSONString = (inputString) => {
  if (inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
  } else {
    return inputString;
  }
};
