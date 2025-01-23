var mysql = require('mysql');

let connection;
const crossMatchTable = 'HLFPendingCrossMatchBloodBags';

function handleDisconnect() {
    connection = mysql.createConnection({
        host: 'blqj8qqclqzg8w7dk5bs-mysql.services.clever-cloud.com',
        user: 'ubzi27y7l0wv8xkr',
        password: 'UqE0X6WhPSZZvw71ybHi',
        database: 'blqj8qqclqzg8w7dk5bs'
    });

    connection.connect(err => {
        if (err) {
            console.error('Error connecting to database:', err);
            setTimeout(handleDisconnect, 2000); // Retry after 2 seconds
        }
        console.log('Connected to the database');
        // queryHLFBloodTable();
    });

    connection.on('error', err => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect(); // Reconnect on connection lost
        } else {
            throw err;
        }
    });
}

handleDisconnect();

// connection.connect((error) => {
//     if (error) {
//         console.error('Error connecting to the database:', error);
//         return;
//     }
//     console.log('Connected to the database');
//     queryHLFBloodTable();
// });

function createBloodTable() {
    const sql = `
       CREATE TABLE HLFBloodStore (
	    BagUnitNo VARCHAR(100),
	    BagSegmentNo VARCHAR(100),
	    HospitalName VARCHAR(100),
	    DateOfCollection DATE,
	    DateOfExpiry DATE,
	    Quantity INT,
	    BloodGroup VARCHAR(7),
        Allocated VARCHAR(100),
        CrossMatched VARCHAR(100),
        AllocatedTo VARCHAR(100),
        Donated VARCHAR(100),
        DonationDate VARCHAR(100),
	    PRIMARY KEY (BagUnitNo, BagSegmentNo),
	    FOREIGN KEY (HospitalName) REFERENCES Hospital(HospitalName)
	);
    `;

    connection.query(sql, (error, result) => {
        if (error) {
            console.error('Error creating table:', error);
            return;
        }
        console.log('Table created successfully');
    });
}

///////////////////////////// CROSS MATCH TABLE /////////////////////////////////////////////

function createPendingCrossmatchBloodBags() {
    const sql = `
       CREATE TABLE IF NOT EXISTS ${crossMatchTable} (
	    BagUnitNo VARCHAR(100),
	    BagSegmentNo VARCHAR(100),
	    HospitalName VARCHAR(100),
        DonatedBy VARCHAR(10),
        CrossMatched VARCHAR(100),
	    PRIMARY KEY (BagUnitNo, BagSegmentNo),
	    FOREIGN KEY (HospitalName) REFERENCES Hospital(HospitalName)
	);
    `;

    connection.query(sql, (error, result) => {
        if (error) {
            console.error('Error creating table:', error);
            return;
        }
        console.log('Table created successfully');
    });
}

exports.insertDonatedBloodBagForCrossMatch = async function name(BagUnitNo, BagSegmentNo, HospitalName, DonatedBy) {
    // TODO: Insert blood bag donated but pending crossmatch
    const sql = `INSERT INTO ${crossMatchTable}(BagUnitNo, BagSegmentNo, HospitalName, DonatedBy, CrossMatched)
            VALUES (?, ?, ?, ?, 'false')`;
    try {
        // Execute SQL query
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [BagUnitNo, BagSegmentNo, HospitalName, DonatedBy], (error, result) => {
                if (error) {
                    console.error('Error inserting Blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood record created successfully in cross-match table');
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.error('Error inserting Blood:', error);
        throw error;
    }
}

exports.getDonorOfBloodBag = async function (BagUnitNo, BagSegmentNo, HospitalName) {
    const sql = `SELECT DonatedBy
                FROM ${crossMatchTable}
                WHERE BagUnitNo=? AND BagSegmentNo=? AND HospitalName=? AND CrossMatched='false'`;
    try {
        // Execute SQL query
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [BagUnitNo, BagSegmentNo, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error finding Blood Bag:', error);
                    reject(error);
                    return;
                }
                console.log('Blood records fetched successfully:', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.error('Error fetching Blood:', error);
        throw error;
    }
}

exports.updateCrossMatchStatus = async function (BagUnitNo, BagSegmentNo, HospitalName, Status) {
    const crossMatchStatus = Status === 'false' ? 'failed' : 'passed';
    const sql = `
        UPDATE HLFBloodStore SET CrossMatched = '${crossMatchStatus}'
        WHERE BagUnitNo = ? AND BagSegmentNo = ? AND HospitalName = ? AND CrossMatched = 'false';
        `;
    try {
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [BagUnitNo, BagSegmentNo, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error updating blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood updation Successful:', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.log('Blood allocation updated successfully');
        throw error;
    }
}

exports.insertBlood = async function (BagUnitNo, BagSegmentNo, HospitalName, DateOfCollection, DateOfExpiry, Quantity, BloodGroup) {
    console.log(BagUnitNo + " " + BagSegmentNo + " " + HospitalName);
    const sql = `
        INSERT INTO HLFBloodStore(BagUnitNo, BagSegmentNo, HospitalName, DateOfCollection, DateOfExpiry, Quantity, BloodGroup, Allocated, AllocatedTo, CrossMatched,Donated,DonationDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'false', '', 'false','false','');
    `;

    try {
        // Execute SQL query
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [BagUnitNo, BagSegmentNo, HospitalName, DateOfCollection, DateOfExpiry, Quantity, BloodGroup], (error, result) => {
                if (error) {
                    console.error('Error inserting Blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood record created successfully');
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.error('Error inserting Blood:', error);
        throw error;
    }
};

exports.getBloodByExpiry = async function (HospitalName, BloodGroup, X) {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const sql = `
        SELECT BagUnitNo,BagSegmentNo FROM
        (SELECT * FROM HLFBloodStore
        WHERE Allocated = 'false' AND BloodGroup = ? AND HospitalName = ? AND DateOfExpiry >= ?
        ORDER BY DateOfExpiry ASC, Quantity ASC
        LIMIT ?) AS DATA
       
        `;
    try {
        // Execute SQL query
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [BloodGroup, HospitalName, today, X], (error, result) => {
                if (error) {
                    console.error('Error inserting Blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood records fetched successfully:', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.error('Error fetching Blood:', error);
        throw error;
    }
}

exports.allocateBlood = async function (BagUnitNo, BagSegmentNo, HospitalName, SlipNo) {
    const sql = `
        UPDATE HLFBloodStore SET Allocated = 'true', AllocatedTo = ?
        WHERE BagUnitNo = ? AND BagSegmentNo = ? AND HospitalName = ?;
        `;
    try {

        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [SlipNo, BagUnitNo, BagSegmentNo, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error selecting blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood selection Successfully:', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.log('Blood allocation updated successfully');
        throw error;
    }
}

exports.bagInfo = async function (BloodBagUnitNo, BloodBagSegmentNo, HospitalName) {
    const sql = `
        SELECT BloodGroup,AllocatedTo FROM HLFBloodStore
        WHERE BagUnitNo=? AND BagSegmentNo =? AND HospitalName =?;  
        `;
    try {
        // Execute SQL query
        const result = await new Promise((resolve, reject) => {
            console.log(BloodBagUnitNo + " " + BloodBagSegmentNo + " " + HospitalName);
            connection.query(sql, [BloodBagUnitNo, BloodBagSegmentNo, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error finding bag info:', error);
                    reject(error);
                    return;
                }
                console.log('Bag Info fetched successfully', result);
                resolve(result);
            });
        });
        return { data: result };
    } catch (error) {
        // Handle SQL query execution error
        console.error('Error fetching Blood:', error);
        throw error;
    }
}

exports.slips = async function (HospitalName) {
    const sql = `
        SELECT DISTINCT(AllocatedTo) FROM HLFBloodStore
        WHERE Allocated="true" AND Donated = "false" AND HospitalName = ?;
    `;

    try {
        // Execute SQL query
        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [HospitalName], (error, results) => {
                if (error) {
                    console.error('Error fetching slips:', error);
                    reject(error);
                    return;
                }
                console.log('Slips fetched successfully:', results);
                resolve(results);
            });
        });

        return { data: result };
    } catch (error) {
        // Handle SQL query execution error
        console.error('Error in slips function:', error);
        throw error;
    }
};


exports.deAllocateBlood = async function (BagUnitNo, BagSegmentNo, HospitalName) {
    const sql = `
        UPDATE HLFBloodStore SET Allocated = 'false', AllocatedTo = '', CrossMatched='false'
        WHERE BagUnitNo = ? AND BagSegmentNo = ? AND HospitalName = ?;
        `;
    try {

        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [BagUnitNo, BagSegmentNo, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error de-allocating blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood allocation updated successfully', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.log('Error de-allocating blood');
        throw error;
    }
}

exports.addCrossMatch = async function (BagUnitNo, BagSegmentNo, HospitalName) {
    const sql = `
        UPDATE HLFBloodStore SET  CrossMatched = 'true'
        WHERE BagUnitNo = ? AND BagSegmentNo = ? AND HospitalName = ?;
        `;
    try {

        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [BagUnitNo, BagSegmentNo, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error updating blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood updated successfully', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.log('Error updating blood');
        throw error;
    }
}


exports.deleteBloodRecord = async function (BagUnitNo, BagSegmentNo, HospitalName) {
    const DonationDate = new Date().toISOString().split('T')[0];
    const sql = `
        UPDATE HLFBloodStore SET  Donated = 'true', DonationDate = ?
        WHERE BagUnitNo = ? AND BagSegmentNo = ? AND HospitalName = ?;
        `;
    try {

        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [DonationDate, BagUnitNo, BagSegmentNo, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error deleting blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood deleted successfully', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.log('Error deleting blood:');
        throw error;
    }
}

exports.donateBloodRecord = async function (SlipNumber, HospitalName) {
    const DonationDate = new Date().toISOString().split('T')[0];
    const sql = `
        UPDATE HLFBloodStore SET  Donated = 'true', DonationDate = ?
        WHERE AllocatedTo = ? AND HospitalName = ?;
        `;
    try {

        const result = await new Promise((resolve, reject) => {
            connection.query(sql, [DonationDate, SlipNumber, HospitalName], (error, result) => {
                if (error) {
                    console.error('Error donating blood:', error);
                    reject(error);
                    return;
                }
                console.log('Blood donated successfully', result);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        // Handle SQL query execution error
        console.log('Error deleting blood:');
        throw error;
    }
}

function queryHLFBloodTable() {
    connection.query('SELECT * FROM HLFBloodStore;', (error, results, fields) => {
        if (error) throw error;
        console.log('bloodBagStore table:', results);
    });
}

///////////////////////////// CREATE HOSPITAL /////////////////////////////////////////////
function createHospitalTable() {
    const sql = `
       CREATE TABLE Hospital (
	    HospitalName VARCHAR(100) PRIMARY KEY,
	    City VARCHAR(50),
	    Area VARCHAR(50),
	    Latitude VARCHAR(50),
	    Longitude VARCHAR(50),
	    Address VARCHAR(50)
            );
    `;

    connection.query(sql, (error, result) => {
        if (error) {
            console.error('Error creating table:', error);
            return;
        }
        console.log('Table created successfully');
    });
}

///////////////////////////// INSERT HOSPITAL /////////////////////////////////////////////
exports.insertHospital = async (req, res) => {
    console.log(req.body);
    const { HospitalName, City, Area, Latitude, Longitude, Address } = req.body;

    try {
        const result = await insertHospitalAsync(HospitalName, City, Area, Latitude, Longitude, Address);
        res.status(200).json({ message: 'Hospital created successfully', result });
    } catch (error) {
        console.error('Error during insertion:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

function insertHospitalAsync(HospitalName, City, Area, Latitude, Longitude, Address) {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO Hospital (HospitalName, City, Area, Latitude, Longitude, Address)
            VALUES (?, ?, ?, ?, ?, ?);
        `;

        connection.query(sql, [HospitalName, City, Area, Latitude, Longitude, Address], (error, result) => {
            if (error) {
                console.error('Error inserting Hospital:', error);
                reject(error);
                return;
            }
            console.log('Hospital created successfully');
            resolve(result);
        });
    });
}


////////////////////////////////// QUERY ALL HOSPITALS ///////////////////////////////////////
exports.queryHospital = async (req, res) => {
    try {
        const results = await queryHospitalTable();
        //console.log(results);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function queryHospitalTable() {
    try {
        const results = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM Hospital;', (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        console.log('Hospital table:', results);
        return results;
    } catch (error) {
        console.error('Error querying Hospital table:', error);
        throw error;
    }
}

///////////////////////////////////////// QUERY STOCKS BELOW THRESHOLD /////////////////////////////
exports.getStocksBelowThreshold = async (req, res) => {
    try {
        const threshold = req.query.threshold;
        console.log(threshold);
        const sql = `
      SELECT h.HospitalName, bg.GroupType AS BloodGroup, COALESCE(SUM(CASE WHEN bb.Allocated != 'true' THEN bb.Quantity ELSE 0 END), 0) AS TotalBloodQuantity
      FROM Hospital h
      CROSS JOIN BloodGroups bg
      LEFT JOIN HLFBloodStore bb ON h.HospitalName = bb.HospitalName AND bg.GroupType = bb.BloodGroup
      WHERE bb.Allocated = 'false' OR bb.Allocated IS NULL
      GROUP BY h.HospitalName, bg.GroupType
      HAVING TotalBloodQuantity < ?;
    `;

        const results = await new Promise((resolve, reject) => {
            connection.query(sql, [threshold], (error, results, fields) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        console.log('Result:', results);
        res.json(results);
    } catch (error) {
        console.error('Error querying stocks below threshold:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


///////////////////////////////////////// CREATE AND QUERY BLOODGROUPS TABLE /////////////////////////////
function createBloodGroupTable() {
    const sql1 = `CREATE TABLE BloodGroups (GroupType VARCHAR(3) PRIMARY KEY);`;
    connection.query(sql1, (error, result) => {
        if (error) {
            console.error('Error creating BloodGroups table:', error);
            return;
        }
        console.log('BloodGroups table created successfully');
    });

    const sql2 = `INSERT INTO BloodGroups (GroupType) VALUES ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-');`;
    connection.query(sql2, (error, result) => {
        if (error) {
            console.error('Error inserting blood groups:', error);
            return;
        }
        console.log('Blood groups created successfully');
    });
}


function queryBloodGroupTable() {
    connection.query('SELECT * FROM BloodGroups;', (error, results, fields) => {
        if (error) throw error;
        console.log('BloodGroups table:', results);
    });
}

