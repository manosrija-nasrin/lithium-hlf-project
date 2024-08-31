'use strict';

const { Contract } = require('fabric-contract-api');
let Receiver = require('./Receiver.js');

class PrimaryContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }
    
    
    async readReceiver(ctx, slipId) {
        const exists = await this.receiverExists(ctx, slipId);
        if (!exists) {
            throw new Error(`The receiver ${slipId} does not exist`);
        }

        const buffer = await ctx.stub.getState(slipId);
        let asset = JSON.parse(buffer.toString());
        return asset;
    }
    
    async receiverExists(ctx, slipId) {
        const buffer = await ctx.stub.getState(slipId);
        return (!!buffer && buffer.length > 0);
    }

}
module.exports = PrimaryContract;
