CHANNEL_NAME=hospitalchannel
CC_NAME=donor
CC_SRC_PATH="../donor-asset-transfer/chaincode"
CC_END_POLICY="OR('hosp1MSP.peer','hosp2MSP.peer','superOrgMSP.peer')"
CC_COLL_CONFIG="../private-collections/private-collections.json"
CC_POLICY="AND('hosp1MSP.peer','hosp2MSP.peer','superOrgMSP.peer')"

TEST_NETWORK_HOME=${TEST_NETWORK_HOME:-${PWD}}
. ${TEST_NETWORK_HOME}/scripts/utils.sh

CC_VERSION=1
CC_SEQUENCE=1

# read the version and sequence from command line arguments
while getopts "c:v:s:" opt; do
  case $opt in
	v) CC_VERSION=$OPTARG ;;
	s) CC_SEQUENCE=$OPTARG ;;
	c) CC_NAME=$OPTARG ;;
  h) echo "Usage: $0 -c {donor|receiver} -v version -s sequence"; exit 1 ;;
	*) echo "Usage: $0 -c {donor|receiver} -v version -s sequence"; exit 1 ;;
  esac
done

# according to the cmdline arg supplied, determine the chaincode to be installed
if [ $CC_NAME == "donor" ]; then
  infoln "Installing donor chaincode"
  CHANNEL_NAME=hospitalchannel
  CC_SRC_PATH="../donor-asset-transfer/chaincode"
  CC_END_POLICY="OR('hosp1MSP.peer','hosp2MSP.peer','superOrgMSP.peer')"
  CC_COLL_CONFIG="../private-collections/private-collections.json"
elif [ $CC_NAME == "receiver" ]; then
  infoln "Installing receiver chaincode"
  CHANNEL_NAME=receiverchannel
  CC_SRC_PATH="../receiver-asset-transfer/chaincode"
  CC_END_POLICY="OR('hosp1MSP.peer','hosp2MSP.peer','superOrgMSP.peer')"
  CC_COLL_CONFIG="../private-collections/private-collections.json"
else
  echo "Usage: $0 -c {donor|receiver} -v version -s sequence"
  exit 1
fi

## Deploy chaincode to peers
echo "+ ./network.sh deployCC -c ${CHANNEL_NAME} -ccn ${CC_NAME} -ccv ${CC_VERSION} -ccs ${CC_SEQUENCE} -cci initLedger -ccp ${CC_SRC_PATH} -ccl javascript  -ccep ${CC_END_POLICY} -cccg ../private-collections/private-collections.json"
./network.sh deployCC -c ${CHANNEL_NAME} -ccn ${CC_NAME} -ccv ${CC_VERSION} -ccs ${CC_SEQUENCE} -cci initLedger -ccp ${CC_SRC_PATH} -ccl javascript  -ccep ${CC_END_POLICY} -cccg ../private-collections/private-collections.json

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=superOrgMSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/superOrg.lithium.com/peers/peer1.superOrg.lithium.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/superOrg.lithium.com/users/Admin@superOrg.lithium.com/msp

export ORDERER_CA=${TEST_NETWORK_HOME}/organizations/ordererOrganizations/lithium.com/tlsca/tlsca.lithium.com-cert.pem
export PEER0_HOSP1_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/hosp1.lithium.com/tlsca/tlsca.hosp1.lithium.com-cert.pem
export PEER0_HOSP2_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/hosp2.lithium.com/tlsca/tlsca.hosp2.lithium.com-cert.pem
export PEER0_SUPER_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/superOrg.lithium.com/tlsca/tlsca.superOrg.lithium.com-cert.pem

# peer1 of superOrg
export CORE_PEER_ADDRESS=localhost:12051
echo "+ peer lifecycle chaincode install ${CC_NAME}.tar.gz"
peer lifecycle chaincode install ${CC_NAME}.tar.gz

# peer2 of superOrg
export CORE_PEER_ADDRESS=localhost:13051  
echo "+ peer lifecycle chaincode install ${CC_NAME}.tar.gz"
peer lifecycle chaincode install ${CC_NAME}.tar.gz