/* eslint-disable new-cap */
/**
 * @desc NodeJS APIs to interact with the fabric network.
 * @desc Look into API docs for the documentation of the routes
 */

// Classes for Node Express
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const jwtSecretToken = "password";
const refreshSecretToken = "refreshpassword";
let refreshTokens = [];

// Express Application init
const app = express();
app.use(morgan("combined"));
app.use(bodyParser.json());
app.use(cors());

app.listen(3001, () => console.log("Backend server running on 3001"));

// Bring key classes into scope
const donorRoutes = require("./donor-routes");
const doctorRoutes = require("./doctor-routes");
const superRoutes = require("./super-routes");
const technicianRoutes = require("./technician-routes");
const adminRoutes = require("./admin-routes");
const databaseRoutes = require("./databaseConnect");
const geoRoutes = require("./geoRoutes");
const {
  ROLE_SUPER,
  ROLE_DOCTOR,
  ROLE_TECHNICIAN,
  ROLE_ADMIN,
  ROLE_DONOR,
  CHANGE_TMP_PASSWORD,
} = require("../utils");
const { createRedisClient, capitalize, getMessage } = require("../utils");
const network = require("../../donor-asset-transfer/application-javascript/app.js");

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    if (token === "" || token === "null") {
      return res.status(401).send("Unauthorized request: Token is missing");
    }
    jwt.verify(token, jwtSecretToken, (err, user) => {
      if (err) {
        return res
          .status(403)
          .send("Unauthorized request: Wrong or expired token found");
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(401).send("Unauthorized request: Token is missing");
  }
};

/**
 * @description Generates a new accessToken
 */
function generateAccessToken(username, role) {
  return jwt.sign({ username: username, role: role }, jwtSecretToken, {
    expiresIn: "5m",
  });
}

/**
 * @description Login and create a session with and add two variables to the session
 */

app.post("/login", async (req, res) => {
  try {
    // Read username and password from request body
    let { username, password, hospitalId, role } = req.body;
    hospitalId = parseInt(hospitalId);
    let user;

    if (username.includes("DOC") && role === ROLE_DOCTOR) {
      const redisClient = await createRedisClient(hospitalId);
      const value = await redisClient.get(username);
      console.debug("got this from redis", value);
      console.debug("got this as pw", password);
      user = value === password;
      redisClient.quit();
    }

    if (username.includes("SUP") && role === ROLE_SUPER) {
      const redisClient = await createRedisClient(hospitalId);
      const value = await redisClient.get(username);
      console.debug("got this from redis", value);
      console.debug("got this as pw", password);
      user = value === password;
      redisClient.quit();
    }

    if (username.includes("admin") && role === ROLE_ADMIN) {
      const redisClient = await createRedisClient(hospitalId);
      const value = await redisClient.get(username);
      console.debug("got this from redis", value);
      console.debug("got this as pw", password);
      user = value === password;
      redisClient.quit();
    }

    if (username.includes("TECH") && role === ROLE_TECHNICIAN) {
      const redisClient = await createRedisClient(hospitalId);
      const value = await redisClient.get(username);
      console.debug("got this from redis", value);
      console.debug("got this as pw", password);
      user = value === password;
      redisClient.quit();
    }

    if (role === ROLE_DONOR) {
      const networkObj = await network.connectToNetwork(username);
      const newPassword = req.body.newPassword;

      if (!newPassword || newPassword === "") {
        const value = crypto
          .createHash("sha256")
          .update(password)
          .digest("hex");
        const response = await network.invoke(
          networkObj,
          true,
          capitalize(role) + "Contract:getDonorPassword",
          username
        );
        if (response.error) {
          res.status(400).send(response.error);
          return; // Exit early if there's an error
        } else {
          const parsedResponse = await JSON.parse(response);
          console.log(
            "got parsed response",
            parsedResponse,
            "with value",
            value
          );
          if (parsedResponse.password.toString("utf8") === value) {
            !parsedResponse.pwdTemp
              ? (user = true)
              : res.status(200).send(getMessage(false, CHANGE_TMP_PASSWORD));
          }
        }
      } else {
        let args = {
          donorId: username,
          newPassword: newPassword,
        };
        args = [JSON.stringify(args)];
        const response = await network.invoke(
          networkObj,
          false,
          capitalize(role) + "Contract:updateDonorPassword",
          args
        );
        console.log("got this response on update pw", response);
        if (response.error) {
          res.status(500).send(response.error);
          return; // Exit early if there's an error
        } else {
          user = true;
        }
      }
    }

    if (user) {
      const accessToken = generateAccessToken(username, role);
      const refreshToken = jwt.sign(
        { username: username, role: role },
        refreshSecretToken
      );
      refreshTokens.push(refreshToken);
      res.status(200);
      res.json({
        accessToken,
        refreshToken,
      });
    } else {
      res.status(400).send({ error: "Username or password incorrect!" });
    }
  } catch (error) {
    // Handle any errors that occur within the try block
    console.error("Error occurred:", error);
    res.status(500).send({ error: "An unexpected error occurred." });
  }
});

/**
 * @description Creates a new accessToken when refreshToken is passed in post request
 */
app.post("/token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.sendStatus(401);
  }

  if (!refreshTokens.includes(token)) {
    return res.sendStatus(403);
  }

  jwt.verify(token, refreshSecretToken, (err, username) => {
    if (err) {
      return res.sendStatus(403);
    }

    const accessToken = generateAccessToken({
      username: username,
      role: req.headers.role,
    });
    res.json({
      accessToken,
    });
  });
});

/**
 * @description Logout to remove refreshTokens
 */
app.delete("/logout", (req, res) => {
  refreshTokens = refreshTokens.filter((token) => token !== req.headers.token);
  res.sendStatus(204);
});

// //////////////////////////////// Admin Routes //////////////////////////////////////
app.post("/doctors/register", authenticateJWT, adminRoutes.createDoctor);
app.post("/supers/register", authenticateJWT, adminRoutes.createSuper);
app.get("/donors/_all", authenticateJWT, adminRoutes.getAllDonors);
app.post("/donors/register", authenticateJWT, adminRoutes.createDonor);
app.get(
  "/technicians/:hospitalId([0-9]+)/_all",
  authenticateJWT,
  adminRoutes.getTechniciansByHospitalId
);
app.post(
  "/technicians/register",
  authenticateJWT,
  adminRoutes.createTechnician
);
app.delete("/:adminId/delete/:Id", authenticateJWT, adminRoutes.deleteUser);

// //////////////////////////////// Doctor Routes //////////////////////////////////////
app.patch(
  "/donors/:donorId/details/medical",
  authenticateJWT,
  doctorRoutes.updateDonorMedicalDetails
);
app.get(
  "/doctors/:hospitalId([0-9]+)/:doctorId(HOSP[0-9]+-DOC[0-9]+)",
  authenticateJWT,
  doctorRoutes.getDoctorById
);
app.post(
  "/doctor/screendonor/:doctorId(HOSP[0-9]+-DOC[0-9]+)",
  authenticateJWT,
  doctorRoutes.screenDonor
);
app.post("/doctor/blood-collect", authenticateJWT, doctorRoutes.collectBlood);
app.get("/doctor/MOCapproval", authenticateJWT, doctorRoutes.MOCapproval);
app.post(
  "/doctor/sendMOCapproval",
  authenticateJWT,
  doctorRoutes.sendMOCapproval
);

// //////////////////////////////// Super Routes //////////////////////////////////////
app.get(
  "/supers/:hospitalId([0-9]+)/:superId(HOSP[0-9]+-SUP[0-9]+)",
  authenticateJWT,
  superRoutes.getSuperById
);
app.get(
  "/supers/:hospitalId([0-9]+)/:superId(HOSP[0-9]+-SUP[0-9]+)/blockedlist",
  authenticateJWT,
  superRoutes.getBlockedDonors
);
app.get("/supers/:hospitalId([0-9]+)/_all", authenticateJWT, adminRoutes.getSupersByHospitalId);

/////////////////////////////////// Technician Routes //////////////////////////////////
app.get(
  "/technicians/:hospitalId([0-9]+)/:technicianId(HOSP[0-9]+-TECH[0-9]+)",
  authenticateJWT,
  technicianRoutes.getTechnicianById
);
app.post("/technician/bloodtest", authenticateJWT, async (req, res) => {
  try {
    await technicianRoutes.bloodTestOfBloodBags(req, res);
    console.log("FINISHED" + res);
  } catch (error) {
    console.error("Error handling bloodtest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post(
  "/technician/readbloodbag",
  authenticateJWT,
  technicianRoutes.readBloodBag
);
app.get(
  "/technician/checkbloodavailability",
  authenticateJWT,
  technicianRoutes.checkBloodAvailability
);
app.post(
  "/technician/bloodallocation",
  authenticateJWT,
  technicianRoutes.allocateBag
);
app.post(
  "/technician/crossmatchblood",
  authenticateJWT,
  technicianRoutes.crossMatchResults
);
app.post(
  "/technician/finalDispatch",
  authenticateJWT,
  technicianRoutes.confirmbloodReceival
);
app.post(
  "/technician/readreceiverbloodbag",
  authenticateJWT,
  technicianRoutes.readReceiverBloodBag
);
app.post(
  "/technician/bloodrequest",
  authenticateJWT,
  technicianRoutes.bloodRequest
);
app.post(
  "/technician/readallocatedbloodbag",
  authenticateJWT,
  technicianRoutes.readAllocatedBloodBag
);
app.get("/technician/LTapproval", authenticateJWT, technicianRoutes.LTapproval);
app.post(
  "/technician/sendLTapproval",
  authenticateJWT,
  technicianRoutes.sendLTapproval
);

// //////////////////////////////// Donor Routes //////////////////////////////////////
app.get("/donors/:donorId", authenticateJWT, donorRoutes.getDonorById);
app.patch(
  "/donors/:donorId/details/personal",
  authenticateJWT,
  donorRoutes.updateDonorPersonalDetails
);
app.get(
  "/donors/:donorId/history",
  authenticateJWT,
  donorRoutes.getDonorHistoryById
);
app.get(
  "/doctors/:hospitalId([0-9]+)/_all",
  authenticateJWT,
  adminRoutes.getSupersByHospitalId
);
app.patch(
  "/donors/:donorId/grant/:doctorId",
  authenticateJWT,
  donorRoutes.grantAccessToDoctor
);
app.patch(
  "/donors/:donorId/revoke/:doctorId",
  authenticateJWT,
  donorRoutes.revokeAccessFromDoctor
);

///////////////////////////////////DatabaseConnect Routes /////////////////////////////
app.get("/viewhospitals", databaseRoutes.queryHospital);
app.post("/addHospital", databaseRoutes.insertHospital);
app.get("/displayStocksBelowThreshold", databaseRoutes.getStocksBelowThreshold);

/////////////////////////////////// Geo Routes ////////////////////////////////////////
app.get("/geo/:Latitude/:Longitude", geoRoutes.sortRecords);
