const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



/////////////////////////////////////////// Mongo Setup /////////////////////////////////////////////////////

//mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork
mongoose.connect("mongodb+srv://admin-milan:milan6226@cluster0.julte.mongodb.net/connecttbs?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);


/////////////////////////////////////////// User /////////////////////////////////////////////////////

//Initialise
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/////////////////////////////////////////// Client /////////////////////////////////////////////////////

//Initialise
const clientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  company: String,
  email: String,
  phone: String,
});
const Client = mongoose.model("Client", clientSchema);

/////////////////////////////////////////// Requests /////////////////////////////////////////////////////

//Initialise
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
  notes: String,
  status: String,
  company: String,
  token: String,
  tenant: String,
});
const Request = mongoose.model("Request", requestSchema);

/////////////////////////////////////////// Tokens /////////////////////////////////////////////////////

//Initialise
const tokenSchema = new mongoose.Schema({
  id_token: String,
  access_token: String,
  expires_at: String,
  token_type: String,
  refresh_token: String,
  scope: String,
  session_state: String,
  request: String,
  tenant: String,
});
const Token = mongoose.model("Token", tokenSchema);


/////////////////////////////////////////// Application /////////////////////////////////////////////////////
const applicationSchema = new mongoose.Schema({
  title: String,
  firstName: String,
  lastName: String,
  dateOfBirth: String,
  homeAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    region: String,
    postalCode: String,
    country: String,
  },
  email: String,
  gender: String,
  phone: String,
  status: String,
  jobTitle: String,
  classification: String,
  startDate: String,
  taxDeclaration: {
    employmentBasis: String,
    tFNExemptionType: String,
    taxFileNumber: String,
    residencyStatus: String,
    taxFreeThresholdClaimed: String,
    hasHELPDebt: String,
    hasSFSSDebt: String,
  },
  bankAccounts: [Object],
  superMemberships: [Object],
  request: String,
});
const Application = mongoose.model("Application", applicationSchema);


/////////////////////////////////////////// Tenant /////////////////////////////////////////////////////

//Initialise
const tenantSchema = new mongoose.Schema({
  id: String,
  authEventId: String,
  tenantId: String,
  tenantType: String,
  tenantName: String,
  createdDateUtc: String,
  updatedDateUtc: String,
  superFunds: [Object],
  token: String,
  request: String,
});
const Tenant = mongoose.model("Tenant", tenantSchema);

const Exports = {
  Tenant: Tenant,
  Request: Request,
  Token: Token,
  Client: Client,
  User: User,
  Application: Application
}


module.exports = Exports