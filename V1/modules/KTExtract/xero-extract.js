const express = require('express')
const app = express.Router()
require('dotenv').config()
const db = require('../mongo/CRUD')
const request = require('request-promise')
const {XeroClient} = require("xero-node");



const xero = new XeroClient({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUris: ['https://localhost:3000/xero-refresh'],
    openIdClient: TokenSet,
    scopes: "openid profile email payroll.employees offline_access accounting.transactions accounting.settings payroll.payruns payroll.payslip payroll.timesheets payroll.settings".split(" "),
    state: "",
    httpTimeout: 8000,
  });

app.get('/xero-refresh-auth', (req, res) => {

  let consentUrl = await xero.buildConsentUrl().catch(err => {
    console.log(err)
  });
  res.redirect(consentUrl);

})

module.exports = app