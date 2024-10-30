'use strict';

const crypto = require('crypto');
const PrimaryContract = require('./primary-contract.js');

class DonorContract extends PrimaryContract {

    async readDonor(ctx, donorId) {
        return await super.readDonor(ctx, donorId);
    }

    async deleteDonor(ctx, donorId) {
        const exists = await this.donorExists(ctx, donorId);
        if (!exists) {
            throw new Error(`The donor ${donorId} does not exist`);
        }
        await ctx.stub.deleteState(donorId);
    }

    async updateDonorPersonalDetails(ctx, args) {
        args = JSON.parse(args);
        let isDataChanged = false;
        let donorId = args.donorId;
        let newFirstname = args.firstName;
        let newLastName = args.lastName;
        let newDob = args.dob;
        let newPhoneNumber = args.phoneNumber;
        let newAadhar = args.aadhar;
        let newAddress = args.address;

        const donor = await this.readDonor(ctx, donorId)
        if (newFirstname !== null && newFirstname !== '' && donor.firstName !== newFirstname) {
            donor.firstName = newFirstname;
            isDataChanged = true;
        }

        if (newLastName !== null && newLastName !== '' && donor.lastName !== newLastName) {
            donor.lastName = newLastName;
            isDataChanged = true;
        }

        if (newDob !== null && newDob !== '' && donor.dob !== newDob) {
            donor.dob = newDob;
            isDataChanged = true;
        }

        if (newPhoneNumber !== null && newPhoneNumber !== '' && donor.phoneNumber !== newPhoneNumber) {
            donor.phoneNumber = newPhoneNumber;
            isDataChanged = true;
        }

        if (newAadhar !== null && newAadhar !== '' && donor.aadhar !== newAadhar) {
            donor.aadhar = newAadhar;
            isDataChanged = true;
        }

        if (newAddress !== null && newAddress !== '' && donor.address !== newAddress) {
            donor.address = newAddress;
            isDataChanged = true;
        }

        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    }

    async updateDonorPassword(ctx, args) {
        args = JSON.parse(args);
        let donorId = args.donorId;
        let newPassword = args.newPassword;

        if (newPassword === null || newPassword === '') {
            throw new Error(`Empty or null values should not be passed for newPassword parameter`);
        }

        const donor = await this.readDonor(ctx, donorId);
        donor.password = crypto.createHash('sha256').update(newPassword).digest('hex');
        if (donor.pwdTemp) {
            donor.pwdTemp = false;
        }
        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    }


    async getDonorPassword(ctx, donorId) {
        let donor = await this.readDonor(ctx, donorId);
        donor = ({
            password: donor.password,
            pwdTemp: donor.pwdTemp
        })
        return donor;
    }

    async getDonorHistory(ctx, donorId) {
        let resultsIterator = await ctx.stub.getHistoryForKey(donorId);
        let asset = await this.getAllDonorResults(resultsIterator, true);

        return this.fetchLimitedFields(asset, true);
    }

    fetchLimitedFields = (asset, includeTimeStamp = false) => {
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            asset[i] = {
                donorId: obj.Key,
                firstName: obj.Record.firstName,
                lastName: obj.Record.lastName,
                dob: obj.Record.dob,
                address: obj.Record.address,
                phoneNumber: obj.Record.phoneNumber,
                aadhar: obj.Record.aadhar,
                bloodGroup: obj.Record.bloodGroup,
                alert: obj.Record.alert,
                isDiseased: obj.Record.isDiseased,
                creditCard: obj.Record.creditCard,
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
        let donorId = args.donorId;
        let doctorId = args.doctorId;

        const donor = await this.readDonor(ctx, donorId);

        if (!donor.permissionGranted.includes(doctorId)) {
            donor.permissionGranted.push(doctorId);
        }
        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    };

    async revokeAccessFromDoctor(ctx, args) {
        args = JSON.parse(args);
        let donorId = args.donorId;
        let doctorId = args.doctorId;

        const donor = await this.readDonor(ctx, donorId);
        if (donor.permissionGranted.includes(doctorId)) {
            donor.permissionGranted = donor.permissionGranted.filter(doctor => doctor !== doctorId);
        }
        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    };


    async grantAccessToSuper(ctx, args) {
        args = JSON.parse(args);
        let donorId = args.donorId;
        let superId = args.doctorId;

        const donor = await this.readDonor(ctx, donorId);

        if (!donor.permissionGranted.includes(superId)) {
            donor.permissionGranted.push(superId);
        }
        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    };

    async revokeAccessFromSuper(ctx, args) {
        args = JSON.parse(args);
        let donorId = args.donorId;
        let superId = args.superId;

        const donor = await this.readDonor(ctx, donorId);
        if (donor.permissionGranted.includes(superId)) {
            donor.permissionGranted = donor.permissionGranted.filter(hospSuperId => hospSuperId !== superId);
        }
        const buffer = Buffer.from(JSON.stringify(donor));
        await ctx.stub.putState(donorId, buffer);
    };
}
module.exports = DonorContract;
