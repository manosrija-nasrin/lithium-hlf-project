'use strict';
const DeferredDonor = require('./DeferredDonor.js');
const PrimaryContract = require('./primary-contract.js');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Certificate } = require('@fidm/x509');
const deferredDonorPrivateCollection = 'deferredDonorPrivateCollection';
const pendingCUECollection = 'pendingCUECollection';
const HOSP_SUPERS = ["HOSP1-SUP12226", "HOSP2-SUP12227"];

class SuperContract extends PrimaryContract {
    // verifyClientOrgMatchesPeerOrg is an internal function used verify client org id and matches peer org id.
    verifyClientOrgMatchesPeerOrg(ctx) {
        const clientMSPID = ctx.clientIdentity.getMSPID();
        const peerMSPID = ctx.stub.getMspID();
        console.debug("Creator: ", ctx.stub.getCreator());
        if (clientMSPID !== peerMSPID) {
            throw new Error('client from org %v is not authorized to read or write private data from an org ' + clientMSPID + ' peer ' + peerMSPID);
        }
    }

    // Extract and deserialize the identity
    async getTxnCreatorIdentity(ctx) {
        const txnCreator = ctx.stub.getCreator();
        const idBytes = txnCreator.idBytes;

        // Convert Uint8Array to a string (PEM format)
        const pemCert = Buffer.from(idBytes).toString('utf8');

        // console.debug("PEM Certificate:\n", pemCert);

        // Parse the certificate using @fidm/x509
        const cert = Certificate.fromPEM(Buffer.from(pemCert));

        // Extract relevant identity details
        const identity = {
            mspid: txnCreator.mspid,
            subject: cert.subject.commonName,
            issuer: cert.issuer.commonName,
            validity: {
                start: cert.validFrom,
                end: cert.validTo,
            },
        };

        return identity;
    }

    checkSuperIdentity(ctx, username) {
        // const txnCreator = ctx.stub.getCreator();
        // console.debug("Txn Creator: ", txnCreator);
        console.debug("Txn Creator via Function: ", this.getTxnCreatorIdentity(ctx));
        // console.debug("Client ID: ", ctx.clientIdentity.getID());
        // console.debug("Client MSP ID: ", ctx.clientIdentity.getMSPID());
        console.debug("Peer MSP ID: /", ctx.stub.getMspID() + "/"); // 
        if (username.includes("SUP") && HOSP_SUPERS.includes(username)) {
            return true;
        } else return false;
    }

    fetchLimitedFields(assets, includeTimeStamp = false) {
        try {
            const newAssets = [];
            console.debug("Asset list length", assets.length);
            for (let i = 0; i < assets.length && assets[i].Key.includes("PID"); i++) {
                const obj = assets[i];
                const newObj = {
                    donorId: obj.Key,
                    donationHistory: 'donationHistory' in obj.Record ? obj.Record.donationHistory : null,
                };
                // console.debug("Object:", obj.Record.donationHistory);
                // console.debug("Keys:", Object.keys(obj.Record.donationHistory));
                if (includeTimeStamp)
                    newObj.Timestamp = obj.Timestamp;
                newAssets.push(newObj);
            }

            return newAssets;
        } catch (error) {
            console.error("Error while fetching limited fields", error);
        }
    };

    async queryAllDonors(ctx) {
        let resultsIterator;
        const assets = [];

        try {
            resultsIterator = await ctx.stub.getStateByRange('', '');
            while (true) {
                const res = await resultsIterator.next();
                if (res.value && res.value.value) {
                    const key = res.value.key;
                    // console.debug("Key:", key);
                    let value;
                    try {
                        value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (error) {
                        console.error("Error while parsing JSON for Record: ", error);
                        value = res.value.value.toString('utf8');
                    }
                    const timestamp = res.value.timestamp;
                    if (key && key.startsWith("PID"))
                        assets.push({ Key: key, Record: value, Timestamp: timestamp });
                }
                if (res.done) {
                    await resultsIterator.close();
                    console.debug("All done, fetched ", assets.length, " donor records.");
                    const limitedAssets = this.fetchLimitedFields(assets);
                    return limitedAssets;
                }
            }
        } catch (error) {
            console.error('Error during query: ', error);
            throw new Error('Failed to query donors');
        } /* finally {
            if (resultsIterator) {
                await resultsIterator.close(); // Ensure iterator is closed even if an error occurs
            }
        } */
    }

    fetchFields(asset, includeTimeStamp = false) {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                donorId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                dob: obj.Record.dob,
                bloodGroup: obj.Record.bloodGroup,
                alert: obj.Record.alert,
                sex: obj.Record.sex,
                isDiseased: obj.Record.isDiseased,
                creditCard: obj.Record.creditCard,
                donationHistory: obj.Record.donationHistory,
                donationStatus: obj.Record.donationStatus,
                deferredBy: obj.Record.deferredBy,
                deferredDate: obj.Record.deferredDate,
                deferredReason: obj.Record.deferredReason,
                deferredTenure: obj.Record.deferredTenure,
                bloodBagUnitNo: obj.Record.bloodBagUnitNo,
                bloodBagSegmentNo: obj.Record.bloodBagSegmentNo
            };
            if (includeTimeStamp) {
                asset[i].Timestamp = obj.Timestamp;
            }
        }

        return asset;
    };
    // const deferredData = {"deferredOn": date, "deferredTenure": 365, "reasons": reasonsJson.reasons, "deferredBy": parsedArgs.username, 
    // "bloodBagUnitNo": parsedArgs.bloodBagUnitNo, "bloodBagSegmentNo": parsedArgs.bloodBagSegmentNo};
    fetchFieldsForPendingDeferredDonors(assets, includeTimeStamp = false) {
        for (let i = 0; i < assets.length; i++) {
            const obj = assets[i];
            assets[i] = {
                recordId: obj.Key,
                deferredStatus: obj.Record.deferredStatus,
                deferredOn: obj.Record.deferredOn,
                deferredTenure: obj.Record.deferredTenure,
                deferredBy: obj.Record.deferredBy,
                bloodBagUnitNo: obj.Record.bloodBagUnitNo,
                bloodBagSegmentNo: obj.Record.bloodBagSegmentNo,
                reasons: obj.Record.reasons,
            };
            if (includeTimeStamp) {
                assets[i].Timestamp = obj.Timestamp;
            }
        }
        return assets;
    }

    async queryAllDeferredDonors(ctx, args) {
        try {
            // this.verifyClientOrgMatchesPeerOrg(ctx);
            const msp = ctx.stub.getMspID() + "";

            if (msp.trim() == "superOrgMSP") {
                const parsedArgs = JSON.parse(args);
                const superId = parsedArgs.username;

                if (superId === undefined || superId === null || superId === '') {
                    return { error: "Super ID not provided" };
                } else if (!this.checkSuperIdentity(ctx, superId)) {
                    return { error: "Permission not granted to " + superId };
                }

                let resultsIterator = await ctx.stub.getPrivateDataByRange(deferredDonorPrivateCollection, '', '');
                let assets = await PrimaryContract.prototype.getAllDonorResults(resultsIterator.iterator, false);

                return this.fetchFields(assets);
            } else {
                return { "status": "error", "message": `${msp} not authorized to read ${deferredDonorPrivateCollection}` };
            }
        } catch (error) {
            console.error(error);
            return { error: error };
        }
    };

    async queryDonorsForBagId(ctx, args) {
        let parsedArgs = JSON.parse(args);

        let assets = await this.queryAllDonors(ctx);
        console.debug("Received ", assets.length, " entries");
        // console.debug("Sample asset: ", typeof(assets));
        // console.debug(assets[0]);

        for (let i = 0; i < assets.length; i++) {
            let donationHistory = assets[i].donationHistory;
            // console.debug("Donor ", assets[i].donorId, ": ", donationHistory);
            if (donationHistory !== null) {
                const numberOfDonations = Object.keys(donationHistory).length;
                console.debug("For donor, ", assets[i].donorId, ", donation history length: ", numberOfDonations);
                if (numberOfDonations > 0) {
                    let currentDonation;
                    for (let j = 0; j < numberOfDonations; j++) {
                        currentDonation = donationHistory['donation' + (j + 1)];
                        // console.debug("Searching donation ", currentDonation);
                        if (currentDonation['status'] === 'successful' && currentDonation['bloodBagUnitNo'] == parsedArgs.bloodBagUnitNo && currentDonation['bloodBagSegmentNo'] == parsedArgs.bloodBagSegmentNo) {
                            console.debug("Donor found: ", assets[i].donorId);
                            return { status: "success", donorId: assets[i].donorId };
                        }
                    }
                }

            }
        }
        console.debug("Donor for bag not found");
        return { status: "error", message: "Donor for bag not found", donorId: null };
    };

    async updateDonorMedicalDetailsForDeferral(ctx, args) {
        args = JSON.parse(args);
        let donorId = args.donorId;
        let newAlert = true;
        let newIsDiseased = true;
        let newDonationStatus = args.donationStatus;
        let isDataChanged = false;

        const donor = await PrimaryContract.prototype.readDonor(ctx, donorId);

        if (donor.alert !== newAlert) {
            donor.alert = newAlert;
            isDataChanged = true;
        }

        if (donor.isDiseased !== newIsDiseased) {
            donor.isDiseased = newIsDiseased;
            isDataChanged = true;
        }

        if (donor.donationStatus !== newDonationStatus) {
            donor.donationStatus = newDonationStatus;
            isDataChanged = true;
        }


        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    };

    async deferDonorOfBag(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            // const donorId = await this.queryDonorsForBagId(ctx, args);
            const donorId = parsedArgs.donorId;
            const donor = parsedArgs.donor;
            if (donorId !== null) {
                // console.debug("Received donor ID from query: ", donorId);
                // console.debug("Received donor ID from query string: ", donorId.toString());

                let changedMedicalDetails = { donorId: donorId, alert: true, isDiseased: true, donationStatus: parsedArgs.deferredStatus };
                await this.updateDonorMedicalDetailsForDeferral(ctx, JSON.stringify(changedMedicalDetails));
                const msp = ctx.stub.getMspID() + "";

                if (msp.trim() == "superOrgMSP") {
                    // PDC Write operations only on authorized peers
                    console.debug("MSP: " + ctx.stub.getMspID());
                    // const date = new Date().toISOString().split("T")[0];
                    const deferredDonor = new DeferredDonor(donor, parsedArgs.deferredStatus, parsedArgs.deferredOn, parsedArgs.deferredTenure, parsedArgs.reasons, parsedArgs.deferredBy, parsedArgs.bloodBagUnitNo, parsedArgs.bloodBagSegmentNo);
                    const plainDeferredDonor = JSON.parse(JSON.stringify(deferredDonor));
                    console.debug("Putting deferred donor to ledger: ", plainDeferredDonor);
                    console.debug("Type: ", typeof (plainDeferredDonor));
                    await ctx.stub.putPrivateData(deferredDonorPrivateCollection, donorId, Buffer.from(stringify(sortKeysRecursive(plainDeferredDonor))));
                    return { status: "success", peer: ctx.stub.getMspID(), message: `Data written to PDC ${deferredDonorPrivateCollection}` }
                } else {
                    console.warn(`PDC write skipped on peer with MSP: /${msp}/`);
                }

                return { status: "success", peer: `/${ctx.stub.getMspID()}/` };
            } else {
                console.debug("Check blood bag ID. Donor not found.");
                return { status: "error", error: "Donor not found" };
            }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    };

    async getAllPendingBags(ctx, args) {
        try {
            // this.verifyClientOrgMatchesPeerOrg(ctx);
            const msp = ctx.stub.getMspID() + "";

            if (msp.trim() == "superOrgMSP") {
                const parsedArgs = JSON.parse(args);
                const superId = parsedArgs.username;

                if (superId === undefined || superId === null || superId === '') {
                    return { error: "Super ID not provided" };
                } else if (!this.checkSuperIdentity(ctx, superId)) {
                    return { error: "Permission not granted to " + superId };
                }
                let resultsIterator = await ctx.stub.getPrivateDataByRange(pendingCUECollection, '', '');
                let assets = await PrimaryContract.prototype.getAllDonorResults(resultsIterator.iterator, false);

                let pendingBagsForDeferral = this.fetchFieldsForPendingDeferredDonors(assets);
                console.debug(`Received ${pendingBagsForDeferral.length} entries`);

                let pendingBagIds = [];
                for (let i = 0; i < pendingBagsForDeferral.length; i++) {
                    pendingBagIds.push(pendingBagsForDeferral[i].recordId);
                }
                return { status: "success", pendingBags: pendingBagIds, count: pendingBagIds.length };
            }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    };

    async deferPendingDonors(ctx, args) {
        try {
            // this.verifyClientOrgMatchesPeerOrg(ctx);
            const msp = ctx.stub.getMspID() + "";

            if (msp.trim() == "superOrgMSP") {
                const parsedArgs = JSON.parse(args);
                const superId = parsedArgs.username;

                if (superId === undefined || superId === null || superId === '') {
                    return { error: "Super ID not provided" };
                } else if (!this.checkSuperIdentity(ctx, superId)) {
                    return { error: "Permission not granted to " + superId };
                }

                const pendingBagRecordsForDeferral = [];
                const invalidBags = [];
                const pendingBagIds = parsedArgs.pendingBags;
                const pendingBags = [];
                for (let i = 0; i < pendingBagIds.length; i++) {
                    // don't use getPrivateDataByRange: https://lists.lfdecentralizedtrust.org/g/fabric/topic/85330623#10296
                    let responseBytes = await ctx.stub.getPrivateData(pendingCUECollection, pendingBagIds[i]);
                    try {
                        let responseJson = JSON.parse(responseBytes.toString());
                        pendingBagRecordsForDeferral.push(responseJson);
                        pendingBags.push(pendingBagIds[i]);
                    } catch (error) {
                        console.debug(`${pendingBagIds[i]} is not a valid bag ID. Skipping...`);
                        invalidBags.push(pendingBagIds[i]);
                    }
                }

                console.debug(`Received ${pendingBagRecordsForDeferral.length} entries`);
                let deferredBagsCount = 0;
                const deferredDonorDetails = [];
                for (let i = 0; i < pendingBagRecordsForDeferral.length; i++) {
                    let bag = pendingBagRecordsForDeferral[i];
                    let donorId = null;
                    if (!pendingBagIds[i].startsWith("PID")) {
                        let response = await this.queryDonorsForBagId(ctx, JSON.stringify(bag));
                        console.debug(response);
                        donorId = "donorId" in response ? response.donorId : null;
                    } else {
                        donorId = pendingBagIds[i];
                    }
                    if (donorId !== null) {
                        const donor = await PrimaryContract.prototype.readDonor(ctx, donorId);
                        console.debug("Donor object read: ", donor);
                        let deferredDonorDetail = {
                            ...bag,
                            donorId: donorId,
                            donor: donor,
                            bagId: pendingBags[i].startsWith("PID") ? null : pendingBagIds[i],
                            recordId: pendingBags[i]
                        };
                        deferredDonorDetails.push(deferredDonorDetail);
                    }
                }
                for (let i = 0; i < deferredDonorDetails.length; i++) {
                    const deferredDonorDetail = deferredDonorDetails[i];
                    const response = await this.deferDonorOfBag(ctx, JSON.stringify(deferredDonorDetail));
                    if (response.status == "success") {
                        console.debug("Bag to be deleted: " + pendingBags[i]);
                        const deletePendingBagResponse = await ctx.stub.deletePrivateData(pendingCUECollection, deferredDonorDetail.recordId);
                        console.debug(deletePendingBagResponse.toString());
                        deferredBagsCount++;
                    }
                }

                for (let i = 0; i < invalidBags.length; i++) {
                    const deletePendingBagResponse = await ctx.stub.deletePrivateData(pendingCUECollection, invalidBags[i]);
                    console.debug(deletePendingBagResponse.toString());
                    deferredBagsCount++;
                }
                return { status: "success", message: `Deferred ${deferredBagsCount} out of ${pendingBagRecordsForDeferral.length} donors via ${msp}` }

            } else {
                return { status: "error", message: `${msp} not authorized to read ${pendingCUECollection}` };
            }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    };
}

module.exports = SuperContract;