const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const https = require('https')
const app = express()
const nodemailer = require('nodemailer');

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

    const name = req.body.name
    const email = req.body.email
    const message = req.body.message

    var transporter = nodemailer.createTransport({
        host: 'mail.smtp2go.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: '',
            pass: ''
    }
      });
      
      var mailOptions = {
        from: 'milan@vanniekerks.com',
        to: 'milan@vanniekerks.com',
        subject: 'New Contact Submission',
        text: `
        Hi!

        Please call/email ` + name + ` at ` + email + ` to discuss their business. This was their message: ` + message + `
        
        Thank you!
        Kind Regards,
        Architech Server`
        
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

    res.redirect('/')
})

app.listen(process.env.PORT || 3000, function(){
    console.log('Listening on 3000')
})