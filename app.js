const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "twitterClone.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server has started at localhost");
    });
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`);
  }
};

initializeDbAndServer();
// git token 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
// final code

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.email = payload.email;
        next();
      }
    });
  }
};

app.get("/admin/create/:id", async (request, response) => {
  const { id } = request.params;
  response.send(id);
});

app.get("/show/table", async (request, response) => {
  const q =
    "CREATE  TABLE request_table (full_name varchar(100),email varchar(100),date varchar(100),service_type varchar(100),description varchar(200),address varchar(200),id varchar(100),top varchar(50),bottom varchar(50),woolen varchar(50),others varchar(50),status varchar(100),others_price varchar(100))";
  const dbResp = await db.run(q);
  console.log(dbResp);
});

app.put(
  "/admin/update/request/:id",
  authenticateToken,
  async (request, response) => {
    const { id } = request.params;
    const { status, othersPrice } = request.headers;
    const dbQuery = `UPDATE  request_table SET status ='${status}',others_price='${othersPrice}' WHERE id='${id}'; `;
    const dbResponse = await db.run(dbQuery);
    response.send(dbResponse);
  }
);

app.post("/user/register/", async (request, response) => {
  const { email, password, fullName, phone } = request.body;
  const checkUserQuery = `SELECT * FROM temp WHERE email="${email}";`;
  const dbResponse = await db.get(checkUserQuery);
  if (dbResponse === undefined) {
    const payload = {
      email: email,
    };
    const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
    const newUserQuery = `INSERT INTO temp (email,password,phone,full_name)
      VALUES ("${email}","${password}","${phone}","${fullName}");`;
    const dbResponse = await db.run(newUserQuery);
    console.log(jwtToken);
    response.send({ success_mag: "Account Registered Successfully", jwtToken });
  } else {
    response.status(400);
    response.send({ error_msg: "User Already Exist" });
  }
});

app.post("/user/login/", async (request, response) => {
  const { email, password } = request.body;
  console.log(email);
  const query = `SELECT * FROM temp WHERE email LIKE "${email}";`;
  const dbResponse = await db.get(query);

  if (dbResponse === undefined) {
    response.status(400);
    response.send({ error_msg: "Invalid User" });
  } else {
    const checkPassword = password === dbResponse.password;
    if (checkPassword === true) {
      const payload = {
        email: email,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      console.log(jwtToken);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send({ error_msg: "Email and Password Didn't Matched" });
    }
  }
});

app.post("/admin/login/", async (request, response) => {
  const { email, password } = request.body;
  console.log(email);
  const query = `SELECT * FROM admin WHERE email LIKE "${email}";`;
  const dbResponse = await db.get(query);

  if (dbResponse === undefined) {
    response.status(400);
    response.send({ error_msg: "Invalid User" });
  } else {
    const checkPassword = password === dbResponse.password;
    if (checkPassword === true) {
      const payload = {
        email: email,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      console.log(jwtToken);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send({ error_msg: "Email and Password Didn't Matched" });
    }
  }
});

app.get("/user/data/", authenticateToken, async (request, response) => {
  const { email } = request;
  const dbQuery = `SELECT * FROM temp where email='${email}'`;

  const dbResponse = await db.get(dbQuery);
  const reqQuery = `SELECT * FROM request_table where email="${email}"`;
  let requests = await db.all(reqQuery);

  dbResponse.requests = requests;

  response.send(dbResponse);
});

app.get("/admin/data/", authenticateToken, async (request, response) => {
  const { email } = request;

  const dbQuery = `SELECT * FROM admin WHERE email="${email}"`;
  const dbResponse = await db.get(dbQuery);

  const requestsQuery = "SELECT * FROM request_table ";
  const requestResponse = await db.all(requestsQuery);

  dbResponse.requests = requestResponse;
  response.send(dbResponse);
});

app.post(
  "/user/request/update/",
  authenticateToken,
  async (request, response) => {
    const { email } = request;
    const {
      top = "0",
      bottom = "0",
      woolen = "0",
      others = "0",
      date = "0",

      status = "new request",
      id = "0",
      serviceType = "0",
      description = "0",
      address = "0",
    } = request.body;
    const othersPrice = "0";
    const nameQuery = `SELECT full_name from temp WHERE email='${email}'`;
    const nameResponse = await db.get(nameQuery);

    const dbQuery = `INSERT INTO  request_table (description,service_type,address,others_price,id,email,full_name,top,bottom,woolen,others,date,status) VALUES ("${description}","${serviceType}","${address}","${othersPrice}","${id}","${email}","${nameResponse.full_name}","${top}","${bottom}","${woolen}","${others}","${date}","${status}");`;

    const dbResponse = await db.run(dbQuery);

    response.send({
      success_msg: "Request Sent",
      sample: { woolen, top, date, id },
    });
  }
);
app.put(
  "/admin/request/update/:id",
  authenticateToken,
  async (request, response) => {
    const { status, othersPrice } = request.body;
    const { id } = request.params;
    const dbjQuery = `UPDATE  request_table SET status="${status}",others_price="${othersPrice}" WHERE id="${id}"`;
    const dbResponse = await db.run(dbQuery);
    response.send({ success_msg: "Your Request has been Updated" });
  }
);

app.put("/user/update", authenticateToken, async (request, response) => {
  const { newEmail, newPassword, newFullName, newPhone } = request.body;
  const { email } = request;
  console.log(email === newEmail);

  const checkUserQuery = `SELECT * FROM temp WHERE email="${newEmail}"`;
  let checkResponse = await db.get(checkUserQuery);
  if (newEmail === email || checkResponse === undefined) {
    const dbQuery = `UPDATE temp SET email='${newEmail}',password='${newPassword}',full_name='${newFullName}',phone='${newPhone}' WHERE email='${email}'`;
    const tempResponse = await db.run(dbQuery);

    const queryTwo = `UPDATE request_table SET email='${newEmail}' WHERE email='${email}'`;
    const requestResponse = await db.run(queryTwo);

    const payload = {
      email: newEmail,
    };

    const x = `SELECT * FROM temp WHERE email="${newEmail}"`;
    const y = await db.get(x);
    console.log(y);
    const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
    console.log(jwtToken);
    response.send({
      jwtToken,
      success_msg: "Your Profile has been  Updated Successfully",
    });
  } else {
    response.status(400);
    console.log(checkResponse);
    response.send({ error_msg: "Email Already Exist " });
  }
});

app.put("/admin/update", authenticateToken, async (request, response) => {
  const { newEmail, newPassword, newFullName, newPhone } = request.body;
  const { email } = request;
  console.log(email === newEmail);

  const checkUserQuery = `SELECT * FROM admin WHERE email="${newEmail}"`;
  let checkResponse = await db.get(checkUserQuery);
  if (newEmail === email || checkResponse === undefined) {
    const dbQuery = `UPDATE admin SET email='${newEmail}',password='${newPassword}',full_name='${newFullName}',phone='${newPhone}' WHERE email='${email}'`;
    const tempResponse = await db.run(dbQuery);

    const payload = {
      email: newEmail,
    };

    const x = `SELECT * FROM temp WHERE email="${newEmail}"`;
    const y = await db.get(x);

    const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");

    response.send({
      jwtToken,
      success_msg: "Your Profile has been Updated Successfully",
    });
  } else {
    response.status(400);

    response.send({ error_msg: "Email Already Exist " });
  }
});
module.exports = app;
