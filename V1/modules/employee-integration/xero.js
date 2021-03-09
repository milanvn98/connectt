const express = require('express')
const app = express.Router()
const db = require('../mongo/CRUD')
const {
  XeroClient
} = require("xero-node");
const {
  TokenSet
} = require("openid-client");
const mailgun = require("mailgun-js")({
  apiKey: process.env.API,
  domain: process.env.DOMAIN,
});
const _ = require('underscore')

app.use(require('../web/navigation'))



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
  xero.config.state = await "reqID=" + reqID + "&tenantID=" + tenantID;


  let consentUrl = await xero.buildConsentUrl().catch(err => {
    console.log(err)
  });
  res.redirect(consentUrl);
});


//Callback
app.get("/xero-callback", async function (req, res) {


  //Get Req Params
  const state = await xero.config.state
  const requestID = await state.split('&')[0].split('=')[1];
  let tenantID = await state.split('&')[1].split('=')[1];

  //Get TokenSet
  const token = await xero.apiCallback(req.url).catch((err) => {
    console.log(err);
  });
  console.log(token)


  //Get Tenants
  const xeroTenants = await xero.updateTenants(false).catch((err) => {
    console.log(err);
  });
  const tenants = xeroTenants.sort((a, b) => (a.createdDateUtc > b.createdDateUtc) ? -1 : 1);

  //Check if Tenenat Exists, if not create
  let tenant = tenants.find(tenant => (tenant.tenantId == tenantID))

  if (!tenant) {
    tenant = await tenants[0]
    db.createTenant(tenant)
  }

  //Get Super
  await xero.setTokenSet(token)
  const response = await xero.payrollAUApi.getSuperfunds(tenant['tenantId']).catch((err) => {
    console.log(err);
  });

  //Add Super to Tenant
  db.updateTenant({
    'tenantId': tenant['tenantId']
  }, {
    'superFunds': response['response']['body']['SuperFunds'],
    'request': requestID,
    'token': token['refresh_token']
  })


  //Create Token
  token['request'] = requestID
  token['tenant'] = tenant['tenantId']
  db.createToken(token)


  //Find Request
  db.findRequest({
    '_id': requestID
  }, request => {

    //Update Request
    db.updateRequest({
      '_id': requestID
    }, {
      'token': token['refresh_token'],
      'tenant': tenant['tenantId'],
      'status': "Pending"
    })


    // Message
    const data = {
      from: "admin@connecttbs.com",
      to: request['email'],
      subject: "RE Position at " + request.company,
      html: `
            <p style="margin-bottom: 20px;"> Hi! <br> Welcome to ` + request["company"] + `. Please click the link below to complete your application:</p>
            <a href="` + buildLink(tenant['tenantId'], token['refresh_token']) + `" style="background-color: rgb(17,184,217); color: white; padding: 10px 80px; border-radius: 10px; text-decoration: none; margin: 60px 0; font-weight: 700;">Complete</a>
            <br>
            <p style="margin: 60px 0;">Thank you! <br> Kind Regards, <br> Connectt Total Business Solutions</p>`
    };

    //Send
    mailgun.messages().send(data, (err, body) => {
      console.log(err)
    });
  });

  function buildLink(tenant, token) {
    const link = "https://" + process.env.LIVEDOMAIN + "/employee-application?token=" + token + "&tenantId=" + tenant;
    return link
  }

  res.redirect("/dashboard?refresh=true");
})


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
    notes: req.body.notes,
    company: req.body.company,
    status: "Authorise",
  };


  db.createRequest(request)
  res.redirect("/dashboard?refresh=true");



  const data = {
    from: "milan@connecttbs.com",
    to: process.env.LIVEEMAIL,
    subject: "New Employee Request",
    html: `
      <p style="margin-bottom: 40px;"> Hi! <br>` + request["company"] + ` just posted a new employee request. Please log in to the Connectt Portal to authorise the request.</p>
      <a href="https://www.connecttbs.com/login" style="background-color: rgb(17,184,217); color: white; padding: 10px 80px; border-radius: 10px; text-decoration: none; margin: 40px 0; font-weight: 700;">Authorise</a>
      <br>
      <p style="margin: 40px 0;">Thank you!</p>`
  }

  mailgun.messages().send(data, (error, body) => {});
});

app.get("/employee-application", function (req, res) {
  const tok = req.query.token;
  const tenantId = req.query.tenantId;

  db.findToken({
    'refresh_token': tok
  }, token => {
    db.findRequest({
      '_id': token['request']
    }, request => {
      db.findTenant({
        'tenantId': tenantId
      }, tenant => {
        res.render("application", {
          token: token['refresh_token'],
          request: request,
          tenant: tenant
        })
      })
    })
  })
});


app.post("/create-employee", function (req, res) {

  db.findToken({
    'refresh_token': req.body.token
  }, async token => {
    db.findTenant({
      'tenantId': req.body.tenantId
    }, async tenant => {
      db.findRequest({
        '_id': token['request']
      }, async request => {

        //Refresh Token
        const newXeroClient = new XeroClient();
        const refreshedTokenSet = await newXeroClient.refreshWithRefreshToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET, token['refresh_token']).catch((err) => {
          console.log(err);
        });


        //Set Refreshed Token
        await xero.setTokenSet(refreshedTokenSet);


        //If Own SuperFund Selected, create new Superfund
        const usi = req.body.mySuper;
        req.body.superFund == "own" && await xero.payrollAUApi.createSuperfund(tenant.tenantId, {
          "uSI": usi,
          "type": "REGULATED"
        }).catch(err => {
          console.log(err)
        });

        //Get All Superfunds
        const XeroSuperFunds = await xero.payrollAUApi.getSuperfunds(tenant.tenantId).catch((err) => {
          console.log(err);
        });
        const superFunds = XeroSuperFunds['response']['body']['SuperFunds'];


        //Set Super Fund
        let superFund;
        if (req.body.superFund == "own") {
          superFunds.forEach(fund => {
            fund['USI'] == usi ? superFund = fund : null
          })
        } else {
          superFunds.forEach(fund => {
            fund['SuperFundID'] == req.body.superFund ? superFund = fund : null
          })
        }

        //Set Bank Accounts
        let bankAccounts = [{
          statementText: "Salary",
          accountName: req.body.accountName,
          bSB: req.body.bsb,
          accountNumber: req.body.accountNumber,
          remainder: true,
        }]

        if (req.body.secondbsb != "") {
          bankAccounts[0]['remainder'] = false
          bankAccounts.push({
            statementText: "Salary",
            accountName: req.body.secondAccountName,
            bSB: req.body.secondbsb,
            accountNumber: req.body.secondAccountNumber,
            amount: req.body.fixedAmount,
          })
        }

        //Set Employee
        let employee = [{
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
          bankAccounts: [...bankAccounts]
        }]

        if (superFund) {
          employee[0]['superMemberships'] = [{
            superFundID: superFund['SuperFundID'],
            employeeNumber: req.body.employeeNumber
          }]
        }


        //Create Employee
        const response = await xero.payrollAUApi.createEmployee(tenant.tenantId, employee).catch((error) => {
          res.send(error);
        });


        //Check Response Status and Change Request Status
        if (response) {
          if (response['response']['statusCode'] == 200) {
            request['status'] = "Success"
            request.save()
          } else {
            request['status'] = "Failed"
            request.save()
          }
        } else {
          request['status'] = "Failed"
          request.save()
        }

        function disconnectTenant() {
          db.findRequest({
            'tenant': tenant.tenantId
          }, reqs => {

            if (reqs['status'] != "Pending") {
              //Disconnect Xero Tenant
              db.findManyRequests({
                'tenant': tenant.tenantId,
                'status': 'Pending'
              }, requests => {
                if (requests.length < 1 || !requests) {
                  xero.disconnect(tenant['id'])
                  db.deleteTenant({
                    'tenantId': tenant.tenantId
                  })
                }
              })
            } else {
              setTimeout(function () {
                disconnectTenant()
              }, 3000)
            }
          })
        }

        disconnectTenant()

        // Message
        const data = {
          from: "milan@connecttbs.com",
          to: 'admin@connecttbs.com',
          subject: "Successful application for " + request['company'],
          html: `
            <p style="margin-bottom: 20px;"> Hi! <br> 
            <p>` + request['firstName'] + ` has just successfully completed their application at ` + request['company'] + `</p>
            <p style="margin: 60px 0;">Thank you! <br> Kind Regards, <br> Connectt Total Business Solutions</p>`
        };

        //Send
        mailgun.messages().send(data, (err, body) => {
          console.log(err)
        });

      })




      //Redirect to Connectt Website
      res.redirect('/')


    })
  })
});

app.get("/find-employee", (req, res) => {

  const request_id = req.query.request_id

  db.findRequest({
    _id: request_id
  }, request => {
    request ? res.send(request) : res.send({
      status_code: 500
    })
  })

});

app.post("/edit-employee-request", (req, res) => {

  const request = {
    _id: req.body._id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    company: req.body.company,
    email: req.body.email,
    phone: req.body.phone,
    startDate: req.body.startDate,
    employmentBasis: req.body.employmentBasis,
    jobTitle: req.body.jobTitle,
    rate: req.body.rate,
    notes: req.body.notes,
    classification: req.body.classification,
  }


  console.log(req.body.employmentBasis)

  db.findRequest({
    _id: request['_id']
  }, rst => {
    const email = rst['email']

    const combReq = _.extend(rst, request)

    email != combReq['email'] ? combReq['status'] = "Authorise" : null
    db.updateRequest({
      _id: combReq['id']
    }, combReq)

    res.redirect('/dashboard?refresh=true')
  })

})

module.exports = app