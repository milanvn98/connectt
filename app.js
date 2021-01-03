require('dotenv').config();
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const https = require('https')
const app = express()
const nodemailer = require('nodemailer');
const SMTPConnection = require('nodemailer/lib/smtp-connection')

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'))


//Get Request (For pages and Gets)
app.get('/', function(req, res){
    //Return a Page
    res.render('index')    
    
})

app.get('/bookkeeping', function(req, res){
  //Return a Page
  res.render('bookkeeping')    
})

app.get('/tax', function(req, res){
  //Return a Page
  res.render('tax')    
})

app.get('/profit', function(req, res){
  //Return a Page
  res.render('profit')    
})

app.get('/about', function(req, res){
  //Return a Page
  res.render('about')    
  
})

app.get('/contact', function(req, res){
  //Return a Page
  res.render('contact')    
  
})

//Post request from Form or POSTS
app.post('/send', function(req,res){


  var API_KEY = process.env.api;
  var DOMAIN = process.env.domain;
  var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});
  
  const name = req.body.name
  const email = req.body.email
  const message = req.body.message

  const data = {
    from: 'milan@vanniekerks.com',
    to: 'milan.vanniekerk@griffithuni.edu.au',
    subject: 'New Form Submission',
    text: `
    Hi!
    
    Please contact ` + name + ` at ` + email + `. Here is their message: 
    ` + message 
    
  };
  
  mailgun.messages().send(data, (error, body) => {
    console.log(body);
  });
    alert('Message Sent!')
    res.redirect('/')
})

app.use(function (req, res, next) {
  res.status(404).render('404')
})

app.listen(process.env.PORT || 3000, function(){
    console.log('Listening on 3000')
})