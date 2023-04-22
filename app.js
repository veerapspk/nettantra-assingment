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

app.get("/sample/", (request, response) => {
  response.send("<h1> hello welcome</h1>");
});

module.exports = app;
