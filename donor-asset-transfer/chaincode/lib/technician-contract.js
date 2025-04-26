'use strict';
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
            const bagId = parsedArgs.bloodBagUnitNo + "-" + parsedArgs.bloodBagSegmentNo;
            const deferredData = {
                "deferredOn": date, "deferredTenure": reasonsJson.deferredStatus, "reasons": reasonsJson.deferredReasons, "deferredBy": parsedArgs.username,
                "bloodBagUnitNo": parsedArgs.bloodBagUnitNo, "bloodBagSegmentNo": parsedArgs.bloodBagSegmentNo,
                "deferredStatus": parsedArgs.deferredStatus
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
}

module.exports = TechnicianContract;