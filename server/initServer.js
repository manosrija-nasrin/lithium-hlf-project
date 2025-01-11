/* eslint-disable new-cap */

const fs = require('fs');

const {enrollAdminHosp1} = require('./enrollAdmin-Hospital1'); // Import function to enroll admin for Hospital 1
const {enrollAdminHosp2} = require('./enrollAdmin-Hospital2'); // Import function to enroll admin for Hospital 2
const {enrollRegisterUser} = require('./registerUser'); // Import function to enroll and register a user
const {createRedisClient} = require('./utils'); // Import utility function to create a Redis client

const redis = require('redis'); // Import Redis library

/**
 * @description Enrolls and registers the donors in the initLedger as users.
 */
async function initLedger() {
  try {
    const jsonString = fs.readFileSync('../donor-asset-transfer/chaincode/lib/initLedgerDonor.json'); // Read JSON file containing donor data
    const donors = JSON.parse(jsonString); // Parse the JSON file
    let i = 0;
    for (i = 0; i < donors.length; i++) {
      const attr = {firstName: donors[i].firstName, lastName: donors[i].lastName, role: 'donor'}; // Create attributes for each donor
      await enrollRegisterUser('1', 'PID'+i, JSON.stringify(attr)); // Enroll and register each donor
    }
  } catch (err) {
    console.log(err); // Log any errors
  }
}

/**
 * @description Init the redis db with the admins credentials
 */
async function initRedis() {
  let redisUrl = 'redis://127.0.0.1:6379';
  let redisPassword = 'hosp1lithium';
  let redisClient = redis.createClient(redisUrl); // Create Redis client for Hospital 1
  redisClient.AUTH(redisPassword); // Authenticate Redis client
  redisClient.SET('hosp1admin', redisPassword); // Set admin credentials in Redis
  redisClient.QUIT(); // Quit the Redis client

  redisUrl = 'redis://127.0.0.1:6380';
  redisPassword = 'hosp2lithium';
  redisClient = redis.createClient(redisUrl); // Create Redis client for Hospital 2
  redisClient.AUTH(redisPassword); // Authenticate Redis client
  redisClient.SET('hosp2admin', redisPassword); // Set admin credentials in Redis
  console.log('Done'); // Log completion message
  redisClient.QUIT(); // Quit the Redis client
  return;
}

/**
 * @description Create doctors in both organizations based on the initDoctors JSON
 */
async function enrollAndRegisterDoctors() {
  try {
    const jsonString = fs.readFileSync('./initDoctors.json'); // Read JSON file containing doctor data
    const doctors = JSON.parse(jsonString); // Parse the JSON file
    for (let i = 0; i < doctors.length; i++) {
      const attr = {fullName: doctors[i].fullName, address: doctors[i].address, phoneNumber: doctors[i].phoneNumber, emergPhoneNumber: doctors[i].emergPhoneNumber, role: 'doctor', registration: doctors[i].registration}; // Create attributes for each doctor
      doctors[i].hospitalId = parseInt(doctors[i].hospitalId); // Convert hospitalId to integer
      const redisClient = createRedisClient(doctors[i].hospitalId); // Create a Redis client for each hospital
      (await redisClient).SET('HOSP' + doctors[i].hospitalId + '-' + 'DOC' + doctors[i].registration, 'password'); // Set doctor credentials in Redis
      await enrollRegisterUser(doctors[i].hospitalId, 'HOSP' + doctors[i].hospitalId + '-' + 'DOC' + doctors[i].registration, JSON.stringify(attr)); // Enroll and register each doctor
      (await redisClient).QUIT(); // Quit the Redis client
    }
  } catch (error) {
    console.log(error); // Log any errors
  }
};

async function enrollAndRegisterTechnicians() {
  try {
    const jsonString = fs.readFileSync('./initTechnicians.json'); // Read JSON file containing technician data
    const technicians = JSON.parse(jsonString); // Parse the JSON file
    for (let i = 0; i < technicians.length; i++) {
      const attr = {fullName: technicians[i].fullName, address: technicians[i].address, phoneNumber: technicians[i].phoneNumber, emergPhoneNumber: technicians[i].emergPhoneNumber, role: 'technician', registration: technicians[i].registration}; // Create attributes for each technician
      technicians[i].hospitalId = parseInt(technicians[i].hospitalId); // Convert hospitalId to integer
      const redisClient = createRedisClient(technicians[i].hospitalId); // Create a Redis client for each hospital
      (await redisClient).SET('HOSP' + technicians[i].hospitalId + '-' + 'TECH' + technicians[i].registration, 'password'); // Set technician credentials in Redis
      await enrollRegisterUser(technicians[i].hospitalId, 'HOSP' + technicians[i].hospitalId + '-' + 'TECH' + technicians[i].registration, JSON.stringify(attr)); // Enroll and register each technician
      (await redisClient).QUIT(); // Quit the Redis client
    }
  } catch (error) {
    console.log(error); // Log any errors
  }
};

/**
 * @description Function to initialise the backend server, enrolls and register the admins and initLedger donors.
 * @description Need not run this manually, included as a prestart in package.json
 */
async function main() {
  // await enrollAdminHosp1();
  // await enrollAdminHosp2();
  // await initLedger();
  // await initRedis();
  // await enrollAndRegisterDoctors();
  // await enrollAndRegisterTechnicians();
}

main(); // Execute the main function

