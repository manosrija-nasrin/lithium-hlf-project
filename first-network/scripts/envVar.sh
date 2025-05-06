#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
# test network home var targets to first-network folder
# the reason we use a var here is to accommodate scenarios
# where execution occurs from folders outside of default as $PWD, such as the first-network/addSuperOrg folder.
# For setting environment variables, simple relative paths like ".." could lead to unintended references
# due to how they interact with FABRIC_CFG_PATH. It's advised to specify paths more explicitly,
# such as using "../${PWD}", to ensure that Fabric's environment variables are pointing to the correct paths.
TEST_NETWORK_HOME=${TEST_NETWORK_HOME:-${PWD}}
. ${TEST_NETWORK_HOME}/scripts/utils.sh

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${TEST_NETWORK_HOME}/organizations/ordererOrganizations/lithium.com/tlsca/tlsca.lithium.com-cert.pem
export PEER0_HOSP1_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/hosp1.lithium.com/tlsca/tlsca.hosp1.lithium.com-cert.pem
export PEER0_HOSP2_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/hosp2.lithium.com/tlsca/tlsca.hosp2.lithium.com-cert.pem
export PEER0_SUPER_CA=${TEST_NETWORK_HOME}/organizations/peerOrganizations/superOrg.lithium.com/tlsca/tlsca.superOrg.lithium.com-cert.pem

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  infoln "Using organization ${USING_ORG}"
  if [ "$USING_ORG" = "hosp1" ]; then
    export CORE_PEER_LOCALMSPID=hosp1MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_HOSP1_CA
    export CORE_PEER_MSPCONFIGPATH=${TEST_NETWORK_HOME}/organizations/peerOrganizations/hosp1.lithium.com/users/Admin@hosp1.lithium.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
  elif [ "$USING_ORG" = "hosp2" ]; then
    export CORE_PEER_LOCALMSPID=hosp2MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_HOSP2_CA
    export CORE_PEER_MSPCONFIGPATH=${TEST_NETWORK_HOME}/organizations/peerOrganizations/hosp2.lithium.com/users/Admin@hosp2.lithium.com/msp
    export CORE_PEER_ADDRESS=localhost:9051
  elif [ "$USING_ORG" = "superOrg" ]; then
    export CORE_PEER_LOCALMSPID=superOrgMSP
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_SUPER_CA
    export CORE_PEER_MSPCONFIGPATH=${TEST_NETWORK_HOME}/organizations/peerOrganizations/superOrg.lithium.com/users/Admin@superOrg.lithium.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
  else
    errorln "ORG Unknown"
  fi

  if [ "$VERBOSE" = "true" ]; then
    env | grep CORE
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1
    PEER="peer0.$1"
    ## Set peer addresses
    if [ -z "$PEERS" ]
    then
	PEERS="$PEER"
    else
	PEERS="$PEERS $PEER"
    fi
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
    ## Set path to TLS certificate
    if [ "$1" = "hosp1" ]; then
      CA=PEER0_HOSP1_CA
    elif [ "$1" = "hosp2" ]; then
      CA=PEER0_HOSP2_CA
    elif [ "$1" = "superOrg" ]; then
      CA=PEER0_SUPER_CA
    else 
      errorln "Org does not exist"
    fi
    TLSINFO=(--tlsRootCertFiles "${!CA}")
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
    # shift by one to get to the next organization
    shift
  done
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    fatalln "$2"
  fi
}
