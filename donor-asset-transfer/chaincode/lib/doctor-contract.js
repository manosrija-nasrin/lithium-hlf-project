'use strict';
let Bag = require('./Bag.js');
const AdminContract = require('./admin-contract.js');
const PrimaryContract = require("./primary-contract.js");
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const pendingCUECollection = 'pendingCUECollection';

class DoctorContract extends AdminContract {
    async readPatient(ctx, healthId) {
        let asset = await PrimaryContract.prototype.readPatient(ctx, healthId)
        const doctorId = await this.getClientId(ctx);
        const permissionArray = asset.permissionGranted;
        if (!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to patient ${healthId}`);
        }
        asset = ({
            healthId: healthId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            dob: asset.dob,
            bloodGroup: asset.bloodGroup,
            alert: asset.alert,
            sex: asset.sex,
            isDiseased: asset.isDiseased,
            healthCreditPoints: asset.healthCreditPoints,
            donationStatus: asset.donationStatus,
            donationHistory: asset.donationHistory,
            medicalHistory: asset.medicalHistory
        });
        return asset;
    }

    async createBag(ctx, args) {
        args = JSON.parse(args);
        let patient = await PrimaryContract.prototype.readPatient(ctx, args.healthId)
        const dod = new Date();
        const dod_date = dod.toISOString().substring(0, 10);
        let eod = new Date(dod_date);
        eod.setDate(dod.getDate() + 120);
        const expiry_date = eod.toISOString().substring(0, 10);
        const hospName = args.doctorId.startsWith('HOSP1') ? 'Hospital 1' : (args.doctorId.startsWith('HOSP2') ? 'Hospital 2' : 'Hospital 3');
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
        patient.donationHistory['donation' + (numberOfDonation)]['collectedBy'] = args.doctorId;
        patient.healthCreditPoints = (parseInt(patient.healthCreditPoints) + args.quantity).toString();
        patient.donationStatus = 'successful';


        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);

        return bagData;
    }

    async screenPatient(ctx, args) {
        try {
            args = JSON.parse(args);
            const { healthId, doctorId, results,
                _pulse, _systolic, _diastolic, _haemoglobin,
                _weight, haemophiliaA, haemophiliaB, anaemia,
                hypertension, cardiovascular, asthma, dob
            } = args;
            const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);

            const dod_date = new Date().toISOString().substring(0, 10);
            const age = (new Date(dod_date) - new Date(dob)) / (1000 * 60 * 60 * 24 * 365);
            const numberOfDonationsMade = Object.keys(patient.donationHistory).length;
            const numberOfMedicalTestRecords = Object.keys(patient.medicalHistory).length;
            const dateOfLastDonation = numberOfDonationsMade > 0 ? patient.donationHistory['donation' + (numberOfDonationsMade)]['dateOfDonation'] : null;
            const duration = (dateOfLastDonation != null) ? (new Date(dod_date) - new Date(dateOfLastDonation)) / (1000 * 60 * 60 * 24) : null;
            const testLocation = doctorId.split('-')[0] == "HOSP1" ? "Hospital 1" : "Hospital 2";
            const deferredAt = doctorId.startsWith("HOSP1") ? "Hospital 1" : "Hospital 2";
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
            else if (patient.donationStatus && patient.donationStatus.includes('deferred')) {
                status = 'ineligible';
                reason = 'Patient ' + patient.donationStatus;
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
            if (status == 'ineligible' || status.startsWith('deferred')) {
                patient.donationHistory['donation' + (numberOfDonationsMade + 1)] = {
                    'dateOfDonation': dod_date,
                    'status': "failed", 'reason': reason, 'screenedBy': args.doctorId
                };
                patient.medicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': dod_date,
                    'status': "alarming", 'reason': reason, 'testedAt': testLocation,
                    'results': results
                };
                patient.donationStatus = status == "ineligible" ? "failed" : status;
            }
            else {
                patient.donationHistory['donation' + (numberOfDonationsMade + 1)] = {
                    'dateOfDonation': dod_date,
                    'status': status, 'screenedBy': args.doctorId
                };
                patient.medicalHistory['test' + (numberOfMedicalTestRecords + 1)] = {
                    'dateOfTest': dod_date,
                    'status': status, 'testedAt': testLocation, 'results': results
                };
                patient.donationStatus = "in progress";
            }
            let response = { "status": "success", "deferPatient": deferPatient };
            if (deferPatient == true) {
                response = {
                    ...response,
                    deferredStatus: status,
                    deferredAt: deferredAt,
                    deferredReasons: deferredReasons,
                    deferredTenure: deferredTenure,
                };
                patient.alert = true;
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

    async addPatientToBeDeferred(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            const transientMap = ctx.stub.getTransient();
            const transient = transientMap.get("transientData");
            if (!transient) {
                throw new Error("No transient data");
            }
            const reasonsJson = JSON.parse(transient.toString());

            const msp = ctx.stub.getMspID() + "";

            // PDC Write operations only on authorized peers
            console.debug("MSP: " + ctx.stub.getMspID());
            const date = new Date().toISOString().split("T")[0];
            const healthId = parsedArgs.healthId;
            const deferredData = {
                "deferredOn": date, "deferredTenure": reasonsJson.deferredTenure,
                "reasons": reasonsJson.deferredReasons, "deferredAt": parsedArgs.username,
                "deferredStatus": parsedArgs.deferredStatus
            };
            const plainDeferralData = JSON.parse(JSON.stringify(deferredData));
            console.debug("Putting deferred patient to ledger: ", plainDeferralData);
            console.debug("Type: ", typeof (plainDeferralData));
            await ctx.stub.putPrivateData(pendingCUECollection, healthId, Buffer.from(stringify(sortKeysRecursive(plainDeferralData))));
            return { status: "success", peer: ctx.stub.getMspID(), message: `Data written to PDC ${pendingCUECollection}` }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    };

    async updatePatientMedicalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let healthId = args.healthId;
        let newAlert = args.alert;
        let newIsDiseased = args.isDiseased;
        let newCreditCard = args.healthCreditPoints;
        let newDonationStatus = args.donationStatus;

        const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);

        if (newAlert !== null && newAlert !== '' && patient.alert !== newAlert) {
            patient.alert = newAlert;
            isDataChanged = true;
        }

        if (newIsDiseased !== null && newIsDiseased !== '' && patient.isDiseased !== newIsDiseased) {
            patient.isDiseased = newIsDiseased;
            isDataChanged = true;
        }

        if (newCreditCard !== null && newCreditCard !== '' && patient.healthCreditPoints !== newCreditCard) {
            patient.healthCreditPoints = newCreditCard;
            isDataChanged = true;
        }

        if (newDonationStatus !== null && newDonationStatus !== '' && patient.donationStatus !== newDonationStatus) {
            patient.donationStatus = newDonationStatus;
            isDataChanged = true;
        }


        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);
    }


    async queryPatientsByLastName(ctx, lastName) {
        return await super.queryPatientsByLastName(ctx, lastName);
    }


    async queryPatientsByFirstName(ctx, firstName) {
        return await super.queryPatientsByFirstName(ctx, firstName);
    }

    async getPatientHistory(ctx, healthId) {
        let resultsIterator = await ctx.stub.getHistoryForKey(healthId);
        let asset = await this.getAllPatientResults(resultsIterator, true);

        return this.fetchLimitedFields(asset, true);
    }

    async queryAllPatients(ctx, doctorId) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator, false);
        const permissionedAssets = [];
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            if ('permissionGranted' in obj.Record && obj.Record.permissionGranted.includes(doctorId)) {
                permissionedAssets.push(asset[i]);
            }
        }

        return this.fetchLimitedFields(permissionedAssets);
    }

    fetchLimitedFields = (asset, includeTimeStamp = false) => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                healthId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                dob: obj.Record.dob,
                bloodGroup: obj.Record.bloodGroup,
                alert: obj.Record.alert,
                isDiseased: obj.Record.isDiseased,
                healthCreditPoints: obj.Record.healthCreditPoints,
                donationStatus: obj.Record.donationStatus
            };
            if (includeTimeStamp) {
                asset[i].Timestamp = obj.Timestamp;
            }
        }

        return asset;
    };

    async getClientId(ctx) {
        const clientIdentity = ctx.clientIdentity.getID();
        let identity = clientIdentity.split('::');
        identity = identity[1].split('/')[2].split('=');
        return identity[1].toString('utf8');
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
            medicalHistory: asset.medicalHistory,
            donationHistory: asset.donationHistory,
            healthCreditPoints: asset.healthCreditPoints,
            donationStatus: asset.donationStatus,
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
                const deferredDate = !!asset.deferredDetails ? asset.deferredDetails.deferredOn : "Unknown";
                const deferredAt = !!asset.deferredDetails ? asset.deferredDetails.deferredAt : "Unknown";
                return { status: "success", message: "Patient is deferred as tested on " + deferredDate + " at location " + deferredAt, patient: asset };
            } else {
                return { status: "success", message: "Patient is not deferred" };
            }
        } catch (error) {
            console.error(error);
            return { status: "error", message: "Patient does not exist", error: error };
        }
    }

    async requestAccessToSensitiveData(ctx, args) {
        try {
            const parsedArgs = JSON.parse(args);
            const { healthId, doctorId, hospitalName, reason, requestedTo } = parsedArgs;
            const patient = await PrimaryContract.prototype.readPatient(ctx, healthId);
            // TODO: Implement logic to handle access request
            // const buffer = Buffer.from(JSON.stringify(patient));
            // await ctx.stub.putState(healthId, buffer);
            return { status: "success", message: "Access granted to doctor " + doctorId };
        } catch (error) {
            console.error(error);
            return { status: "error", message: error.message, error: error };
        }
    }
}
module.exports = DoctorContract;
