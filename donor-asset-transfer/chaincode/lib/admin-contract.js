'use strict';

let Patient = require('./Patient.js');
const PrimaryContract = require('./primary-contract.js');
// const { BloomFilter } = require('bloom-filters')

class AdminContract extends PrimaryContract {
    async initBloomFilter(ctx) {
        if (this.bloomFilter === null) {
            this.bloomFilter = new BloomFilter(1000, 16); // 32 bytes, 16 hash functions
            let allResults = await this.queryAllPatients(ctx);
            for (let i = 0; i < allResults.length; i++) {
                if (allResults[i].healthId !== undefined) {
                    this.bloomFilter.add(allResults[i].healthId);
                } else {
                    console.log("No Patient ID:", allResults[i]);
                }
            }
            console.log("Bloom Filter Initialized with Patient IDs");
        } else {
            console.log("Bloom Filter Already Initialized");
        }
    }

    generateHealthId() {
        // generate a random patient ID: 12 digit numeric ID. It should contain only digits between 0 and 9 (both inclusive)
        let healthId = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
        // check if the patient ID already exists in the bloom filter
        // if (this.bloomFilter.has(healthId)) {
        //     console.log("Patient ID already exists in the bloom filter, generating a new one");
        //     return this.generateHealthId();
        // } else {
        //     this.bloomFilter.add(healthId);
        //     return healthId;
        // }
        return healthId;
    }

    async getLatestPatientId(ctx) {
        let allResults = await this.queryAllPatients(ctx);
        let maxID = 0;
        for (let i = 0; i < allResults.length; i++) {
            if (allResults[i].healthId !== undefined) {
                let currID = parseInt(allResults[i].healthId.slice(3));
                if (currID > maxID) maxID = currID;
            } else {
                console.log("No Patient ID:", allResults[i]);
            }
        }

        return 'PID' + maxID;
    }

    async createPatient(ctx, args) {
        try {
            args = JSON.parse(args);
            // await this.initBloomFilter(ctx);

            if (args.password === null || args.password === '') {
                throw new Error(`Empty or null values should not be passed for password parameter`);
            }
            let patientExists;
            let healthId;
            do {
                healthId = this.generateHealthId();
                console.log("Generated Health ID:", healthId);
                patientExists = await this.patientExists(ctx, healthId);
                if (patientExists) console.error(`The patient ${healthId} already exists`);
            } while (patientExists);

            let newPatient = new Patient(healthId, args.firstName, args.lastName, args.password, args.dob,
                args.phoneNumber, args.aadhar, args.address, args.bloodGroup, args.sex);

            const buffer = Buffer.from(JSON.stringify(newPatient));
            await ctx.stub.putState(healthId, buffer);
            return { state: "success", healthId: healthId };
        } catch (err) {
            console.error('Error creating patient:', err);
            return { state: "error", error: err.message };
        }
    }

    async readPatient(ctx, healthId) {
        let asset = await super.readPatient(ctx, healthId)

        asset = ({
            healthId: healthId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            sex: asset.sex,
            phoneNumber: asset.phoneNumber,
            aadhar: asset.aadhar
        });
        return asset;
    }

    async deletePatient(ctx, healthId) {
        const exists = await this.patientExists(ctx, healthId);
        if (!exists) {
            throw new Error(`The patient ${healthId} does not exist`);
        }
        await ctx.stub.deleteState(healthId);
    }

    async queryPatientsByLastName(ctx, lastName) {
        let queryString = {
            selector: {
                docType: 'patient',
                lastName: lastName
            }
        };
        const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        let asset = JSON.parse(buffer.toString());

        return this.fetchLimitedFields(asset);
    }

    async queryPatientsByFirstName(ctx, firstName) {
        let queryString = {
            selector: {
                docType: 'patient',
                firstName: firstName
            }
        };
        const buffer = await this.getQueryResultForQueryString(ctx, JSON.stringify(queryString));
        let asset = JSON.parse(buffer.toString());

        return this.fetchLimitedFields(asset);
    }

    async queryAllPatients(ctx) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let assets = await this.getAllPatientResults(resultsIterator, false);
        return this.fetchLimitedFields(assets);
    }

    fetchLimitedFields = assets => {
        let newArray = [];
        for (let i = 0; i < assets.length; i++) {
            const obj = assets[i];
            console.debug("Key:" + obj.Key);
            if (obj.Key && obj.Key.match(/^[0-9]{12}$/)) {
                newArray.push({
                    healthId: obj.Key,
                    firstName: obj.Record.firstName,
                    lastName: obj.Record.lastName,
                    phoneNumber: obj.Record.phoneNumber,
                    aadhar: obj.Record.aadhar
                });
            }
        }
        console.debug("INFO: " + newArray.length + " patient records fetched for admin")
        return newArray;
    }
}
module.exports = AdminContract;
