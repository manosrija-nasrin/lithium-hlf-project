/**
 * @desc Add admin of SuperOrg. Execute node addSuperOrg.js to execute
 */


/* eslint-disable new-cap */
const {enrollAdminSuperOrg} = require('./enrollAdmin-superOrg');
const redis = require('redis');

/**
 * @description enrol admin of hospital 3 in redis
 */
async function initRedis3() {
  redisUrl = 'redis://127.0.0.1:6381';
  redisPassword = 'superOrglithium';
  redisClient = redis.createClient(redisUrl);
  redisClient.AUTH(redisPassword);
  redisClient.SET('superOrgadmin', redisPassword);
  console.log('Done');
  redisClient.QUIT();
  return;
}

/**
 * @description enrol admin of hospital 3
 */
async function main() {
  await enrollAdminSuperOrg();
  await initRedis3();
}

main();
