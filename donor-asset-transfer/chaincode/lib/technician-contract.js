'use strict';
const PrimaryContract = require('./primary-contract.js');
const { Contract } = require('fabric-contract-api');

class TechnicianContract extends PrimaryContract
{
    async readBag(ctx,args){
    let ar=JSON.parse(args);
    let bagID=(ar.bloodBagType=='temprecord'?'T':'F')+ar.bloodBagUnitNo +'S'+ ar.bloodBagSegmentNo;
    let asset = await PrimaryContract.prototype.readBag(ctx, bagID)
        asset = ({
            bloodBagUnitNo: asset.bloodBagUnitNo,
            bloodBagSegmentNo: asset.bloodBagSegmentNo,
            type: asset.type,
            dateOfCollection:asset.dateOfCollection,
            dateOfExpiry:asset.dateOfExpiry,
            quantity: asset.quantity,
            bloodGroup: asset.bloodGroup,
            hospName: asset.hospName
        });
        return asset;
    }
}
module.exports = TechnicianContract;
