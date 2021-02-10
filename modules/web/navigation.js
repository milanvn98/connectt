const express = require('express')
const app = express.Router()
const crud = require('../mongo/CRUD')
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const mailgun = require("mailgun-js")({
  apiKey: process.env.API,
  domain: process.env.DOMAIN,
});


//////////////////////////////////// Login Setup //////////////////////////////////////////////////////
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());




//////////////////////////////////// Site Navigation //////////////////////////////////////////////////////

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
    if (req.isAuthenticated()){
        if (req.user.username == "admin@connecttbs.com"){
            crud.findAllClients(clients => {
                crud.findAllRequests(requests => {
                    requests.sort((a, b) => (a.status > b.status) ? 1 : -1)
                    crud.findAllTenants(tenants => {
                        res.render('dashboard/admin', {requests: requests, customers: clients, tenants: tenants})
                    })
                })
            })
        } else {
            crud.findClient('email', req.user.username, client => {
                res.render("dashboard/dashboard", {customer: client})
            })   
        }
    } else {
        res.redirect('/login')
    }
  });

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


module.exports = app;