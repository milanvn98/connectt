const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const app = express();
const https = require("https");
const fs = require("fs");


///////////////////////////////////////////Certificates/////////////////////////////////////////////

//sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt
var key = fs.readFileSync(__dirname + "/certs/selfsigned.key");
var cert = fs.readFileSync(__dirname + "/certs/selfsigned.crt");
var options = {
  key: key,
  cert: cert,
};

///////////////////////////////////////////Express Setup/////////////////////////////////////////////
app.set("view engine", "ejs")
.use(bodyParser.urlencoded({ extended: true }))
.use(express.static(__dirname + "/public/"))
.use(require('./modules/web/navigation'))
// .use(require('./modules/web/login'))
// .use(require('./modules/employee-integration/xero'))
// .use(require('./modules/KTExtract/KTExtract'))
// .use(require('./modules/KTExtract/Tsheets'));

let port = process.env.PORT;
if(port == "" || port == null){
  port = 3000
}

///////////////////////////////////////////Listener/////////////////////////////////////////////

app.use(function (req, res, next) {
  res.status(404).render("404");
});

// var server = https.createServer(options, app);

// server.listen(port, () => {
//   console.log("Listening on port: " + port);
// });

app.listen(port, function(){
  console.log('Listening on ' + port)
})

// NODE_TLS_REJECT_UNAUTHORIZED=0 nodemon app.js