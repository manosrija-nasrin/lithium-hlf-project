'use strict';
const DeferredPatient = require('./DeferredPatient.js');
const PrimaryContract = require('./primary-contract.js');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Certificate } = require('@fidm/x509');
const deferredPatientPrivateCollection = 'deferredDonorPrivateCollection';
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
        // console.debug("Txn Creator via Function: ", this.getTxnCreatorIdentity(ctx));
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
            for (let i = 0; i < assets.length && assets[i].Key.match(/^[0-9]{12}$/); i++) {
                const obj = assets[i];
                const newObj = {
                    healthId: obj.Key,
                    donationHistory: 'donationHistory' in obj.Record ? obj.Record.donationHistory : null,
                    sensitiveMedicalHistory: 'sensitiveMedicalHistory' in obj.Record ? obj.Record.sensitiveMedicalHistory : {},
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

    async queryAllPatients(ctx) {
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
                    if (key && key.match(/^[0-9]{12}$/))
                        assets.push({ Key: key, Record: value, Timestamp: timestamp });
                }
                if (res.done) {
                    await resultsIterator.close();
                    console.debug("All done, fetched ", assets.length, " patient records.");
                    const limitedAssets = this.fetchLimitedFields(assets);
                    return limitedAssets;
                }
            }
        } catch (error) {
            console.error('Error during query: ', error);
            throw new Error('Failed to query patients');
        } /* finally {
            if (resultsIterator) {
                await resultsIterator.close(); // Ensure iterator is closed even if an error occurs
            }
        } */
    }

    fetchFields(assets, includeTimeStamp = false) {
        let assetsWithLimitedFields = [];
        for (let i = 0; i < assets.length; i++) {
            let obj = assets[i];
            obj = {
                healthId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                dob: obj.Record.dob,
                bloodGroup: obj.Record.bloodGroup,
                alert: obj.Record.alert,
                sex: obj.Record.sex,
                isDiseased: obj.Record.isDiseased,
                healthCreditPoints: obj.Record.healthCreditPoints,
                donationHistory: obj.Record.donationHistory,
                donationStatus: obj.Record.donationStatus,
                deferredAt: obj.Record.deferredAt,
                sensitiveMedicalHistory: obj.Record.sensitiveMedicalHistory,
                deferredDate: obj.Record.deferredDate,
                deferredReason: obj.Record.deferredReason,
                deferredTenure: obj.Record.deferredTenure,
                bloodBagUnitNo: obj.Record.bloodBagUnitNo,
                bloodBagSegmentNo: obj.Record.bloodBagSegmentNo
            };
            if (includeTimeStamp) {
                obj.Timestamp = obj.Timestamp;
            }
            assetsWithLimitedFields.push(obj);
        }

        return assetsWithLimitedFields;
    };
    // const deferredData = {"deferredOn": date, "deferredTenure": 365, "reasons": reasonsJson.reasons, "deferredAt": parsedArgs.username, 
    // "bloodBagUnitNo": parsedArgs.bloodBagUnitNo, "bloodBagSegmentNo": parsedArgs.bloodBagSegmentNo};
    fetchFieldsForPendingDeferredPatients(assets, includeTimeStamp = false) {
        for (let i = 0; i < assets.length; i++) {
            const obj = assets[i];
            assets[i] = {
                recordId: obj.Key,
                deferredStatus: obj.Record.deferredStatus,
                deferredOn: obj.Record.deferredOn,
                deferredTenure: obj.Record.deferredTenure,
                deferredAt: obj.Record.deferredAt,
                bloodBagUnitNo: obj.Record.bloodBagUnitNo,
                bloodBagSegmentNo: obj.Record.bloodBagSegmentNo,
                reasons: obj.Record.reasons,
                results: obj.Record.results,
            };
            if (includeTimeStamp) {
                assets[i].Timestamp = obj.Timestamp;
            }
        }
        return assets;
    }

    async queryAllDeferredPatients(ctx, args) {
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

                let resultsIterator = await ctx.stub.getPrivateDataByRange(deferredPatientPrivateCollection, '', '');
                let assets = await PrimaryContract.prototype.getAllPatientResults(resultsIterator.iterator, false);

                return this.fetchFields(assets).filter(asset => asset.isDiseased === true || asset.isDiseased === 'true');
            } else {
                return { "status": "error", "message": `${msp} not authorized to read ${deferredPatientPrivateCollection}` };
            }
        } catch (error) {
            console.error(error);
            return { error: error };
        }
    };

    async queryPatientsForBagId(ctx, args) {
        let parsedArgs = JSON.parse(args);

        let assets = await this.queryAllPatients(ctx);
        console.debug("Received ", assets.length, " entries in queryPatientsForBagId");
        // console.debug("Sample asset: ", typeof(assets));
        // console.debug(assets[0]);

        for (let i = 0; i < assets.length; i++) {
            let donationHistory = assets[i].donationHistory;
            // console.debug("Patient ", assets[i].healthId, ": ", donationHistory);
            if (donationHistory !== null) {
                const numberOfDonations = Object.keys(donationHistory).length;
                console.debug("For patient, ", assets[i].healthId, ", donation history length: ", numberOfDonations);
                if (numberOfDonations > 0) {
                    let currentDonation;
                    for (let j = 0; j < numberOfDonations; j++) {
                        currentDonation = donationHistory['donation' + (j + 1)];
                        // console.debug("Searching donation ", currentDonation);
                        if (currentDonation['status'] === 'successful' && currentDonation['bloodBagUnitNo'] == parsedArgs.bloodBagUnitNo
                            && currentDonation['bloodBagSegmentNo'] == parsedArgs.bloodBagSegmentNo) {
                            console.debug("Patient found: ", assets[i].healthId);

                            return { status: "success", healthId: assets[i].healthId };
                        }
                    }
                }

            }
        }
        console.debug("Patient for bag not found: ", parsedArgs.bloodBagUnitNo, parsedArgs.bloodBagSegmentNo, parsedArgs.bagId);
        return { status: "error", message: "Patient for bag not found", healthId: null };
    };

    async updatePatientMedicalDetailsForDeferral(ctx, args) {
        try {
            args = JSON.parse(args);
            const healthId = args.healthId;
            const newAlert = true;
            const newIsDiseased = true;
            const newDonationStatus = args.donationStatus;
            const deferredOn = args.deferredOn;
            const deferredTenure = args.deferredTenure;
            const deferredAt = args.deferredAt;
            let isDataChanged = false;

            const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);

            if (patient.alert !== newAlert) {
                patient.alert = newAlert;
                isDataChanged = true;
            }

            if (patient.isDiseased !== newIsDiseased) {
                patient.isDiseased = newIsDiseased;
                isDataChanged = true;
            }

            if (patient.donationStatus !== newDonationStatus) {
                patient.donationStatus = newDonationStatus;
                isDataChanged = true;
            }

            let donationHistory = patient.donationHistory;
            if (donationHistory !== null) {
                const numberOfDonations = Object.keys(donationHistory).length;
                console.debug("For patient, ", patient.healthId, ", donation history length: ", numberOfDonations);
                if (numberOfDonations > 0) {
                    let currentDonation;
                    for (let j = numberOfDonations - 1; j >= 0; j--) {
                        currentDonation = donationHistory['donation' + (j + 1)];
                        // console.debug("Searching donation ", currentDonation);
                        if (currentDonation['status'] === 'successful' && currentDonation['bloodBagUnitNo'] == args.bloodBagUnitNo
                            && currentDonation['bloodBagSegmentNo'] == args.bloodBagSegmentNo) {
                            isDataChanged = true;
                            patient.donationHistory['donation' + (j + 1)]['status'] = 'failed (blood bag discarded)';
                            console.debug("staus changed for donor " + healthId + " bag: " + args.bloodBagSegmentNo + " " + args.bloodBagUnitNo);
                        }
                    }
                }

            }

            if (isDataChanged === true) {
                patient.deferredDetails = {
                    deferredOn: deferredOn,
                    deferredAt: deferredAt,
                    deferredTenure: deferredTenure,
                }
                const buffer = Buffer.from(JSON.stringify(patient));
                await ctx.stub.putState(healthId, buffer);
            }
            return { status: "success", message: `Patient ${healthId} medical details updated successfully`, patient: JSON.stringify(patient) };
        } catch (error) {
            console.error("Error updating patient medical details for deferral: ", error);
            return { status: "error", error: error.message };
        }
    };



    async updateSensitiveMedicalHistory(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            const healthId = parsedArgs.healthId;
            const deferredPatientBytes = await ctx.stub.getPrivateData(deferredPatientPrivateCollection, healthId);
            let deferredPatient;
            let numberOfMedicalTestRecords = 0;
            if (!!deferredPatientBytes && deferredPatientBytes.length > 0) {
                deferredPatient = DeferredPatient.fromBytes(deferredPatientBytes);
                // record exists, update the sensitive medical history array (insert a new record)
                console.debug("Updating sensitive medical history for deferred patient: ", healthId);
                numberOfMedicalTestRecords = Object.keys(deferredPatient.sensitiveMedicalHistory).length;
                deferredPatient.sensitiveMedicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': parsedArgs.dateOfTest,
                    'testedAt': parsedArgs.testedAt, 'results': parsedArgs.results
                };
            } else {
                let sensitiveMedicalHistory = {};
                sensitiveMedicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': parsedArgs.dateOfTest,
                    'testedAt': parsedArgs.testedAt, 'results': parsedArgs.results
                };
                const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);
                deferredPatient = new DeferredPatient(patient, parsedArgs.deferredStatus, parsedArgs.deferredOn,
                    parsedArgs.deferredTenure, parsedArgs.reasons, parsedArgs.deferredAt, sensitiveMedicalHistory);
            }
            await ctx.stub.putPrivateData(deferredPatientPrivateCollection, healthId, Buffer.from(JSON.stringify(deferredPatient)));
            return { status: "success", peer: ctx.stub.getMspID(), message: `Data written to PDC ${deferredPatientPrivateCollection}` }
        } catch (error) {
            console.error("Error occurred in sensitive medical history update: ", error);
            return { status: "error", error: error };
        }
    }

    async deferPatientOfBag(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            const healthId = parsedArgs.healthId;
            let patient = parsedArgs.patient;
            if (healthId !== null && parsedArgs.reasons && parsedArgs.reasons !== null) {
                let changedMedicalDetails = {
                    healthId: healthId, alert: true, isDiseased: true, donationStatus: parsedArgs.deferredStatus,
                    deferredOn: parsedArgs.deferredOn, deferredTenure: parsedArgs.deferredTenure,
                    deferredAt: parsedArgs.deferredAt, bloodBagUnitNo: parsedArgs.bloodBagUnitNo,
                    bloodBagSegmentNo: parsedArgs.bloodBagSegmentNo
                };

                const numberOfMedicalTestRecords = 0;
                let sensitiveMedicalHistory = {};
                sensitiveMedicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': parsedArgs.deferredOn,
                    'testedAt': parsedArgs.deferredAt, 'results': parsedArgs.results
                };

                const response = await this.updatePatientMedicalDetailsForDeferral(ctx, JSON.stringify(changedMedicalDetails));
                let changedPatient = null;
                if (response.status && response.status === "success" && response.patient) changedPatient = JSON.parse(response.patient);
                const msp = ctx.stub.getMspID() + "";

                if (msp.trim() == "superOrgMSP") {
                    // PDC Write operations only on authorized peers
                    console.debug("MSP: " + ctx.stub.getMspID());
                    // const date = new Date().toISOString().split("T")[0];
                    patient = (changedPatient === null || changedPatient === undefined) ? patient : changedPatient;
                    const deferredPatient = new DeferredPatient(patient, parsedArgs.deferredStatus, parsedArgs.deferredOn,
                        parsedArgs.deferredTenure, parsedArgs.reasons, parsedArgs.deferredAt, sensitiveMedicalHistory);
                    const plainDeferredPatient = JSON.parse(JSON.stringify(deferredPatient));
                    console.debug("Putting deferred patient to ledger: ", plainDeferredPatient);
                    console.debug("Type: ", typeof (plainDeferredPatient));
                    await ctx.stub.putPrivateData(deferredPatientPrivateCollection, healthId, Buffer.from(stringify(sortKeysRecursive(plainDeferredPatient))));
                    return { status: "success", peer: ctx.stub.getMspID(), message: `Data written to PDC ${deferredPatientPrivateCollection}` }
                } else {
                    console.warn(`PDC write skipped on peer with MSP: /${msp}/`);
                }

                return { status: "success", peer: `/${ctx.stub.getMspID()}/` };
            } else if (healthId !== null && parsedArgs.reasons === null) {
                let sensitiveMedicalHistoryArgs = {
                    healthId: healthId, dateOfTest: parsedArgs.deferredOn,
                    testedAt: parsedArgs.deferredAt, results: parsedArgs.results
                }
                return await this.updateSensitiveMedicalHistory(ctx, JSON.stringify(sensitiveMedicalHistoryArgs));
            } else {
                console.debug("Check blood bag ID. Patient not found.");
                return { status: "error", error: "Patient not found" };
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
                let assets = await PrimaryContract.prototype.getAllPatientResults(resultsIterator.iterator, false);

                let pendingBagsForDeferral = this.fetchFieldsForPendingDeferredPatients(assets);
                console.debug(`Received ${pendingBagsForDeferral.length} entries in pending CUE collection`);

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

    async deferPendingPatients(ctx, args) {
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

                console.debug(`Received ${pendingBagRecordsForDeferral.length} entries for deferral`);
                let deferredBagsCount = 0;
                const deferredPatientDetails = [];
                for (let i = 0; i < pendingBagRecordsForDeferral.length; i++) {
                    let bag = pendingBagRecordsForDeferral[i];
                    console.debug("Bag to be deferred: ", bag);
                    let healthId = null;
                    if (pendingBagIds[i].startsWith("T") || pendingBagIds[i].includes("-")) {
                        let response = await this.queryPatientsForBagId(ctx, JSON.stringify(bag));
                        console.debug(response);
                        healthId = "healthId" in response ? response.healthId : null;
                    } else {
                        healthId = pendingBagIds[i];
                    }
                    if (healthId !== null) {
                        const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);
                        console.debug("Patient object read: ", patient);
                        let deferredPatientDetail = {
                            ...bag,
                            healthId: healthId,
                            patient: patient,
                            bagId: pendingBagIds[i].startsWith("T") || pendingBagIds[i].includes("-") ? pendingBagIds[i] : null,
                            recordId: pendingBags[i]
                        };
                        deferredPatientDetails.push(deferredPatientDetail);
                    }
                }
                for (let i = 0; i < deferredPatientDetails.length; i++) {
                    const deferredPatientDetail = deferredPatientDetails[i];
                    const response = await this.deferPatientOfBag(ctx, JSON.stringify(deferredPatientDetail));
                    if (response.status == "success") {
                        console.debug("Bag to be deleted: " + pendingBags[i]);
                        const deletePendingBagResponse = await ctx.stub.deletePrivateData(pendingCUECollection, deferredPatientDetail.recordId);
                        console.debug(deletePendingBagResponse.toString());
                        deferredBagsCount++;
                    }
                }

                for (let i = 0; i < invalidBags.length; i++) {
                    const deletePendingBagResponse = await ctx.stub.deletePrivateData(pendingCUECollection, invalidBags[i]);
                    console.debug(deletePendingBagResponse.toString());
                    deferredBagsCount++;
                }
                return { status: "success", message: `Deferred ${deferredBagsCount} out of ${pendingBagRecordsForDeferral.length} patients via ${msp}` }

            } else {
                return { status: "error", message: `${msp} not authorized to read ${pendingCUECollection}` };
            }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    };

    async patientExists(ctx, healthId) {
        const buffer = await ctx.stub.getPrivateData(deferredPatientPrivateCollection, healthId);
        return (!!buffer && buffer.length > 0);
    }

    async readPatient(ctx, healthId) {
        const exists = await this.patientExists(ctx, healthId);
        if (!exists) {
            throw new Error(`The patient ${healthId} does not exist`);
        }

        const buffer = await ctx.stub.getPrivateData(deferredPatientPrivateCollection, healthId);
        let asset = DeferredPatient.fromBytes(buffer);
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
            sensitiveMedicalHistory: asset.sensitiveMedicalHistory,
            alert: asset.alert,
            isDiseased: asset.isDiseased,
            healthCreditPoints: asset.healthCreditPoints,
            donationStatus: asset.donationStatus,
            creationTimestamp: asset.creationTimestamp,
            deferredDetails: asset.deferredDetails,
            deferredAt: asset.deferredAt,
            deferredOn: asset.deferredDate,
            deferredTenure: asset.deferredTenure,
            deferredReason: asset.deferredReason,
        });
        return asset;
    }

    async checkIfPatientIsDeferred(ctx, args) {
        try {
            let ar = JSON.parse(args);
            let healthId = ar.healthId;
            let asset = await PrimaryContract.prototype.readPatient(ctx, healthId);
            if (asset.isDiseased === true || asset.isDiseased === "true") {
                let deferredDate = !!asset.deferredDetails ? asset.deferredDetails.deferredOn : "Unknown";
                let deferredAt = !!asset.deferredDetails ? asset.deferredDetails.deferredAt : "Unknown";
                return { status: "success", message: "Patient is deferred as tested on " + deferredDate + " at location " + deferredAt, patient: asset };
            } else {
                return { status: "success", message: "Patient is not deferred." };
            }
        } catch (error) {
            console.error(error);
            return { status: "error", message: "Patient does not exist", error: error };
        }
    }
}

module.exports = SuperContract;