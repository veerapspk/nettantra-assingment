const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

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

app.get("/sample/add", async (request, response) => {
  let ok = "fdjkf";
  try {
    const db2 = "ALTER TABLE request_table ADD COLUMN date varchar(100)";
    ok = await db.run(db2);
  } catch (error) {
    console.log(error);
  }
  console.log(ok);
  response.send("ok");
});

app.get("/sample/send", async (request, response) => {
  const dbQuery = `DELETE FROM temp `;
  const x = await db.run(dbQuery);
  const y = "SELECT * FROM temp";
  const dbResponse = await db.all(y);

  response.send(dbResponse);
});

// new jhj hkjhk iuhguiguo oi hiohio hih og

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
    response.send({ jwtToken });
  } else {
    response.status(400);
    response.send("User Already Exist");
  }
});

app.post("/user/login/", async (request, response) => {
  const { email, password } = request.body;
  console.log(email);
  const query = `SELECT * FROM temp WHERE email LIKE "${email}";`;
  const dbResponse = await db.get(query);

  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid User");
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
      response.send("Email and Password Didn't Matched");
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

app.post("/request/update", authenticateToken, async (request, response) => {
  const { email } = request;
  const {
    top = 0,
    bottom = 0,
    woolen = 0,
    others = 0,
    date,
    notification = false,
    status = "accepted",
  } = request.body;
  const dbQuery = `INSERT INTO  request_table (email,top,bottom,woolen,others,date,status,notification) VALUES ("${email}","${top}","${bottom}","${woolen}","${others}","${date}","${status}",${notification});`;
  const dbResponse = await db.run(dbQuery);
  response.send({ msg: "Request Sent" });
});

app.put("/user/update", authenticateToken, async (request, response) => {
  const { newEmail, newPassword, newFullName, newPhone } = request.body;
  const { email } = request;
  console.log(email === newEmail);

  const checkUserQuery = `SELECT * FROM temp WHERE email="${newEmail}"`;
  let checkResponse = await db.get(checkUserQuery);
  if (newEmail === email || checkResponse === undefined) {
    console.log("fdfjdkj");

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
    response.send({ jwtToken, msg: "Your Profile has Updated Successfully" });
  } else {
    response.status(400);
    console.log(checkResponse);
    response.send("Email Already Exist ");
  }
});
module.exports = app;
