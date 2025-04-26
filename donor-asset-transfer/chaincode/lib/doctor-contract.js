'use strict';
let Bag = require('./Bag.js');
const AdminContract = require('./admin-contract.js');
const PrimaryContract = require("./primary-contract.js");
const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const pendingCUECollection = 'pendingCUECollection';

class DoctorContract extends AdminContract {
    async readDonor(ctx, donorId) {

        let asset = await PrimaryContract.prototype.readDonor(ctx, donorId)
        const doctorId = await this.getClientId(ctx);
        const permissionArray = asset.permissionGranted;
        if (!permissionArray.includes(doctorId)) {
            throw new Error(`The doctor ${doctorId} does not have permission to donor ${donorId}`);
        }
        asset = ({
            donorId: donorId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            dob: asset.dob,
            bloodGroup: asset.bloodGroup,
            alert: asset.alert,
            sex: asset.sex,
            isDiseased: asset.isDiseased,
            creditCard: asset.creditCard,
            donationStatus: asset.donationStatus,
            donationHistory: asset.donationHistory
        });
        return asset;
    }

    async createBag(ctx, args) {
        args = JSON.parse(args);
        let donor = await PrimaryContract.prototype.readDonor(ctx, args.donorId)
        const dod = new Date();
        const dod_date = dod.toISOString().substring(0, 10);
        let eod = new Date(dod_date);
        eod.setDate(dod.getDate() + 120);
        const expiry_date = eod.toISOString().substring(0, 10);
        const hospName = args.doctorId.startsWith('HOSP1') ? 'hospital 1' : (args.doctorId.startsWith('HOSP2') ? 'hospital 2' : 'hospital 3');
        let newBag = new Bag(args.bloodBagUnitNo, args.bloodBagSegmentNo, dod_date, expiry_date, args.quantity, donor.bloodGroup, hospName);
        const bagID = "T" + args.bloodBagUnitNo + "S" + args.bloodBagSegmentNo;
        const buffer = Buffer.from(JSON.stringify(newBag));
        await ctx.stub.putState(bagID, buffer);

        const response = {
            bloodBagUnitNo: args.bloodBagUnitNo,
            bloodBagSegmentNo: args.bloodBagSegmentNo,
            dateOfCollection: dod_date,
            dateOfExpiry: expiry_date,
            quantity: args.quantity,
            bloodGroup: donor.bloodGroup,
            hospName: hospName
        };

        return response;
    }

    async bloodCollection(ctx, args) {
        const bagData = await this.createBag(ctx, args);
        args = JSON.parse(args);
        let donorId = args.donorId;
        let donor = await PrimaryContract.prototype.readDonor(ctx, donorId);

        const numberOfDonation = Object.keys(donor.donationHistory).length;

        donor.donationHistory['donation' + (numberOfDonation)]['bloodBagUnitNo'] = args.bloodBagUnitNo;
        donor.donationHistory['donation' + (numberOfDonation)]['bloodBagSegmentNo'] = args.bloodBagSegmentNo;
        donor.donationHistory['donation' + (numberOfDonation)]['quantity'] = args.quantity;
        donor.donationHistory['donation' + (numberOfDonation)]['status'] = "successful";
        donor.donationHistory['donation' + (numberOfDonation)]['collectedBy'] = args.doctorId;
        donor.creditCard = (parseInt(donor.creditCard) + args.quantity).toString();
        donor.donationStatus = 'successful';


        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);

        return bagData;
    }


    async screenDonor(ctx, args) {
        args = JSON.parse(args);
        let donorId = args.donorId;
        let donor = await PrimaryContract.prototype.readDonor(ctx, donorId);
        let status = '';
        let reason = '';
        let dod = new Date();
        const dod_date = dod.toISOString().substring(0, 10);
        const age = (new Date(dod_date) - new Date(donor.dob)) / (1000 * 60 * 60 * 24 * 365);
        const numberOfDonationsMade = Object.keys(donor.donationHistory).length;
        const dateOfLastDonation = numberOfDonationsMade > 0 ? donor.donationHistory['donation' + (numberOfDonationsMade)]['dateOfDonation'] : null;
        const duration = (dateOfLastDonation != null) ? (new Date(dod_date) - new Date(dateOfLastDonation)) / (1000 * 60 * 60 * 24) : null;

        let pulse = parseInt(args.pulse);
        let systolic = parseInt(args.systolic);
        let diastolic = parseInt(args.diastolic);
        let haemoglobin = parseFloat(args.haemoglobin);
        let weight = parseInt(args.weight);
        let haemophiliaA = args.haemophiliaA;
        let haemophiliaB = args.haemophiliaB;
        let anaemia = args.anaemia;
        let hypertension = args.hypertension;
        let cardiovascular = args.cardiovascular;
        let asthma = args.asthma;

        let alert = false;
        let deferDonor = false;
        let deferredBy = args.doctorId;
        let deferredReasons = [];
        let deferredTenure = 0; // in days

        if (age < 18 || age > 60) {
            status = 'ineligible';
            reason = age < 18 ? 'Under Age' : 'Above Age';
        }
        else if (duration != null && duration < 120) {
            status = 'ineligible';
            reason = 'Invalid Duration between two Collections';
        }
        else if (donor.isDiseased == 'true') {
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
        else if ((donor.sex.startsWith('F') && haemoglobin < 12.0) || (donor.sex.startsWith('M') && haemoglobin < 13.0)) {
            status = 'ineligible';
            reason = 'Very Low Haemoglobin Levels';
            alert = true;
        }
        else if (donor.donationStatus && donor.donationStatus.includes('deferred')) {
            status = 'ineligible';
            reason = 'Donor ' + donor.donationStatus;
        }
        else {
            status = 'in progress';
        }
        if (haemophiliaA == "true" || haemophiliaB == "true") {
            status = 'deferred permanently';
            reason = 'Coagulation Factor Deficiencies';
            deferDonor = true;
            deferredReasons.push(reason);
            deferredTenure = 100000000;
        }
        if (cardiovascular == "true") {
            status = 'deferred permanently';
            reason = 'Cardiovascular Diseases';
            deferDonor = true;
            deferredReasons.push(reason);
            deferredTenure = 100000000;
        }
        if (asthma == "true" || asthma == "temp-defer") {
            status = asthma == "true" ? 'deferred permanently' : 'deferred temporarily';
            reason = asthma == "true" ? 'Chronic Asthma' : "Acute Asthma";
            deferDonor = true;
            deferredReasons.push(reason);
            deferredTenure = asthma == "true" ? 100000000 : 365;
        }
        if (hypertension == "true") {
            status = 'deferred permanently';
            reason = 'Hypertension';
            deferDonor = true;
            deferredReasons.push(reason);
            deferredTenure = 100000000;
        }
        if (anaemia == "true" || anaemia == "temp-defer") {
            status = anaemia == "true" ? 'deferred permanently' : 'deferred temporarily';
            reason = 'Anaemia';
            deferDonor = true;
            deferredReasons.push(reason);
            deferredTenure = anaemia == "true" ? 100000000 : 365;
        }
        donor.alert = alert;
        if (status == 'ineligible' || status.startsWith('deferred')) {
            donor.donationHistory['donation' + (numberOfDonationsMade + 1)] = { 'dateOfDonation': dod_date, 'status': "failed", 'reason': reason, 'screenedBy': args.doctorId };
            donor.donationStatus = status == "ineligible" ? "failed" : status;
        }
        else {
            donor.donationHistory['donation' + (numberOfDonationsMade + 1)] = { 'dateOfDonation': dod_date, 'status': status, 'screenedBy': args.doctorId };
            donor.donationStatus = "in progress";
        }
        let response = { "status": "success", "deferDonor": deferDonor };
        if (deferDonor == true) {
            response = {
                ...response,
                deferredStatus: status,
                deferredBy: deferredBy,
                deferredReasons: deferredReasons,
                deferredTenure: deferredTenure,
            };
            donor.alert = true;
        }
        const buffer = Buffer.from(JSON.stringify(donor));
        const result = await ctx.stub.putState(donorId, buffer);
        return response;
    }

    async addDonorToBeDeferred(ctx, args) {
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
            const donorId = parsedArgs.donorId;
            const deferredData = {
                "deferredOn": date, "deferredTenure": reasonsJson.deferredTenure, "reasons": reasonsJson.deferredReasons, "deferredBy": parsedArgs.username,
                "deferredStatus": parsedArgs.deferredStatus
            };
            const plainDeferralData = JSON.parse(JSON.stringify(deferredData));
            console.debug("Putting deferred donor to ledger: ", plainDeferralData);
            console.debug("Type: ", typeof (plainDeferralData));
            await ctx.stub.putPrivateData(pendingCUECollection, donorId, Buffer.from(stringify(sortKeysRecursive(plainDeferralData))));
            return { status: "success", peer: ctx.stub.getMspID(), message: `Data written to PDC ${pendingCUECollection}` }
        } catch (error) {
            console.error(error);
            return { status: "error", error: error };
        }
    };

    async updateDonorMedicalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let donorId = args.donorId;
        let newAlert = args.alert;
        let newIsDiseased = args.isDiseased;
        let newCreditCard = args.creditCard;
        let newDonationStatus = args.donationStatus;

        const donor = await PrimaryContract.prototype.readDonor(ctx, donorId);

        if (newAlert !== null && newAlert !== '' && donor.alert !== newAlert) {
            donor.alert = newAlert;
            isDataChanged = true;
        }

        if (newIsDiseased !== null && newIsDiseased !== '' && donor.isDiseased !== newIsDiseased) {
            donor.isDiseased = newIsDiseased;
            isDataChanged = true;
        }

        if (newCreditCard !== null && newCreditCard !== '' && donor.creditCard !== newCreditCard) {
            donor.creditCard = newCreditCard;
            isDataChanged = true;
        }

        if (newDonationStatus !== null && newDonationStatus !== '' && donor.donationStatus !== newDonationStatus) {
            donor.donationStatus = newDonationStatus;
            isDataChanged = true;
        }


        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    }


    async queryDonorsByLastName(ctx, lastName) {
        return await super.queryDonorsByLastName(ctx, lastName);
    }


    async queryDonorsByFirstName(ctx, firstName) {
        return await super.queryDonorsByFirstName(ctx, firstName);
    }

    async getDonorHistory(ctx, donorId) {
        let resultsIterator = await ctx.stub.getHistoryForKey(donorId);
        let asset = await this.getAllDonorResults(resultsIterator, true);

        return this.fetchLimitedFields(asset, true);
    }

    async queryAllDonors(ctx, doctorId) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllDonorResults(resultsIterator, false);
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
                donorId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                dob: obj.Record.dob,
                bloodGroup: obj.Record.bloodGroup,
                alert: obj.Record.alert,
                isDiseased: obj.Record.isDiseased,
                creditCard: obj.Record.creditCard,
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
}
module.exports = DoctorContract;
