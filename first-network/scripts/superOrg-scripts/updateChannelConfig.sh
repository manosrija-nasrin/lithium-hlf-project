#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# This script is designed to be run by addSuperOrg.sh as the
# first step of the Adding an Org to a Channel tutorial.
# It creates and submits a configuration transaction to
# add superOrg to the test network

CHANNEL_NAME="$1"
DELAY="$2"
TIMEOUT="$3"
VERBOSE="$4"
: ${CHANNEL_NAME:="mychannel"}
: ${DELAY:="3"}
: ${TIMEOUT:="10"}
: ${VERBOSE:="false"}
COUNTER=1
MAX_RETRY=5


# imports
# test network home var targets to first-network folder
# the reason we use a var here is considering with superOrg specific folder
# when invoking this for superOrg as first-network/scripts/superOrg-scripts
# the value is changed from default as $PWD (first-network)
# to ${PWD}/.. to make the import works
export TEST_NETWORK_HOME="${PWD}/.."
. ${TEST_NETWORK_HOME}/scripts/configUpdate.sh 

infoln "Creating config transaction to add superOrg to network"

# Fetch the config for the channel, writing it to config.json
fetchChannelConfig hosp1 ${CHANNEL_NAME} ${TEST_NETWORK_HOME}/channel-artifacts/config.json

# Modify the configuration to append the new org
set -x
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"superOrgMSP":.[1]}}}}}' ${TEST_NETWORK_HOME}/channel-artifacts/config.json ${TEST_NETWORK_HOME}/organizations/peerOrganizations/superOrg.lithium.com/superOrg.json > ${TEST_NETWORK_HOME}/channel-artifacts/modified_config.json
{ set +x; } 2>/dev/null

# Compute a config update, based on the differences between config.json and modified_config.json, write it as a transaction to superOrg_update_in_envelope.pb
createConfigUpdate ${CHANNEL_NAME} ${TEST_NETWORK_HOME}/channel-artifacts/config.json ${TEST_NETWORK_HOME}/channel-artifacts/modified_config.json ${TEST_NETWORK_HOME}/channel-artifacts/superOrg_update_in_envelope.pb

infoln "Signing config transaction"
signConfigtxAsPeerOrg hosp1 ${TEST_NETWORK_HOME}/channel-artifacts/superOrg_update_in_envelope.pb

infoln "Submitting transaction from a different peer (peer0.hosp2) which also signs it"
setGlobals hosp2
set -x
peer channel update -f ${TEST_NETWORK_HOME}/channel-artifacts/superOrg_update_in_envelope.pb -c ${CHANNEL_NAME} -o localhost:7050 --ordererTLSHostnameOverride orderer.lithium.com --tls --cafile "$ORDERER_CA"
{ set +x; } 2>/dev/null

successln "Config transaction to add superOrg to network submitted"
