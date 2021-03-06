const express = require("express");
const coockieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const validator = require("express-validator");
const ejs = require("ejs");
const engine = require("ejs-mate");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
const passport = require("passport");
const flash = require("connect-flash");

const app = express();

const uri = process.env.MONGODB_URI;

mongoose.Promise = global.Promise;
mongoose.connect(uri, function(err, res) {
  if (err) {
    console.log("ERROR connecting to: " + uri + ". " + err);
  } else {
    console.log("Succeeded connected to: " + uri);
  }
});

require("./config/passport");

app.use(express.static("public"));
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.use(coockieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(validator());

app.use(
  session({
    secret: "Thisismyteskey",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

require("./routes/user")(app, passport);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("App runing on ...", port);
});
