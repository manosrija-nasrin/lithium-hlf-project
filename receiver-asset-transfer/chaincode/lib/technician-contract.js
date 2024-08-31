/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const PrimaryContract = require('./primary-contract.js');
const { Contract } = require('fabric-contract-api');
const Receiver = require('./Receiver.js');

class TechnicianContract extends PrimaryContract {
    async createReceiver(ctx, args) {
        args = JSON.parse(args);
        const hospitalName = args.technicianId.startsWith('HOSP1') ? "hospital 1" : (args.technicianId.startsWith('HOSP2') ? "hospital 2" : "hospital 3");
        const dateANDtime = new Date();
        const dateOfRegistration = dateANDtime.toLocaleDateString();
        let newReceiver = new Receiver(args.receiverName, args.receiverAadhar, args.receiverAddress, args.bloodGroup, args.quantity, hospitalName, dateOfRegistration, args.bags);
        const slipNo = args.slipNumber;
        const buffer = Buffer.from(JSON.stringify(newReceiver));
        await ctx.stub.putState(slipNo, buffer);
    }

    async crossmatchCheck(ctx, args) {
        args = JSON.parse(args);

        if (args.malaria == 'true' || args.syphilis == 'true' || args.hcv == 'true' || args.hepatitisB == 'true' || args.ABORhGrouping == 'false' || args.irregularAntiBody == 'true') {
            let slipNo = args.slipNumber;
            let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);
            
            if (asset) {
                let bagId = args.bloodBagUnitNo + "-" + args.bloodBagSegmentNo;
                if (asset.bags[bagId]) {
                	delete asset.bags[bagId];
                	delete asset.crossMatchedBy[bagId];
                	await ctx.stub.putState(slipNo, Buffer.from(JSON.stringify(asset)));
                }
            }
            return { crossmatch: 'false' };

        } else {
            await this.healthyReceiver(ctx, JSON.stringify(args));
            return { crossmatch: 'true' };
        }
    }

    async healthyReceiver(ctx, args) {
        args = JSON.parse(args);
        let slipNo = args.slipNumber;
        let bagId = args.bloodBagUnitNo + "-" + args.bloodBagSegmentNo;

        let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);

        if (asset.bags[bagId]) {
            asset.bags[bagId] = 'true';
            asset.crossMatchedBy[bagId]=args.technicianId;
            asset.left--;

            await ctx.stub.putState(slipNo, Buffer.from(JSON.stringify(asset)));
            return JSON.stringify({ success: true, message: "Bag updated successfully" });
        } else {
            return JSON.stringify({ success: false, message: "Bag ID not found in receiver's bags" });
        }
    }

    async replaceReceiver(ctx, args) {
        args = JSON.parse(args);
        let slipNo = args.slipNumber;
        let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);
        let bagId = args.newAllocation[0]["BagUnitNo"] + "-" + args.newAllocation[0]["BagSegmentNo"];
        
        asset.bags[bagId] = 'false';
        await ctx.stub.putState(slipNo, Buffer.from(JSON.stringify(asset)));
    }
    
    async LTapproval(ctx, args) {
       args = JSON.parse(args);
       let slipNo = args.slipNumber;
       let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);

       if (asset.LTapproval === false && asset.left === 0) {
          asset = {
          Name: asset.nameOfReceiver,
          Aadhar: asset.aadhar,
          Address: asset.address,
          BloodGroup: asset.bloodGroup,
          Quantity: asset.quantity,
          DateOfRegistration: asset.dateOfRegistration,
          Bags: asset.crossMatchedBy
          };
        return asset;
       } else {
        return null;
       }
    }
    
    async sendLTapproval(ctx, args) {
       args = JSON.parse(args);
       let slipNo = args.slipNumber;
       let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);
       
       asset.LTapproval=true;
       await ctx.stub.putState(slipNo, Buffer.from(JSON.stringify(asset)));
    }
    
    async MOCapproval(ctx, args) {
    	args = JSON.parse(args);
       let slipNo = args.slipNumber;
       let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);

       if (asset.LTapproval === true && asset.MOCapproval === false && asset.left === 0) {
          asset = {
          Name: asset.nameOfReceiver,
          Aadhar: asset.aadhar,
          Address: asset.address,
          BloodGroup: asset.bloodGroup,
          Quantity: asset.quantity,
          DateOfRegistration: asset.dateOfRegistration,
          Bags: asset.crossMatchedBy
          };
        return asset;
       } else {
        return null;
       }
    }
    
    async sendMOCapproval(ctx, args) {
       args = JSON.parse(args);
       let slipNo = args.slipNumber;
       let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);
       
       asset.MOCapproval=true;
       await ctx.stub.putState(slipNo, Buffer.from(JSON.stringify(asset)));
    }

    async readReceiver(ctx, args) {
        args = JSON.parse(args);
        let slipNo = args.slipNumber;
        let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);
        return asset;
    }

    async readBagsForSlipNumber(ctx, args) {
        args = JSON.parse(args);
        let slipNo = args.slipNumber;
        let asset = await PrimaryContract.prototype.readReceiver(ctx, slipNo);
        asset = ({
            left: asset.left,
            LTapproval: asset.LTapproval,
            MOCapproval: asset.MOCapproval,
            status: asset.status,
            bags: asset.bags
        });
        return asset;
    }
}

module.exports = TechnicianContract;

