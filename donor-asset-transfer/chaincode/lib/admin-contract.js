'use strict';

let Donor = require('./Donor.js');
const PrimaryContract = require('./primary-contract.js');

class AdminContract extends PrimaryContract {

    async getLatestDonorId(ctx) {
        let allResults = await this.queryAllDonors(ctx);
        let maxID = 0;
        for (let i = 0; i < allResults.length; i++) {
            if (allResults[i].donorId !== undefined) {
                let currID = parseInt(allResults[i].donorId.slice(3));
                if (currID > maxID) maxID = currID;
            } else {
                console.log("No Donor ID:", allResults[i]);
            }
        }

        return 'PID' + maxID;
    }

    async createDonor(ctx, args) {
        args = JSON.parse(args);

        if (args.password === null || args.password === '') {
            throw new Error(`Empty or null values should not be passed for password parameter`);
        }

        let newDonor = await new Donor(args.donorId, args.firstName, args.lastName, args.password, args.dob,
            args.phoneNumber, args.aadhar, args.address, args.bloodGroup);
        const exists = await this.donorExists(ctx, newDonor.donorId);
        if (exists) {
            throw new Error(`The donor ${newDonor.donorId} already exists`);
        }
        const buffer = Buffer.from(JSON.stringify(newDonor));
        await ctx.stub.putState(newDonor.donorId, buffer);
    }

    async readDonor(ctx, donorId) {
        let asset = await super.readDonor(ctx, donorId)

        asset = ({
            donorId: donorId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            phoneNumber: asset.phoneNumber,
            aadhar: asset.aadhar
        });
        return asset;
    }

    async deleteDonor(ctx, donorId) {
        const exists = await this.donorExists(ctx, donorId);
        if (!exists) {
            throw new Error(`The donor ${donorId} does not exist`);
        }
        await ctx.stub.deleteState(donorId);
    }

    async queryDonorsByLastName(ctx, lastName) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'donor';
        queryString.selector.lastName = lastName;
        const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        let asset = JSON.parse(buffer.toString());

        return this.fetchLimitedFields(asset);
    }

    async queryDonorsByFirstName(ctx, firstName) {
        let queryString = {};
        queryString.selector = {};
        queryString.selector.docType = 'donor';
        queryString.selector.firstName = firstName;
        const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        let asset = JSON.parse(buffer.toString());

        return this.fetchLimitedFields(asset);
    }

    async queryAllDonors(ctx) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllDonorResults(resultsIterator, false);

        return this.fetchLimitedFields(asset);
    }

    fetchLimitedFields = asset => {
        let newArray = [];
        for (let i = 0; i < asset.length; i++) {
            const obj = asset[i];
            if (obj.Key && obj.Key.startsWith('PID')) {
                newArray.push({
                    donorId: obj.Key,
                    firstName: obj.Record.firstName,
                    lastName: obj.Record.lastName,
                    phoneNumber: obj.Record.phoneNumber,
                    aadhar: obj.Record.aadhar
                });
            }
        }
        return newArray;
    }
}
module.exports = AdminContract;
