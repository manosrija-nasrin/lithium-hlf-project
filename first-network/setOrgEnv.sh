#!/bin/bash
#
# SPDX-License-Identifier: Apache-2.0




# default to using Org1
ORG=${1:-Org1}

# Exit on first error, print all commands.
set -e
set -o pipefail

# Where am I?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

ORDERER_CA=${DIR}/first-network/organizations/ordererOrganizations/lithium.com/tlsca/tlsca.lithium.com-cert.pem
PEER0_HOSP1_CA=${DIR}/first-network/organizations/peerOrganizations/hosp1.lithium.com/tlsca/tlsca.hosp1.lithium.com-cert.pem
PEER0_HOSP2_CA=${DIR}/first-network/organizations/peerOrganizations/hosp2.lithium.com/tlsca/tlsca.hosp2.lithium.com-cert.pem
PEER0_SUPER_CA=${DIR}/first-network/organizations/peerOrganizations/superOrg.lithium.com/tlsca/tlsca.superOrg.lithium.com-cert.pem


if [[ ${ORG,,} == "hosp1" || ${ORG,,} == "digibank" ]]; then

   CORE_PEER_LOCALMSPID=hosp1MSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/first-network/organizations/peerOrganizations/hosp1.lithium.com/users/Admin@hosp1.lithium.com/msp
   CORE_PEER_ADDRESS=localhost:7051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/first-network/organizations/peerOrganizations/hosp1.lithium.com/tlsca/tlsca.hosp1.lithium.com-cert.pem

elif [[ ${ORG,,} == "hosp2" || ${ORG,,} == "magnetocorp" ]]; then

   CORE_PEER_LOCALMSPID=hosp2MSP
   CORE_PEER_MSPCONFIGPATH=${DIR}/first-network/organizations/peerOrganizations/hosp2.lithium.com/users/Admin@hosp2.lithium.com/msp
   CORE_PEER_ADDRESS=localhost:9051
   CORE_PEER_TLS_ROOTCERT_FILE=${DIR}/first-network/organizations/peerOrganizations/hosp2.lithium.com/tlsca/tlsca.hosp2.lithium.com-cert.pem

else
   echo "Unknown \"$ORG\", please choose Org1/Digibank or Org2/Magnetocorp"
   echo "For example to get the environment variables to set upa Org2 shell environment run:  ./setOrgEnv.sh Org2"
   echo
   echo "This can be automated to set them as well with:"
   echo
   echo 'export $(./setOrgEnv.sh Org2 | xargs)'
   exit 1
fi

# output the variables that need to be set
echo "CORE_PEER_TLS_ENABLED=true"
echo "ORDERER_CA=${ORDERER_CA}"
echo "PEER0_HOSP1_CA=${PEER0_HOSP1_CA}"
echo "PEER0_HOSP2_CA=${PEER0_HOSP2_CA}"
echo "PEER0_SUPER_CA=${PEER0_SUPER_CA}"

echo "CORE_PEER_MSPCONFIGPATH=${CORE_PEER_MSPCONFIGPATH}"
echo "CORE_PEER_ADDRESS=${CORE_PEER_ADDRESS}"
echo "CORE_PEER_TLS_ROOTCERT_FILE=${CORE_PEER_TLS_ROOTCERT_FILE}"

echo "CORE_PEER_LOCALMSPID=${CORE_PEER_LOCALMSPID}"
