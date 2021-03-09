const express = require('express')
const app = express.Router()
const mongo = require('../mongo/CRUD')
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


app.use(
    session({
      secret: process.env.SECRET,
      resave: false,
      saveUninitialized: false,
    })
  );
  
  app.use(passport.initialize());
  app.use(passport.session());



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

    mongo.User.register(client['email'], req.body.password, (err, user) => {
      err ? console.log(err) : console.log("User created successfully.")
        if (user){
            mongo.Client.create(client, function(err){
              err ? console.log(err) : console.log("Client created successfully.")
            })
            passport.authenticate("local")(req, res, function() {res.redirect("/dashboard")});
        } else {
            err = "Failed to Sign Up User"
            res.render("login", {err: err})
        }
    })
  });
  
  app.post("/login", function (req, res) {
 
    passport.authenticate("local", { successRedirect: '/dashboard', failureRedirect: '/', failureFlash: 'Invalid username or password.' })(req, res, function () {
        res.redirect("/login?err=authenticationfailed");
        });
  });

  module.exports = app;