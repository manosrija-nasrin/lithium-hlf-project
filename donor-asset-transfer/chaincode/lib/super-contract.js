'use strict';
const PrimaryContract = require('./primary-contract.js');
const privateCollection = 'blockedDonorPrivateCollection';

class SuperContract extends PrimaryContract {
    // verifyClientOrgMatchesPeerOrg is an internal function used verify client org id and matches peer org id.
    verifyClientOrgMatchesPeerOrg(ctx) {
        const clientMSPID = ctx.clientIdentity.getMSPID();
        const peerMSPID = ctx.stub.getMspID();

        if (clientMSPID !== peerMSPID) {
            throw new Error('client from org %v is not authorized to read or write private data from an org ' + clientMSPID + ' peer ' + peerMSPID);
        }
    }

    async queryAllBlockedDonors(ctx, args) {
        try {
            this.verifyClientOrgMatchesPeerOrg(ctx);
            const parsedArgs = JSON.parse(args);
            const superId = parsedArgs.username;
            let resultsIterator = await ctx.stub.getPrivateDataByRange(privateCollection, '', '');
            let assets = await PrimaryContract.prototype.getAllDonorResults(resultsIterator.iterator, false);

            let permissionedAssets = [];
            for (let i = 0; i < assets.length; i++) {
                const obj = assets[i];
                if ('permissionGranted' in obj.Record && obj.Record.permissionGranted.includes(superId)) {
                    permissionedAssets.push(assets[i]);
                }
            }

            return this.fetchLimitedFields(permissionedAssets);
        } catch (error) {
            console.error(error);
            return { error: error };
        }
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
                donationHistory: obj.Record.donationHistory,
                donationStatus: obj.Record.donationStatus,
                blockedBy: obj.Record.blockedBy,
                blockedDate: obj.Record.blockedDate,
                blockedReason: obj.Record.blockedReason,
                blockedTenure: obj.Record.blockedTenure,
                bloodBagUnitNo: obj.Record.bloodBagUnitNo,
                bloodBagSegmentNo: obj.Record.bloodBagSegmentNo
            };
            if (includeTimeStamp) {
                asset[i].Timestamp = obj.Timestamp;
            }
        }

        return asset;
    };
}

module.exports = SuperContract;