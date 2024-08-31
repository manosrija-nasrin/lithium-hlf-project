var mysql = require('mysql');
const util = require('util');
var dist = require('geo-distance-js');
const url = require('url');
var connection = mysql.createConnection({
  host     : 'blqj8qqclqzg8w7dk5bs-mysql.services.clever-cloud.com',
  user     : 'ubzi27y7l0wv8xkr',
  password : 'UqE0X6WhPSZZvw71ybHi',
  database : 'blqj8qqclqzg8w7dk5bs'
});

queryResults=[];

const queryAsync = util.promisify(connection.query).bind(connection);


async function handleProcess(referenceCoordinates, bloodGroup) {
      try {
        // Query the database
        const queryResults = await queryAvailableBloodArea(bloodGroup, 'Kolkata');

        // Sort the results based on distance
        const sortedResults = sortResultsByDistance(queryResults, referenceCoordinates);

        console.log('Sorted Results:', sortedResults);
        return sortedResults;
      } catch (error) {
        console.error('Error querying the database:', error);
      } 
  }
  
async function queryAvailableBloodArea(bloodGroup, city) {
    const sql = `
        SELECT h.HospitalName, h.Address, h.Latitude, h.Longitude, COALESCE(SUM(CASE WHEN bb.Allocated != 'true' THEN bb.Quantity ELSE 0 END), 0) AS TotalQuantity
        FROM Hospital h
        JOIN HLFBloodStore bb ON h.HospitalName = bb.HospitalName
        WHERE h.City = ?
        AND bb.BloodGroup = ?
        GROUP BY h.HospitalName;` ;

    try {
        const results = await queryAsync(sql, [city, bloodGroup]);
        return results;
    } catch (error) {
        throw error;
    }
}

function sortResultsByDistance(results, referenceCoordinates) {
    return results.sort((a, b) => {
        const distA = dist.getDistance(a, referenceCoordinates);
        const distB = dist.getDistance(b, referenceCoordinates);

        return distA - distB;
    });
}
 
exports.sortRecords=async (req,res)=>{
try {
	const bloodGroup = decodeURIComponent(req.query.bloodGroup);
	const referenceCoordinates = { Latitude: req.params.Latitude, Longitude: req.params.Longitude };
	const response=await handleProcess(referenceCoordinates,bloodGroup);
	res.status(200).send(response);
}
catch(error) {
	console.error('An error occurred:', error);
}
}




