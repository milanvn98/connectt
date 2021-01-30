const express = require("express");
const url = require("url");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const https = require("https");
const fs = require("fs");
const { XeroClient } = require("xero-node");
const { TokenSet } = require("openid-client");
const mailgun = require("mailgun-js")({
  apiKey: process.env.API,
  domain: process.env.DOMAIN,
});

///////////////////////////////////////////Certificates/////////////////////////////////////////////

//sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key -out selfsigned.crt
var key = fs.readFileSync(__dirname + "/certs/selfsigned.key");
var cert = fs.readFileSync(__dirname + "/certs/selfsigned.crt");
var options = {
  key: key,
  cert: cert,
};

///////////////////////////////////////////Express Setup/////////////////////////////////////////////
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public/"));


let port = process.env.PORT;
if(port == "" || port == null){
  port = 3000
}


//Login Session
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

/////////////////////////////////////////// Mongo /////////////////////////////////////////////////////

//mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
// mongoose.connect("mongodb://localhost:27017/connecttbs", {
  mongoose.connect("mongodb+srv://admin-milan:milan6226@cluster0.julte.mongodb.net/connecttbs?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

//Create User
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Create Client
const clientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  company: String,
  email: String,
  phone: String,
});
const Client = mongoose.model("Client", clientSchema);

//Create New Employee Request
const requestSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  jobTitle: String,
  startDate: Date,
  classification: String,
  employmentBasis: String,
  rate: String,
  status: String,
  company: String,
  token: String,
  tenant: String,
});
const Request = mongoose.model("Request", requestSchema);

//Create TokenSet
const tokenSchema = new mongoose.Schema({
  id_token: String,
  access_token: String,
  expires_at: String,
  token_type: String,
  refresh_token: String,
  scope: String,
  session_state: String,
  request: String,
});
const Token = mongoose.model("Token", tokenSchema);

//Create Tenant
const tenantSchema = new mongoose.Schema({
  id: String,
  authEventId: String,
  tenantId: String,
  tenantType: String,
  tenantName: String,
  createdDateUtc: String,
  updatedDateUtc: String,
  superFunds: [Object],
});
const Tenant = mongoose.model("Tenant", tenantSchema);

/////////////////////////////////////////// Xero Connection /////////////////////////////////////////////
const xero = new XeroClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUris: [process.env.REDIRECT_URI],
  openIdClient: TokenSet,
  scopes: "openid profile email payroll.employees offline_access accounting.transactions accounting.settings payroll.payruns payroll.payslip payroll.timesheets payroll.settings".split(" "),
  state: "",
  httpTimeout: 8000,
});

//Authorisation
app.post("/get-authorised", async function (req, res) {
  const reqID = req.body.reqID;
  const tenantID = req.body.tenantId
  xero.config.state = "reqID="+ reqID + "&tenantID=" + tenantID;

  console.log(xero.config.state)

  let consentUrl = await xero.buildConsentUrl().catch( err => { console.log(err)});
  res.redirect(consentUrl);
});



//Callback
app.get("/callback", async function (req, res) {

  const state = xero.config.state
  console.log(state)
  const requestID = state.split('&')[0].split('=')[1];

  let tenantID = state.split('&')[1].split('=')[1];
  
  const token = await xero.apiCallback(req.url).catch((err) => {console.log(err);});
  const xeroTenants = await xero.updateTenants(false).catch((err) => {console.log(err);});
  const tenants = xeroTenants.sort((a, b) => (a.createdDateUtc > b.createdDateUtc) ? -1 : 1);

  if(tenantID == "NoID"){
    tenantID = tenants[0].tenantId // Check This for Sorting!!!!!!!!!!!!!!!!!!!!!!!!
  }

  const tenant = tenants.find(tenant => (tenant.tenantId = tenantID))
  const newXeroClient = new XeroClient();
  
  token['request'] = requestID
  token['tenant'] = tenant['tenantId']
  
  tenant['request'] = requestID
  tenant['token'] = token['refresh_token']
  
   //Create Token
   Token.create(token, function (err, token){});

  console.log(token)
  await xero.setTokenSet(token)
  const response = await xero.payrollAUApi.getSuperfunds(tenantID).catch((err) => {res.send(err);});
  
  //Find or Create Tenant
  Tenant.findOne({ tenantId: tenant["tenantId"] }, function (err, tnt) {
    if(!tnt){
      Tenant.create(tenant, function (error, t) {
        t['superFunds'] = response['response']['body']['SuperFunds']
        t.save()
      })
    } else {
      tnt['superFunds'] = response['response']['body']['SuperFunds']
      tnt.save()
    }});

//   //Find Request
  Request.findOne({ _id: requestID }, function (err, request) {
    request['token'] = token['refresh_token']
    request['tenant'] = tenant['tenantId']
    request.status = "Pending";
    request.save();
    

  // Message
    const data = {
    from: "admin@connecttbs.com",
    to: request.email,
    subject: "RE Position at " + request.company,
    html: `
    <p style="margin-bottom: 20px;"> Hi! <br> Welcome to ` + request["company"] + `. Please click the link below to complete your application:</p>
    <a href="`+ buildLink(tenant['tenantId'], token['refresh_token']) +`" style="background-color: rgb(17,184,217); color: white; padding: 10px 80px; border-radius: 10px; text-decoration: none; margin: 60px 0; font-weight: 700;">Authorise</a>
    <br>
    <p style="margin: 60px 0;">Thank you! <br> Kind Regards, <br> Connectt Total Business Solutions</p>`
};

  //Send
  mailgun.messages().send(data, (err, body) => {});
  });

  function buildLink(tenant, token){
    const link = "https://" + process.env.LIVEDOMAIN + "/employee-application?token=" + token + "&tenantId=" + tenant;
    return link
  }

  res.redirect("/dashboard?refresh=true");
  
});

///////////////////////////////////////////Site Navigation/////////////////////////////////////////////

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/bookkeeping", function (req, res) {
  res.render("bookkeeping");
});

app.get("/tax", function (req, res) {
  res.render("tax");
});

app.get("/profit", function (req, res) {
  res.render("profit");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/dashboard", function (req, res) {
  if (req.isAuthenticated()) {
    Client.findOne({ email: req.user.username }, function (err, cust) {
      if (req.user.username == "admin@connecttbs.com") {
        Request.find(function (err, docs) {
          Client.find(function (err, cust) {
          
            Tenant.find(function (err, tenants){
              res.render("dashboard/admin", { requests: docs, customers: cust, tenants: tenants });
            })            
          });
        }).sort("status");
      } else {
        res.render("dashboard/dashboard", { customer: cust });
      }
    });
  } else {
    res.redirect("/login");
  }
});

///////////////////////////////////////////Login Portal////////////////////////////////////////////

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/login", function (req, res) {
  const error = req.query.err
  let err

  if (error){
    err = "Incorrect Username or Password"
  }
  res.render("login", {err: err});
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/login");
});

app.post("/register", function (req, res) {
  const client = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    company: req.body.company,
    email: req.body.username,
    phone: req.body.phone,
  };

  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {       
        res.redirect("/register");
      } else {
        Client.create(client, function (err, cust) {          
          passport.authenticate("local")(req, res, function () {
            res.redirect("/dashboard");
          });
        });
      }
    }
  );
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  passport.authenticate("local", { successRedirect: '/dashboard', failureRedirect: '/login', failureFlash: 'Invalid username or password.' })(req, res, function () {
        res.redirect("/login?err=authenticationfailed");
      });
});

/////////////////////////////////////////// Employee ////////////////////////////////////////////

app.post("/new-employee-request", function (req, res) {
  const request = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    jobTitle: req.body.jobTitle,
    startDate: req.body.startDate,
    classification: req.body.classification,
    employmentBasis: req.body.employmentBasis,
    rate: req.body.rate,
    company: req.body.company,
    status: "Authorise",
  };

  Request.create(request, function (err, rqt) {
    if (err) {
      res.redirect("/" + "?err=" + err);
    } else {
      res.redirect("/dashboard");
    }
  });

  const data = {
    from: "milan@connecttbs.com",
    to: process.env.LIVEEMAIL,
    subject: "New Employee Request",
    html: `
    <p style="margin-bottom: 40px;"> Hi! <br>` + request["company"] + ` just posted a new employee request. Please log in to the Connectt Portal to authorise the request.</p>
    <a href="https://localhost:3000/login" style="background-color: rgb(17,184,217); color: white; padding: 10px 80px; border-radius: 10px; text-decoration: none; margin: 40px 0; font-weight: 700;">Authorise</a>
    <br>
    <p style="margin: 40px 0;">Thank you!</p>` 
  }
  mailgun.messages().send(data, (error, body) => {});
});

app.get("/employee-application", function (req, res) {
  const token = req.query.token;
  const tenantId = req.query.tenantId;
  
  

  Token.findOne({ refresh_token: token }, function (err, tok) {
    Request.findOne({ _id: tok.request }, function (err, request) {
      Tenant.findOne({tenantId: tenantId}, function(err, tenant){
        res.render("application", {
          token: token,
          tenant: tenant,
          request: request,
        });
      })
    });
  });
});


app.post("/create-employee", function (req, res) {
  

  Token.findOne({ refresh_token: req.body.token }, function (err, token) {
    Tenant.findOne({ tenantId: req.body.tenantId }, async function (err, tenant) {
        Request.findOne({_id: token.request}, async function(err, request){
       
          const newXeroClient = new XeroClient();
          const refreshedTokenSet = await newXeroClient.refreshWithRefreshToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET, token['refresh_token']).catch((err) => {console.log(err);});
          
          await xero.setTokenSet(refreshedTokenSet)

          
          const xeroTenantId = tenant.tenantId;

          const usi = req.body.mySuper
        
          if(req.body.superFund == "own"){
            const superFund = [ { "uSI": usi, "type":"REGULATED"} ]
            await xero.payrollAUApi.createSuperfund(xeroTenantId, superFund).catch( err => {console.log(err)})
           } 

           const XeroSuperFunds = await xero.payrollAUApi.getSuperfunds(tenant.tenantId).catch((err) => {console.log(err);});
          
           const superFunds = XeroSuperFunds['response']['body']['SuperFunds']

           let bankAccounts;
           let superFund;
           let employee;

           if(req.body.superFund == "own"){
            superFunds.forEach( fund => {
              fund['USI'] == usi ? superFund = fund : null
            })
           } else {
             superFunds.forEach( fund => {
              fund['SuperFundID'] == req.body.superFund ? superFund = fund : null
            })
           }

           let superMembership;

           
           if(req.body.secondbsb != ""){
             bankAccounts = [{
              statementText: "Salary",
              accountName: req.body.accountName,
              bSB: req.body.bsb,
              accountNumber: req.body.accountNumber,
              remainder: true,
             },
             {
              statementText: "Salary",
              accountName: req.body.secondAccountName,
              bSB: req.body.secondbsb,
              accountNumber: req.body.secondAccountNumber,
              amount: req.body.fixedAmount,
            }]
           } else {
             bankAccounts = [{
              statementText: "Salary",
              accountName: req.body.accountName,
              bSB: req.body.bsb,
              accountNumber: req.body.accountNumber,
              remainder: true,
             }]
           }
           
           if (superFund){
            employee = [
              {
                title: req.body.title,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dateOfBirth: req.body.dob,
                homeAddress: {
                  addressLine1: req.body.street,
                  addressLine2: req.body.street2,
                  city: req.body.city,
                  region: req.body.state,
                  postalCode: req.body.postcode,
                  country: "AUSTRALIA",
                },
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                status: "ACTIVE",
                jobTitle: request['jobTitle'],
                classification: request['classification'],
                startDate: request['startDate'],
                taxDeclaration: {
                      employmentBasis: request['employmentBasis'],
                      tFNExemptionType: req.body.noTfn,
                      taxFileNumber: req.body.tfn,
                      residencyStatus: req.body.residency,
                      taxFreeThresholdClaimed: req.body.taxFree,
                      hasHELPDebt: req.body.help,
                      hasSFSSDebt: req.body.supplement,
                    },
                    bankAccounts: [...bankAccounts],
                    superMemberships: [{
                      superFundID: superFund['SuperFundID'],
                      employeeNumber: req.body.employeeNumber
                   }],
              },
            ];
          } else {
           employee = [
              {
                title: req.body.title,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                dateOfBirth: req.body.dob,
                homeAddress: {
                  addressLine1: req.body.street,
                  addressLine2: req.body.street2,
                  city: req.body.city,
                  region: req.body.state,
                  postalCode: req.body.postcode,
                  country: "AUSTRALIA",
                },
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                status: "ACTIVE",
                jobTitle: request['jobTitle'],
                classification: request['classification'],
                startDate: request['startDate'],
                taxDeclaration: {
                      employmentBasis: request['employmentBasis'],
                      tFNExemptionType: req.body.noTfn,
                      taxFileNumber: req.body.tfn,
                      residencyStatus: req.body.residency,
                      taxFreeThresholdClaimed: req.body.taxFree,
                      hasHELPDebt: req.body.help,
                      hasSFSSDebt: req.body.supplement,
                    },
                    bankAccounts: [...bankAccounts],
                    
              },
            ];
          }

            

        const response = await xero.payrollAUApi.createEmployee(xeroTenantId, employee).catch((error) => {res.send(error);});
        
          if(response){
            if(response['response']['statusCode'] == 200){
              request['status'] = "Success"
              await request.save()
            } else {
              request['status'] = "Failed"
              await request.save()
            }
          } else {
              request['status'] = "Failed"
              await request.save()
          }
        

        Request.find({'tenant': tenant.tenantId, 'status': 'Pending'}, function(err, docs){
          if (docs.length < 1 || !docs){
             xero.disconnect(tenant.id)
             Tenant.deleteOne({'tenantId': tenant.tenantId}, function(err){})
           } 
        })      
        
        res.send(response)

      }
    );
  })    
  });
});



/////////////////////////////////////////// Client ////////////////////////////////////////////

app.post('/update-client', function(req,res){
  
  const clientID = req.body.clientID
  const client = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    company: req.body.company,
    email: req.body.username,
    phone: req.body.phone,
  };

  Client.findOne({_id: clientID}, function(err, cust){
    cust.overwrite(client)
    cust.save();
    res.redirect('/dashboard');
  })
})




///////////////////////////////////////////Contact Form Post/////////////////////////////////////////////

app.post("/send", function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const message = req.body.message;

  const data = {
    from: "milan@connecttbs.com",
    to: "admin@connecttbs.com",
    subject: "New Form Submission",
    text:
      `
    Hi!
    
    Please contact ` +
      name +
      ` at ` +
      email +
      `. Here is their message: 
    ` +
      message,
  };

  mailgun.messages().send(data, (error, body) => {});
  alert("Message Sent!");
  res.redirect("/");
});

///////////////////////////////////////////Listener/////////////////////////////////////////////

app.use(function (req, res, next) {
  res.status(404).render("404");
});

var server = https.createServer(options, app);

server.listen(port, () => {
  console.log("Listening on port: " + port);
});

// app.listen(port, function(){
//     console.log('Listening on ' + port)
// })
