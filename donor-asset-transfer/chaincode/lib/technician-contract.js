'use strict';
const BlockedDonor = require('./BlockedDonor.js');
const DoctorContract = require('./doctor-contract.js');
const Donor = require('./Donor.js');
const PrimaryContract = require('./primary-contract.js');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const privateCollection = 'blockedDonorPrivateCollection';

class TechnicianContract extends PrimaryContract {
    // verifyClientOrgMatchesPeerOrg is an internal function used verify client org id and matches peer org id.
    verifyClientOrgMatchesPeerOrg(ctx) {
        const clientMSPID = ctx.clientIdentity.getMSPID();
        const peerMSPID = ctx.stub.getMspID();

        if (clientMSPID !== peerMSPID) {
            throw new Error('client from org %v is not authorized to read or write private data from an org ' + clientMSPID + ' peer ' + peerMSPID);
        }
    }

    async readBag(ctx, args) {
        let ar = JSON.parse(args);
        let bagID = (ar.bloodBagType == 'temprecord' ? 'T' : 'F') + ar.bloodBagUnitNo + 'S' + ar.bloodBagSegmentNo;
        let asset = await PrimaryContract.prototype.readBag(ctx, bagID)
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

    fetchLimitedFields(assets, includeTimeStamp = false) {
        for (let i = 0; i < assets.length && assets[i].Key.includes("PID"); i++) {
            const obj = assets[i];
            assets[i] = {
                donorId: obj.Key,
                donationHistory: 'donationHistory' in obj.Record ? obj.Record.donationHistory : null,
            };
            if (includeTimeStamp)
                assets[i].Timestamp = obj.Timestamp;
        }

        return assets;
    };

    async queryAllDonors(ctx) {
        let resultsIterator;

        try {
            resultsIterator = await ctx.stub.getStateByRange('', '');
            const assets = [];
            while (true) {
                const res = await resultsIterator.next();
                if (res.value && res.value.value) {
                    const key = res.value.key;
                    let value;
                    try {
                        value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (error) {
                        console.error("Error while parsing JSON for Record: ", error);
                        value = res.value.value.toString('utf8');
                    }
                    const timestamp = res.value.timestamp;
                    assets.push({ Key: key, Record: value, Timestamp: timestamp });
                }
                if (res.done) {
                    break;
                }
            }
            return this.fetchLimitedFields(assets);
        } catch (error) {
            console.error('Error during query: ', error);
            throw new Error('Failed to query donors');
        } finally {
            if (resultsIterator) {
                await resultsIterator.close(); // Ensure iterator is closed even if an error occurs
            }
        }
    }

    async queryDonorsInBatches(ctx, batchSize = 50) {
        const allResults = [];
        let startKey = '';
        let endKey = '';

        while (true) {
            const iterator = await ctx.stub.getStateByRange(startKey, endKey);
            const batchResults = [];
            let count = 0;

            while (count < batchSize) {
                const res = await iterator.next();
                if (res.value && res.value.value) {
                    const key = res.value.key;
                    let value;
                    try {
                        value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (error) {
                        value = res.value.value.toString('utf8');
                    }
                    const timestamp = res.value.timestamp;
                    batchResults.push({ Key: key, Record: value, Timestamp: timestamp });
                }
                if (res.done) {
                    await iterator.close();
                    console.info("Reading complete");
                    allResults = allResults.concat(batchResults);
                    return this.fetchLimitedFields(allResults);
                }
                count++;
            }
            await iterator.close();
            startKey = batchResults[batchResults.length - 1].Key;
            allResults.push(...batchResults);
        }
    }

    queryDonorsForBagId(ctx, args) {
        let parsedArgs = JSON.parse(args);

        let assets = this.queryAllDonors(ctx);

        for (let i = 0; i < assets.length; i++) {
            let donationHistory = assets[i].donationHistory;
            if (donationHistory !== null) {
                const numberOfDonations = Object.keys(donationHistory).length;
                console.debug("For donor, ", assets[i].donorId, ", donation history length: ", numberOfDonations);
                if (numberOfDonations > 0) {
                    let currentDonation;
                    for (let j = 0; j < numberOfDonations; j++) {
                        currentDonation = donationHistory['donation' + (j + 1)];
                        console.debug("Searching donation ", currentDonation);
                        if (currentDonation['status'] === 'successful' && currentDonation['bloodBagUnitNo'] == parsedArgs.bloodBagUnitNo && currentDonation['bloodBagSegmentNo'] == parsedArgs.bloodBagSegmentNo) {
                            return assets[i].donorId;
                        }
                    }
                }

            }
        }

        throw new Error("Bag not found");
    }

    async blockDonorOfBag(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            const transientMap = ctx.stub.getTransient();
            const transient = transientMap.get("transientData");
            if (!transient) {
                throw new Error("No transient data");
            }
            const reasonsJson = JSON.parse(transient.toString());
            console.debug(reasonsJson, "> reasons extracted: ", reasonsJson.reasons);
            this.verifyClientOrgMatchesPeerOrg(ctx);

            const donorId = this.queryDonorsForBagId(ctx, args);
            let changedMedicalDetails = { donorId: donorId, alert: true, isDiseased: true, donationStatus: 'blocked' };
            const donor = new Donor(PrimaryContract.prototype.readDonor(ctx, donorId));

            DoctorContract.prototype.updateDonorMedicalDetails(ctx, JSON.stringify(changedMedicalDetails));
            const date = new Date().toISOString().split("T")[0];
            const blockedDonor = new BlockedDonor(donor, date, 365, reasonsJson.reasons, parsedArgs.username, parsedArgs.bloodBagUnitNo, parsedArgs.bloodBagSegmentNo);

            await ctx.stub.putPrivateData(privateCollection, donorId, Buffer.from(stringify(sortKeysRecursive(blockedDonor))));

            return { status: "success" };
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }

    }
}

module.exports = TechnicianContract;