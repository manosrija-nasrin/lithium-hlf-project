#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function createHosp3 {
	infoln "Enrolling the CA admin"
	mkdir -p ../organizations/peerOrganizations/hosp3.lithium.com/

	export FABRIC_CA_CLIENT_HOME=${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:11054 --caname ca-hosp3 --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-hosp3.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-hosp3.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-hosp3.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-11054-ca-hosp3.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/msp/config.yaml"

	infoln "Registering peer0"
  set -x
	fabric-ca-client register --caname ca-hosp3 --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-hosp3 --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-hosp3 --id.name hosp3admin --id.secret hosp3adminpw --id.type admin --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
	fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-hosp3 -M "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/msp" --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates, use --csr.hosts to specify Subject Alternative Names"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:11054 --caname ca-hosp3 -M "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls" --enrollment.profile tls --csr.hosts peer0.hosp3.lithium.com --csr.hosts localhost --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null


  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/ca.crt"
  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/signcerts/"* "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/server.crt"
  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/keystore/"* "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/server.key"

  mkdir "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/msp/tlscacerts"
  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/msp/tlscacerts/ca.crt"

  mkdir "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/tlsca"
  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/tlsca/tlsca.hosp3.lithium.com-cert.pem"

  mkdir "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/ca"
  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/peers/peer0.hosp3.lithium.com/msp/cacerts/"* "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/ca/ca.hosp3.lithium.com-cert.pem"

  infoln "Generating the user msp"
  set -x
	fabric-ca-client enroll -u https://user1:user1pw@localhost:11054 --caname ca-hosp3 -M "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/users/User1@hosp3.lithium.com/msp" --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/users/User1@hosp3.lithium.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
	fabric-ca-client enroll -u https://hosp3admin:hosp3adminpw@localhost:11054 --caname ca-hosp3 -M "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/users/Admin@hosp3.lithium.com/msp" --tls.certfiles "${PWD}/fabric-ca/hosp3/tls-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/hosp3.lithium.com/users/Admin@hosp3.lithium.com/msp/config.yaml"
}
