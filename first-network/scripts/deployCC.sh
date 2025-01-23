#!/bin/bash

source scripts/utils.sh

CHANNEL_NAME=${1:-"mychannel"}
CC_NAME=${2}
CC_SRC_PATH=${3}
CC_SRC_LANGUAGE=${4}
CC_VERSION=${5:-"1.0"}
CC_SEQUENCE=${6:-"1"}
CC_INIT_FCN=${7:-"NA"}
CC_END_POLICY=${8:-"NA"}
CC_COLL_CONFIG=${9:-"NA"}
DELAY=${10:-"3"}
MAX_RETRY=${11:-"5"}
VERBOSE=${12:-"false"}

println "executing with the following"
println "- CHANNEL_NAME: ${C_GREEN}${CHANNEL_NAME}${C_RESET}"
println "- CC_NAME: ${C_GREEN}${CC_NAME}${C_RESET}"
println "- CC_SRC_PATH: ${C_GREEN}${CC_SRC_PATH}${C_RESET}"
println "- CC_SRC_LANGUAGE: ${C_GREEN}${CC_SRC_LANGUAGE}${C_RESET}"
println "- CC_VERSION: ${C_GREEN}${CC_VERSION}${C_RESET}"
println "- CC_SEQUENCE: ${C_GREEN}${CC_SEQUENCE}${C_RESET}"
println "- CC_END_POLICY: ${C_GREEN}${CC_END_POLICY}${C_RESET}"
println "- CC_COLL_CONFIG: ${C_GREEN}${CC_COLL_CONFIG}${C_RESET}"
println "- CC_INIT_FCN: ${C_GREEN}${CC_INIT_FCN}${C_RESET}"
println "- DELAY: ${C_GREEN}${DELAY}${C_RESET}"
println "- MAX_RETRY: ${C_GREEN}${MAX_RETRY}${C_RESET}"
println "- VERBOSE: ${C_GREEN}${VERBOSE}${C_RESET}"

INIT_REQUIRED="--init-required"
# check if the init fcn should be called
if [ "$CC_INIT_FCN" = "NA" ]; then
  INIT_REQUIRED=""
fi

if [ "$CC_END_POLICY" = "NA" ]; then
  CC_END_POLICY=""
else
  CC_END_POLICY="--signature-policy $CC_END_POLICY"
fi

if [ "$CC_COLL_CONFIG" = "NA" ]; then
  CC_COLL_CONFIG=""
else
  CC_COLL_CONFIG="--collections-config $CC_COLL_CONFIG"
fi

FABRIC_CFG_PATH=$PWD/../config/

# import utils
. scripts/envVar.sh
. scripts/ccutils.sh

function checkPrereqs() {
  jq --version > /dev/null 2>&1

  if [[ $? -ne 0 ]]; then
    errorln "jq command not found..."
    errorln
    errorln "Follow the instructions in the Fabric docs to install the prereqs"
    errorln "https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html"
    exit 1
  fi
}

#check for prerequisites
checkPrereqs

## package the chaincode
./scripts/packageCC.sh $CC_NAME $CC_SRC_PATH $CC_SRC_LANGUAGE $CC_VERSION 

PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)

## Install chaincode on peer0.hosp1 and peer0.hosp2
infoln "Installing chaincode on peer0.hosp1..."
installChaincode hosp1
infoln "Install chaincode on peer0.hosp2..."
installChaincode hosp2
infoln "Install chaincode on peer0.superOrg..."
installChaincode superOrg

resolveSequence

## query whether the chaincode is installed
queryInstalled hosp1

## approve the definition for hosp1
approveForMyOrg hosp1

## check whether the chaincode definition is ready to be committed
## expect hosp1 to have approved and hosp2 not to
checkCommitReadiness hosp1 "\"hosp1MSP\": true" "\"hosp2MSP\": false" "\"superOrgMSP\": false"
checkCommitReadiness hosp2 "\"hosp1MSP\": true" "\"hosp2MSP\": false" "\"superOrgMSP\": false"
checkCommitReadiness superOrg "\"hosp1MSP\": true" "\"hosp2MSP\": false" "\"superOrgMSP\": false"

## now approve also for hosp2
approveForMyOrg hosp2

## check whether the chaincode definition is ready to be committed
## expect them both to have approved
checkCommitReadiness hosp1 "\"hosp1MSP\": true" "\"hosp2MSP\": true" "\"superOrgMSP\": false"
checkCommitReadiness hosp2 "\"hosp1MSP\": true" "\"hosp2MSP\": true" "\"superOrgMSP\": false"
checkCommitReadiness superOrg "\"hosp1MSP\": true" "\"hosp2MSP\": true" "\"superOrgMSP\": false"

## finally approve for superOrg
approveForMyOrg superOrg

## check whether the chaincode definition is ready to be committed
## expect them to have approved
checkCommitReadiness hosp1 "\"hosp1MSP\": true" "\"hosp2MSP\": true" "\"superOrgMSP\": true"
checkCommitReadiness hosp2 "\"hosp1MSP\": true" "\"hosp2MSP\": true" "\"superOrgMSP\": true"
checkCommitReadiness superOrg "\"hosp1MSP\": true" "\"hosp2MSP\": true" "\"superOrgMSP\": true"

## now that we know for sure both orgs have approved, commit the definition
commitChaincodeDefinition hosp1 hosp2 superOrg

## query on both orgs to see that the definition committed successfully
queryCommitted hosp1
queryCommitted hosp2
queryCommitted superOrg

## Invoke the chaincode - this does require that the chaincode have the 'initLedger'
## method defined
if [ "$CC_INIT_FCN" = "NA" ]; then
  infoln "Chaincode initialization is not required"
else
  chaincodeInvokeInit hosp1 hosp2 superOrg
fi

exit 0
