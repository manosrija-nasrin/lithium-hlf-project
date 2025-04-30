#!/bin/bash

# Set up a fresh network

set -e  # Exit immediately if a command exits with a non-zero status

# Error handler
function handle_error() {
  echo "Error on line $1"
  exit 1
}
trap 'handle_error $LINENO' ERR

# Start the network
./network.sh up -ca
./network.sh createChannel -c hospitalchannel -s couchdb
./network.sh createChannel -c receiverchannel -s couchdb

# Generate identities for superOrg
cd ./addSuperOrg
./addSuperOrg.sh generate -ca

# Set common environment variables
export FABRIC_CA_CLIENT_HOME=${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/
export PATH=${PWD}/../../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../../config/

# Function to register and enroll peers
function register_and_enroll_peer() {
  local PEER_NAME=$1
  local PEER_PW=$2

  echo "Registering and enrolling $PEER_NAME"

  fabric-ca-client register --caname ca-superOrg --id.name $PEER_NAME --id.secret $PEER_PW --id.type peer --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"

  fabric-ca-client enroll -u https://$PEER_NAME:$PEER_PW@localhost:11054 --caname ca-superOrg -M "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/$PEER_NAME.superOrg.lithium.com/msp" --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"

  fabric-ca-client enroll -u https://$PEER_NAME:$PEER_PW@localhost:11054 --caname ca-superOrg -M "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/$PEER_NAME.superOrg.lithium.com/tls" --enrollment.profile tls --csr.hosts $PEER_NAME.superOrg.lithium.com --csr.hosts localhost --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"

  # Copy certificates
  for cert in tlsca/tlsca.superOrg.lithium.com-cert.pem msp/cacerts/ca.superOrg.lithium.com-cert.pem; do
    cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/$PEER_NAME.superOrg.lithium.com/$cert" "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/$cert"
  done

  # Copy TLS certs
  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/$PEER_NAME.superOrg.lithium.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/msp/tlscacerts/ca.crt"
  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/$PEER_NAME.superOrg.lithium.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/$PEER_NAME.superOrg.lithium.com/msp/config.yaml"
}

# Register and enroll peers
register_and_enroll_peer "peer1" "peer1pw"
register_and_enroll_peer "peer2" "peer2pw"

# Add superOrg to channels
./addSuperOrg.sh up -c hospitalchannel
./addSuperOrg.sh up -c receiverchannel

# Join peers to channels
cd ..
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=superOrgMSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/superOrg.lithium.com/peers/peer1.superOrg.lithium.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/superOrg.lithium.com/users/Admin@superOrg.lithium.com/msp

export ORDERER_CA="${PWD}/organizations/ordererOrganizations/lithium.com/orderers/orderer.lithium.com/msp/tlscacerts/tlsca.lithium.com-cert.pem"
export PEER0_SUPER_CA=${PWD}/organizations/peerOrganizations/superOrg.lithium.com/tlsca/tlsca.superOrg.lithium.com-cert.pem

function join_channel() {
  local PEER_PORT=$1
  local CHANNEL_NAME=$2
  export CORE_PEER_ADDRESS=localhost:$PEER_PORT

  local BLOCKFILE="${PWD}/channel-artifacts/${CHANNEL_NAME}.block"
  peer channel fetch 0 $BLOCKFILE -o localhost:7050 --ordererTLSHostnameOverride orderer.lithium.com -c $CHANNEL_NAME --tls --cafile "$ORDERER_CA"
  peer channel join -b $BLOCKFILE
}

join_channel "12051" "hospitalchannel"
join_channel "12051" "receiverchannel"
join_channel "13051" "hospitalchannel"
join_channel "13051" "receiverchannel"

# Deploy chaincode
./network.sh deployCC -c hospitalchannel -ccn donor -ccv 1 -ccs 1 -cci initLedger -ccp "../donor-asset-transfer/chaincode" -ccl javascript -ccep "OR('hosp1MSP.peer','hosp2MSP.peer','superOrgMSP.peer')" -cccg ../private-collections/private-collections.json
./network.sh deployCC -c receiverchannel -ccn receiver -ccv 1 -cci initLedger -ccp "../receiver-asset-transfer/chaincode" -ccl javascript -ccs 1

. ./scripts/utils.sh
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/

function deploy_chaincode() {
  local PEER_PORT=$1
  local CC_NAME=$2
  export CORE_PEER_ADDRESS=localhost:$PEER_PORT

  peer lifecycle chaincode install ${CC_NAME}.tar.gz >&log.txt
}

deploy_chaincode "12051" "donor"
deploy_chaincode "12051" "receiver"
deploy_chaincode "13051" "donor"
deploy_chaincode "13051" "receiver"

echo "Network setup completed successfully."
