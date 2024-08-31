/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const PrimaryContract = require('./primary-contract.js');
const { Contract } = require('fabric-contract-api');
const Receiver = require('./Receiver.js');

class DoctorContract extends PrimaryContract {
    
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
       asset.status = "ready to dispatch";
       await ctx.stub.putState(slipNo, Buffer.from(JSON.stringify(asset)));
    }
}

module.exports = DoctorContract;

