'use strict';
const Bag = require('./Bag.js');
const PrimaryContract = require('./primary-contract.js');
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const pendingCUECollection = 'pendingCUECollection';

class TechnicianContract extends PrimaryContract {
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

    async readPatient(ctx, healthId) {
        let asset = await PrimaryContract.prototype.readPatient(ctx, healthId);
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
            isDiseased: asset.isDiseased,
            alert: asset.alert,
            deferredDetails: asset.deferredDetails,
            deferralStatus: asset.deferralStatus,
            creationTimestamp: asset.creationTimestamp,
        });
        return asset;
    }

    async checkIfPatientIsDeferred(ctx, args) {
        try {
            const ar = JSON.parse(args);
            const healthId = ar.healthId;
            const asset = await this.readPatient(ctx, healthId);
            if (asset.isDiseased === true || asset.isDiseased === "true") {
                const deferredOn = !!asset.deferredDetails ? asset.deferredDetails.deferredOn : "Unknown";
                const deferredAt = !!asset.deferredDetails ? asset.deferredDetails.deferredAt : "Unknown";
                const deferredStatus = asset.deferralStatus;
                return { status: "success", message: `Patient is ${deferredStatus} as tested on ${deferredOn} at ${deferredAt}`, patient: asset };
            } else {
                return { status: "success", message: "Patient is not deferred" };
            }
        } catch (error) {
            console.error(error);
            return { status: "error", message: "Patient does not exist", error: error };
        }
    }

    async addBagsToBeDeferred(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            const transientMap = ctx.stub.getTransient();
            const transient = transientMap.get("transientData");
            if (!transient) {
                throw new Error("No transient data");
            }
            const reasonsJson = JSON.parse(transient.toString());
            // console.debug(reasonsJson, "> reasons extracted: ", reasonsJson.reasons);
            // this.verifyClientOrgMatchesPeerOrg(ctx);

            const msp = ctx.stub.getMspID() + "";

            // PDC Write operations only on authorized peers
            console.debug("MSP: " + ctx.stub.getMspID());
            const date = new Date().toISOString().split("T")[0];
            const bagId = "T" + parsedArgs.bloodBagUnitNo + "-" + parsedArgs.bloodBagSegmentNo; // T422-450
            const deferredAt = parsedArgs.username.toString().split('-')[0] === "HOSP1" ? "Hospital 1" : "Hospital 2";
            const deferredData = {
                "deferredOn": date, "deferredTenure": reasonsJson.deferredTenure,
                "reasons": reasonsJson.deferredReasons,
                "deferredAt": deferredAt,
                "bloodBagUnitNo": parsedArgs.bloodBagUnitNo, "bloodBagSegmentNo": parsedArgs.bloodBagSegmentNo,
                "deferredStatus": parsedArgs.deferredStatus, "bagId": bagId,
                results: reasonsJson.results
            };
            const plainDeferralData = JSON.parse(JSON.stringify(deferredData));
            console.debug("Putting deferred bag to ledger: ", plainDeferralData);
            console.debug("Type: ", typeof (plainDeferralData));
            await ctx.stub.putPrivateData(pendingCUECollection, bagId, Buffer.from(stringify(sortKeysRecursive(plainDeferralData))));
            return { status: "success", peer: ctx.stub.getMspID(), message: `Data written to PDC ${pendingCUECollection}` }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    };
    async testDeletion(ctx, args) {
        // await ctx.stub.putPrivateData(pendingCUECollection, 'TEMPBAG', Buffer.from("This is to be deleted"));
        // const response = await ctx.stub.deletePrivateData(pendingCUECollection, 'TEMPBAG');
        console.debug("Not implemented yet");
    }

    async addPendingAlarmingHistory(ctx, args) {
        // send alarming test results along with health Id to be inserted in the PDC
        try {
            const parsedArgs = JSON.parse(args);
            const transientMap = ctx.stub.getTransient();
            const transient = transientMap.get("transientData");
            if (!transient) {
                throw new Error("No transient data");
            }
            const reasonsJson = JSON.parse(transient.toString());
            // console.debug(reasonsJson, "> reasons extracted: ", reasonsJson.reasons);
            // this.verifyClientOrgMatchesPeerOrg(ctx);

            const msp = ctx.stub.getMspID() + "";

            // PDC Write operations only on authorized peers
            console.debug("MSP: " + msp);
            const date = new Date().toISOString().split("T")[0];
            // const bagId = parsedArgs.bloodBagUnitNo + "-" + parsedArgs.bloodBagSegmentNo;

            const deferredData = {
                "deferredOn": date, "deferredTenure": reasonsJson.deferredTenure,
                "reasons": reasonsJson.deferredReasons,
                "deferredAt": parsedArgs.deferredAt,
                "deferredStatus": parsedArgs.deferredStatus, "healthId": parsedArgs.healthId,
                "results": reasonsJson.results
            };
            const plainDeferralData = JSON.parse(JSON.stringify(deferredData));
            console.debug("Putting deferred data to ledger: ", plainDeferralData);
            console.debug("Type: ", typeof (plainDeferralData));
            // TODO: insert verification record in PDC

            await ctx.stub.putPrivateData(pendingCUECollection, parsedArgs.healthId, Buffer.from(stringify(sortKeysRecursive(plainDeferralData))));
            return { status: "success", peer: msp, message: `Data written to PDC ${pendingCUECollection}` }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    }

    async addToMedicalHistory(ctx, args) {
        try {
            args = JSON.parse(args);
            const { healthId, technicianId, results,
                _pulse, _systolic, _diastolic, _haemoglobin,
                _weight, haemophiliaA, haemophiliaB, anaemia,
                hypertension, cardiovascular, asthma
            } = args;
            const dod_date = new Date().toISOString().substring(0, 10);
            const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);
            const numberOfMedicalTestRecords = Object.keys(patient.medicalHistory).length;

            const pulse = parseInt(_pulse);
            const systolic = parseInt(_systolic);
            const diastolic = parseInt(_diastolic);
            const haemoglobin = parseFloat(_haemoglobin);
            const weight = parseInt(_weight);
            const deferredAt = technicianId.startsWith("HOSP1") ? "Hospital 1" : "Hospital 2"; // Assuming technician ID starts with HOSP1 or HOSP2

            let alert = false;
            let deferPatient = false;
            let deferredReasons = [];
            let deferredTenure = 0; // in days
            let status = '';
            let reason = '';
            const testLocation = technicianId.split('-')[0] == "HOSP1" ? "Hospital 1" : "Hospital 2";

            console.debug("Test results: ", results)

            if (haemophiliaA == "true" || haemophiliaB == "true") {
                status = 'deferred permanently';
                reason = 'Coagulation Factor Deficiencies';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = 100000000;
            }
            if (cardiovascular == "true") {
                status = 'deferred permanently';
                reason = 'Cardiovascular Diseases';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = 100000000;
            }
            if (asthma == "true" || asthma == "temp-defer") {
                status = asthma == "true" ? 'deferred permanently' : 'deferred temporarily';
                reason = asthma == "true" ? 'Chronic Asthma' : "Acute Asthma";
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = asthma == "true" ? 100000000 : 365;
            }
            if (hypertension == "true") {
                status = 'deferred permanently';
                reason = 'Hypertension';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = 100000000;
            }
            if (anaemia == "true" || anaemia == "temp-defer") {
                status = anaemia == "true" ? 'deferred permanently' : 'deferred temporarily';
                reason = 'Anaemia';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = anaemia == "true" ? 100000000 : 365;
            }
            patient.alert = alert;
            if (status.startsWith('deferred')) {
                patient.medicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': dod_date,
                    'status': "alarming", 'reason': reason, 'testedAt': testLocation,
                    'results': results
                };
                if (status.startsWith("deferred")) {
                    patient.isDiseased = "true";
                    patient.alert = "true";
                    patient.deferralStatus = status;
                }
            }
            else {
                patient.medicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': dod_date,
                    'status': status, 'testedAt': testLocation, 'results': results
                };
            }

            let response = { "status": "success", "deferPatient": deferPatient };
            if (deferPatient == true) {
                response = {
                    ...response,
                    deferredStatus: status,
                    deferredAt: deferredAt,
                    deferredReasons: deferredReasons,
                    deferredTenure: deferredTenure,
                    healthId: healthId
                };
                patient.alert = true;
            } else {
                response.deferredStatus = patient.deferralStatus;
            }
            const buffer = Buffer.from(JSON.stringify(patient));
            const result = await ctx.stub.putState(healthId, buffer);
            console.log(result.toString());
            return response;
        } catch (error) {
            console.error("Error in addToMedicalHistory: ", error);
            return { status: "error", message: "Failed to add medical history", error: error.message };
        }
    }

    async screenPatient(ctx, args) {
        try {
            args = JSON.parse(args);
            const { healthId, technicianId, results,
                _pulse, _systolic, _diastolic, _haemoglobin,
                _weight, haemophiliaA, haemophiliaB, anaemia,
                hypertension, cardiovascular, asthma,
            } = args;
            const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);

            const dod_date = new Date().toISOString().substring(0, 10);
            const age = (new Date(dod_date) - new Date(patient.dob)) / (1000 * 60 * 60 * 24 * 365);
            const numberOfDonationsMade = Object.keys(patient.donationHistory).length;
            const numberOfMedicalTestRecords = Object.keys(patient.medicalHistory).length;
            const dateOfLastDonation = numberOfDonationsMade > 0 ? patient.donationHistory['donation' + (numberOfDonationsMade)]['dateOfDonation'] : null;
            const duration = (dateOfLastDonation != null) ? (new Date(dod_date) - new Date(dateOfLastDonation)) / (1000 * 60 * 60 * 24) : null;
            const testLocation = technicianId.split('-')[0] == "HOSP1" ? "Hospital 1" : "Hospital 2";
            const deferredAt = technicianId.startsWith("HOSP1") ? "Hospital 1" : "Hospital 2";
            const pulse = parseInt(_pulse);
            const systolic = parseInt(_systolic);
            const diastolic = parseInt(_diastolic);
            const haemoglobin = parseFloat(_haemoglobin);
            const weight = parseInt(_weight);

            let alert = false;
            let deferPatient = false;
            let deferredReasons = [];
            let deferredTenure = 0; // in days
            let status = '';
            let reason = '';

            if (age < 18 || age > 60) {
                status = 'ineligible';
                reason = age < 18 ? 'Under Age' : 'Above Age';
            }
            else if (duration != null && duration < 120) {
                status = 'ineligible';
                reason = 'Invalid Duration between two Collections';
            }
            else if (patient.isDiseased == 'true') {
                status = 'ineligible';
                reason = 'Unhealthy';
            }
            else if (pulse < 60 || pulse > 100) {
                status = 'ineligible';
                reason = 'Abnormal Pulse';
            }
            else if (systolic < 110 || systolic > 140) {
                status = 'ineligible';
                reason = 'Abnormal Systolic Pressure';
            }
            else if (diastolic < 70 || diastolic > 100) {
                status = 'ineligible';
                reason = 'Abnormal Diastolic Pressure';
            }
            else if (weight < 45) {
                status = 'ineligible';
                reason = 'Under-weight';
            }
            else if ((patient.sex.startsWith('F') && haemoglobin < 12.0) || (patient.sex.startsWith('M') && haemoglobin < 13.0)) {
                status = 'ineligible';
                reason = 'Very Low Haemoglobin Levels';
                alert = true;
            }
            else if (patient.deferralStatus && patient.deferralStatus.startsWith('deferred')) {
                status = patient.deferralStatus;
                reason = 'Patient ' + patient.deferralStatus;
            }
            else {
                status = 'in progress';
            }
            if (haemophiliaA == "true" || haemophiliaB == "true") {
                status = 'deferred permanently';
                reason = 'Coagulation Factor Deficiencies';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = 100000000;
            }
            if (cardiovascular == "true") {
                status = 'deferred permanently';
                reason = 'Cardiovascular Diseases';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = 100000000;
            }
            if (asthma == "true" || asthma == "temp-defer") {
                status = asthma == "true" ? 'deferred permanently' : 'deferred temporarily';
                reason = asthma == "true" ? 'Chronic Asthma' : "Acute Asthma";
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = asthma == "true" ? 100000000 : 365;
            }
            if (hypertension == "true") {
                status = 'deferred permanently';
                reason = 'Hypertension';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = 100000000;
            }
            if (anaemia == "true" || anaemia == "temp-defer") {
                status = anaemia == "true" ? 'deferred permanently' : 'deferred temporarily';
                reason = 'Anaemia';
                deferPatient = true;
                deferredReasons.push(reason);
                deferredTenure = anaemia == "true" ? 100000000 : 365;
            }
            patient.alert = alert;
            if (status === 'ineligible' || status.startsWith('deferred')) {
                patient.donationHistory['donation' + (numberOfDonationsMade + 1)] = {
                    'dateOfDonation': dod_date,
                    'status': "failed", 'reason': reason, 'screenedBy': technicianId
                };
                patient.medicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': dod_date,
                    'status': "alarming", 'reason': reason, 'testedAt': testLocation,
                    'results': results
                };
                console.log("Patient status:", status, patient.deferralStatus);
                if (status.startsWith('deferred')) patient.deferralStatus = status;
            } else {
                patient.donationHistory['donation' + (numberOfDonationsMade + 1)] = {
                    'dateOfDonation': dod_date,
                    'status': status, 'screenedBy': technicianId
                };
                patient.medicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': dod_date,
                    'status': status, 'testedAt': testLocation, 'results': results
                };
                patient.deferralStatus = "not deferred";
            }
            let response = { "status": "success", donationStatus: status, deferPatient: deferPatient };
            if (deferPatient == true) {
                response = {
                    ...response,
                    deferredStatus: status,
                    deferredAt: deferredAt,
                    deferredReasons: deferredReasons,
                    deferredTenure: deferredTenure,
                };
                patient.alert = true;
            } else {
                response.deferredStatus = patient.deferralStatus;
            }
            const buffer = Buffer.from(JSON.stringify(patient));
            const result = await ctx.stub.putState(healthId, buffer);
            console.debug(result)
            return response;
        } catch (error) {
            console.error(error);
            return { status: "error", message: error.message, error: error };
        }
    }

    async createBag(ctx, args) {
        args = JSON.parse(args);
        let patient = await PrimaryContract.prototype.readPatient(ctx, args.healthId)
        const dod = new Date();
        const dod_date = dod.toISOString().substring(0, 10);
        let eod = new Date(dod_date);
        eod.setDate(dod.getDate() + 120);
        const expiry_date = eod.toISOString().substring(0, 10);
        const hospName = args.technicianId.startsWith('HOSP1') ? 'Hospital 1' : (args.technicianId.startsWith('HOSP2') ? 'Hospital 2' : 'Hospital 3');
        let newBag = new Bag(args.bloodBagUnitNo, args.bloodBagSegmentNo, dod_date, expiry_date, args.quantity, patient.bloodGroup, hospName);
        const bagID = "T" + args.bloodBagUnitNo + "S" + args.bloodBagSegmentNo;
        const buffer = Buffer.from(JSON.stringify(newBag));
        await ctx.stub.putState(bagID, buffer);

        const response = {
            bloodBagUnitNo: args.bloodBagUnitNo,
            bloodBagSegmentNo: args.bloodBagSegmentNo,
            dateOfCollection: dod_date,
            dateOfExpiry: expiry_date,
            quantity: args.quantity,
            bloodGroup: patient.bloodGroup,
            hospName: hospName
        };

        return response;
    }

    async bloodCollection(ctx, args) {
        const bagData = await this.createBag(ctx, args);
        args = JSON.parse(args);
        let healthId = args.healthId;
        let patient = await PrimaryContract.prototype.readPatient(ctx, healthId);

        const numberOfDonation = Object.keys(patient.donationHistory).length;

        patient.donationHistory['donation' + (numberOfDonation)]['bloodBagUnitNo'] = args.bloodBagUnitNo;
        patient.donationHistory['donation' + (numberOfDonation)]['bloodBagSegmentNo'] = args.bloodBagSegmentNo;
        patient.donationHistory['donation' + (numberOfDonation)]['quantity'] = args.quantity;
        patient.donationHistory['donation' + (numberOfDonation)]['status'] = "successful";
        patient.donationHistory['donation' + (numberOfDonation)]['collectedBy'] = args.technicianId;
        patient.healthCreditPoints = (parseInt(patient.healthCreditPoints) + args.quantity).toString();

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);

        return bagData;
    }

    async updateBloodDonationStatus(ctx, args) {
        try {
            args = JSON.parse(args);
            const healthId = args.healthId;
            let isDataChanged = false;

            const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);

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
                const buffer = Buffer.from(JSON.stringify(patient));
                await ctx.stub.putState(healthId, buffer);
            }
            return { status: "success", message: `Patient ${healthId} medical details updated successfully`, patient: JSON.stringify(patient) };
        } catch (error) {
            console.error("Error updating patient medical details for deferral: ", error);
            return { status: "error", error: error.message };
        }
    };

    async getDonatedBagsForDonor(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            const healthId = parsedArgs.healthId;
            let patient = await PrimaryContract.prototype.readPatient(ctx, healthId);

            const numberOfDonations = Object.keys(patient.donationHistory).length;
            const bags = [];

            if (numberOfDonations > 0) {
                let currentDonation;
                for (let j = numberOfDonations; j > 0; j--) {
                    currentDonation = donationHistory['donation' + j];
                    // console.debug("Searching donation ", currentDonation);
                    if (currentDonation['status'] === 'successful') {
                        bags.push({
                            bagId: "T" + currentDonation['bloodBagUnitNo'] + "S" + currentDonation['bloodBagSegmentNo'],
                            bloodBagUnitNo: currentDonation['bloodBagUnitNo'],
                            bloodBagSegmentNo: currentDonation['bloodBagSegmentNo'],
                        });
                    }
                }
            }

            return { status: 'success', bags: bags };
        } catch (error) {
            console.error('Error occurred during getting bags for donor: ' + error);
            return { status: 'error', error: error };
        }
    }
}

module.exports = TechnicianContract;