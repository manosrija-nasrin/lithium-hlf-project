'use strict';

const crypto = require('crypto');
const PrimaryContract = require('./primary-contract.js');

class PatientContract extends PrimaryContract {

    async readPatient(ctx, healthId) {
        let asset = await super.readPatient(ctx, healthId);
        return asset;
    }

    async deletePatient(ctx, healthId) {
        const exists = await this.patientExists(ctx, healthId);
        if (!exists) {
            throw new Error(`The patient ${healthId} does not exist`);
        }
        await ctx.stub.deleteState(healthId);
    }

    async updatePatientPersonalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let healthId = args.healthId;
        let newFirstname = args.firstName;
        let newLastName = args.lastName;
        let newDob = args.dob;
        let newPhoneNumber = args.phoneNumber;
        let newAadhar = args.aadhar;
        let newAddress = args.address;

        const patient = await this.readPatient(ctx, healthId)
        if (newFirstname !== null && newFirstname !== '' && patient.firstName !== newFirstname) {
            patient.firstName = newFirstname;
            isDataChanged = true;
        }

        if (newLastName !== null && newLastName !== '' && patient.lastName !== newLastName) {
            patient.lastName = newLastName;
            isDataChanged = true;
        }

        if (newDob !== null && newDob !== '' && patient.dob !== newDob) {
            patient.dob = newDob;
            isDataChanged = true;
        }

        if (newPhoneNumber !== null && newPhoneNumber !== '' && patient.phoneNumber !== newPhoneNumber) {
            patient.phoneNumber = newPhoneNumber;
            isDataChanged = true;
        }

        if (newAadhar !== null && newAadhar !== '' && patient.aadhar !== newAadhar) {
            patient.aadhar = newAadhar;
            isDataChanged = true;
        }

        if (newAddress !== null && newAddress !== '' && patient.address !== newAddress) {
            patient.address = newAddress;
            isDataChanged = true;
        }

        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);
    }

    async updatePatientPassword(ctx, args) {
        args = JSON.parse(args);
        let healthId = args.healthId;
        let newPassword = args.newPassword;

        if (newPassword === null || newPassword === '') {
            throw new Error(`Empty or null values should not be passed for newPassword parameter`);
        }

        const patient = await this.readPatient(ctx, healthId);
        patient.password = crypto.createHash('sha256').update(newPassword).digest('hex');
        if (patient.pwdTemp) {
            patient.pwdTemp = false;
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);
    }


    async getPatientPassword(ctx, healthId) {
        let patient = await this.readPatient(ctx, healthId);
        patient = ({
            password: patient.password,
            pwdTemp: patient.pwdTemp
        })
        return patient;
    }

    async getPatientHistory(ctx, healthId) {
        let resultsIterator = await ctx.stub.getHistoryForKey(healthId);
        let asset = await this.getAllPatientResults(resultsIterator, true);

        return this.fetchLimitedFields(asset, true);
    }

    fetchLimitedFields = (asset, includeTimeStamp = false) => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                healthId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                dob: obj.Record.dob,
                address: obj.Record.address,
                phoneNumber: obj.Record.phoneNumber,
                aadhar: obj.Record.aadhar,
                bloodGroup: obj.Record.bloodGroup,
                alert: obj.Record.alert,
                isDiseased: obj.Record.isDiseased,
                healthCreditPoints: obj.Record.healthCreditPoints,
                donationHistory: obj.Record.donationHistory,
                donationStatus: obj.Record.donationStatus
            };
            if (includeTimeStamp) {
                asset[i].Timestamp = obj.Timestamp;
            }
        }

        return asset;
    };

    async grantAccessToDoctor(ctx, args) {
        args = JSON.parse(args);
        let healthId = args.healthId;
        let doctorId = args.doctorId;

        const patient = await this.readPatient(ctx, healthId);

        if (!patient.permissionGranted.includes(doctorId)) {
            patient.permissionGranted.push(doctorId);
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);
    };

    async revokeAccessFromDoctor(ctx, args) {
        args = JSON.parse(args);
        let healthId = args.healthId;
        let doctorId = args.doctorId;

        const patient = await this.readPatient(ctx, healthId);
        if (patient.permissionGranted.includes(doctorId)) {
            patient.permissionGranted = patient.permissionGranted.filter(doctor => doctor !== doctorId);
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);
    };


    async grantAccessToSuper(ctx, args) {
        args = JSON.parse(args);
        let healthId = args.healthId;
        let superId = args.superId;

        const patient = await this.readPatient(ctx, healthId);

        if (!patient.permissionGranted.includes(superId)) {
            patient.permissionGranted.push(superId);
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);
    };

    async revokeAccessFromSuper(ctx, args) {
        args = JSON.parse(args);
        let healthId = args.healthId;
        let superId = args.superId;

        const patient = await this.readPatient(ctx, healthId);
        if (patient.permissionGranted.includes(superId)) {
            patient.permissionGranted = patient.permissionGranted.filter(hospSuperId => hospSuperId !== superId);
        }
        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(healthId, buffer);
    };

    async getClientId(ctx) {
        const clientIdentity = ctx.clientIdentity.getID();
        let identity = clientIdentity.split('::');
        identity = identity[1].split('/')[2].split('=');
        return identity[1].toString('utf8');
    };
}
module.exports = PatientContract;
