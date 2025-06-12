'use strict';

const { Contract } = require('fabric-contract-api');
let initLedgerMaster = require('./initLedgerMaster.json');
let initLedgerPatient = require('./initLedgerPatient.json');

class PrimaryContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        for (let i = 0; i < initLedgerPatient.length; i++) {
            initLedgerPatient[i].docType = 'patient';
            try {
                let healthId = initLedgerPatient[i].healthId;
                await ctx.stub.putState(healthId, Buffer.from(JSON.stringify(initLedgerPatient[i])));
            } catch (err) {
                console.error('Error in generating patient ID:', err);
                healthId = this.generateHealthId();
                await ctx.stub.putState(healthId, Buffer.from(JSON.stringify(initLedgerPatient[i])));
            }
            console.info('Added <--> ', initLedgerPatient[i]);
        }
        console.info('============= END : Initialize Ledger ===========');

        console.info('============= START : Initialize Ledger ===========');
        for (let i = 0; i < initLedgerMaster.length; i++) {
            initLedgerMaster[i].docType = 'bag';
            if (initLedgerMaster[i]["type"] == "tempRecord")
                await ctx.stub.putState('T' + initLedgerMaster[i]["bloodBagUnitNo"] + "S" + initLedgerMaster[i]["bloodBagSegmentNo"], Buffer.from(JSON.stringify(initLedgerMaster[i])));
            else
                await ctx.stub.putState('F' + initLedgerMaster[i]["bloodBagUnitNo"] + "S" + initLedgerMaster[i]["bloodBagSegmentNo"], Buffer.from(JSON.stringify(initLedgerMaster[i])));
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async readPatient(ctx, healthId) {
        const exists = await this.patientExists(ctx, healthId);
        if (!exists) {
            throw new Error(`The patient ${healthId} does not exist`);
        }

        const buffer = await ctx.stub.getState(healthId);
        let asset = JSON.parse(buffer.toString());
        asset = ({
            healthId: healthId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            dob: asset.dob,
            phoneNumber: asset.phoneNumber,
            aadhar: asset.aadhar,
            address: asset.address,
            sex: asset.sex,
            bloodGroup: asset.bloodGroup,
            medicalHistory: asset.medicalHistory,
            donationHistory: asset.donationHistory,
            alert: asset.alert,
            isDiseased: asset.isDiseased,
            healthCreditPoints: asset.healthCreditPoints,
            deferralStatus: asset.deferralStatus,
            permissionGranted: asset.permissionGranted,
            deferredDetails: asset.deferredDetails,
            creationTimestamp: asset.creationTimestamp,
            sensitiveDataPermissionGranted: asset.sensitiveDataPermissionGranted,
            sensitiveDataRequests: asset.sensitiveDataRequests,
            password: asset.password,
            pwdTemp: asset.pwdTemp
        });
        return asset;
    }

    async readBag(ctx, bagId) {
        const exists = await this.bagExists(ctx, bagId);
        if (!exists) {
            throw new Error(`The bag ${bagId} does not exist`);
        }

        const buffer = await ctx.stub.getState(bagId);
        let asset = JSON.parse(buffer.toString());
        asset = ({
            bloodBagUnitNo: asset.bloodBagUnitNo,
            bloodBagSegmentNo: asset.bloodBagSegmentNo,
            type: asset.type,
            dateOfCollection: asset.dateOfCollection,
            dateOfExpiry: asset.dateOfExpiry,
            quantity: asset.quantity,
            bloodGroup: asset.bloodGroup,
            hospName: asset.hospName
        });
        return asset;
    }

    async patientExists(ctx, healthId) {
        const buffer = await ctx.stub.getState(healthId);
        return (!!buffer && buffer.length > 0);
    }

    async bagExists(ctx, bagId) {
        const buffer = await ctx.stub.getState(bagId);
        return (!!buffer && buffer.length > 0);
    }

    async getQueryResultForQueryString(ctx, queryString) {
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        console.info('getQueryResultForQueryString <--> ', resultsIterator);
        let results = await this.getAllPatientResults(resultsIterator, false);
        return JSON.stringify(results);
    }

    async getAllPatientResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                // console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                    jsonRes.Timestamp = res.value.timestamp;
                }
                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                console.log('end of data');
                console.info("INFO: " + allResults.length + " records fetched.");
                // console.debug(allResults)
                return allResults;
            }
        }
    }
}
module.exports = PrimaryContract;
