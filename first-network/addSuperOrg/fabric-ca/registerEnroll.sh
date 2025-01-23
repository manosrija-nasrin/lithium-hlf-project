#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function createSuperOrg {
	infoln "Enrolling the CA admin"
	mkdir -p ../organizations/peerOrganizations/superOrg.lithium.com/

	export FABRIC_CA_CLIENT_HOME=${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/

  set -x
  fabric-ca-client enroll -u https://superOrgadmin:superOrglithium@localhost:11054 --caname ca-superOrg --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-superOrg.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-superOrg.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-superOrg.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-superOrg.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/msp/config.yaml"

	infoln "Registering peer0"
  set -x
	fabric-ca-client register --caname ca-superOrg --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-superOrg --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-superOrg --id.name superOrgsuperOrgadmin --id.secret superOrgsuperOrglithium --id.type admin --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
	fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-superOrg -M "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/msp" --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates, use --csr.hosts to specify Subject Alternative Names"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-superOrg -M "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls" --enrollment.profile tls --csr.hosts peer0.superOrg.lithium.com --csr.hosts localhost --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null


  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/ca.crt"
  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/signcerts/"* "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/server.crt"
  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/keystore/"* "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/server.key"

  mkdir "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/msp/tlscacerts"
  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/msp/tlscacerts/ca.crt"

  mkdir "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/tlsca"
  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/tlsca/tlsca.superOrg.lithium.com-cert.pem"

  mkdir "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/ca"
  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/peers/peer0.superOrg.lithium.com/msp/cacerts/"* "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/ca/ca.superOrg.lithium.com-cert.pem"

  infoln "Generating the user msp"
  set -x
	fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-superOrg -M "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/users/User1@superOrg.lithium.com/msp" --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/users/User1@superOrg.lithium.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
	fabric-ca-client enroll -u https://superOrgsuperOrgadmin:superOrgsuperOrglithium@localhost:11054 --caname ca-superOrg -M "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/users/Admin@superOrg.lithium.com/msp" --tls.certfiles "${PWD}/fabric-ca/superOrg/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/superOrg.lithium.com/users/Admin@superOrg.lithium.com/msp/config.yaml"
}
