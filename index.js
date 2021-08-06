require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const app = express();

const fs = require("fs");
const { info } = require("console");
const filename = "./db.json";
const saltRounds = 10;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname + "/static"));

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/templates/login.html");
});

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/templates/signup.html");
});

app.get("/home", authenticateToken, (req, res) => {
  res.sendFile(__dirname + "/templates/home.html");
});

app.post("/signup", async (req, res) => {
  let user = req.body;
  if (
    user.password.trim() == "" ||
    user.username.trim() == "" ||
    user.email.trim() == ""
  )
    return res.send("Invalid Credentials");
  fs.readFile(filename, signUp);
  async function signUp(err, data) {
    if (err) return res.sendStatus(500);
    db = JSON.parse(data);
    const hash = await bcrypt.hash(user.password, saltRounds);
    user.password = hash;
    db.users.push(user);
    fs.writeFile(filename, JSON.stringify(db, null, "\t"), (err) => {
      if (err) return res.sendStatus(500);
      res.redirect("/login");
    });
  }
});

app.post("/home", (req, res) => {
  let info = req.body;
  let flag = 0;
  fs.readFile(filename, authenticat);

  async function authenticat(err, data) {
    if (err) return res.sendStatus(500);
    db = JSON.parse(data);
    let users = db.users;
    try {
      users.forEach(async (user) => {
        if (user.email == info.email) {
          if (bcrypt.compareSync(info.currentPassword, user.password)) {
            const hash = bcrypt.hashSync(info.newPassword, saltRounds);
            user.password = hash;
            flag = 1;
          } else {
            return res.send("Invalid Credentials");
          }
        }
      });
    } catch {
      res.sendStatus(500);
    }
    if (flag == 1) {
      fs.writeFile(filename, JSON.stringify(db, null, "\t"), (err) => {
        if (err) return res.sendStatus(500);
      });
      return res.send("Password updated");
    } else {
      return res.send("Invalid Credentials");
    }
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/login");
});

app.post("/login", (req, res) => {
  let info = req.body;
  fs.readFile(filename, authenticate);

  async function authenticate(err, data) {
    if (err) return res.sendStatus(500);
    db = JSON.parse(data);
    let users = db.users;
    const user = users.find((user) => user.email == info.email);
    if (user == null) return res.sendStatus(403);
    try {
      if (await bcrypt.compare(info.password, user.password)) {
        res.cookie("jwt", generateToken(user.email), {
          httpOnly: true,
          maxAge: 5 * 60 * 1000,
        });
        res.redirect("/home");
      } else {
        res.send("Invalid Credentials");
      }
    } catch {
      res.sendStatus(500);
    }
  }
});

function generateToken(payload) {
  return jwt.sign({ payload }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "300s",
  });
}

function authenticateToken(req, res, next) {
  token = req.cookies.jwt;
  if (!token) return res.redirect("/login");
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) return res.redirect("/login");
    req.email = payload;
    next();
  });
}

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}..`);
});
