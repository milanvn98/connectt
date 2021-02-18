const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const express = require('express')



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

  //Register
   function registerUser(usn, password, callback){
    User.register({username: usn}, password, function(err, user){
      if(err){
        console.log(err)
      } else {
        callback(user)
      }
    })
  }


  //Create
   function createUser(user){
    User.create(user, function(err, usr){
      err && console.log(err)
    })
  }

  //Find
   function findUser(obj, callback){
    User.find(obj, function(err, usr){
      err ? console.log(err) : callback(usr[0])
    })
  }

   function findAllUsers(callback){
    User.find(function(err, users){
      err ? console.log(err) : callback(users)
    })
  }


  //Update
   function updateUser(obj,properties){
    for (const [k, v] of Object.entries(properties)){
      User.updateOne(obj, properties, function(err, tent){
        err && console.log(err)
      })
    }
  }

  //Delete
   function deleteUser(obj){
    User.deleteOne(obj)
  }

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

//Create
 function createClient(client){
  Client.create(client, function(err, cli){
    err && console.log(err)
  })
}

//Find
 function findClient(obj, callback){
  Client.find(obj, function(err, cli){
    err ? console.log(err) : callback(cli[0])
  })
}

 function findAllClients(callback){
  Client.find(function(err, clients){
    err ? console.log(err) : callback(clients)
  })
}


//Update
 function updateClient(obj, properties){
  Client.updateOne(obj, properties, function(err, tent){
    err && console.log(err)
  })
}

//Delete
 function deleteClient(obj){
  Client.deleteOne(obj)
}
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
    status: String,
    company: String,
    token: String,
    tenant: String,
  });
  const Request = mongoose.model("Request", requestSchema);

 //Create
 function createRequest(request){
  Request.create(request, function(err, req){
    err && console.log(err)
  })
}

//Find
 function findRequest(obj, callback){
  Request.find(obj, function(err, req){
    err ? console.log(err) : callback(req[0])
  })
}

 function findAllRequests(callback){
  Request.find(function(err, requests){
    err ? console.log(err) : callback(requests)
  })
}

function findManyRequests(obj, callback){
  Request.find(obj, function (err, requests){
    err ? console.log(err) : callback(requests)
  })
}


//Update
 function updateRequest(obj, properties){
  Request.updateOne(obj, properties, function(err, tent){
    err && console.log(err)
  })
}

//Delete
 function deleteRequest(obj){
  Request.deleteOne(obj)
}

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


 //Create
  function createToken(token){
  Token.create(token, function(err, tok){
    err && console.log(err)
  })
}

//Find
 function findToken(obj, callback){
  Token.find(obj, function(err, token){
    err ? console.log(err) : callback(token[0])
  })
}

 function findAllTokens(callback){
  Token.find(function(err, tokens){
    err ? console.log(err) : callback(tokens)
  })
}


//Update
 function updateToken(obj, properties){
  Token.updateOne(obj, properties, function(err, tent){
    err && console.log(err)
  })
}

//Delete
 function deleteToken(obj){
  Token.deleteOne(obj)
}


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

  //Create
   function createTenant(tenant){
    Tenant.create(tenant, function(err, tent){
      err ? console.log(err) : console.log(tent)
    })
  }
  
  //Find
   function findTenant(obj, callback){
    Tenant.find(obj, function(err, tenant){
      err ? console.log(err) : callback(tenant[0])
    })
  }
  
   function findAllTenants(callback){
    Tenant.find(function(err, tenants){
      err ? console.log(err) : callback(tenants)
    })
  }
  
  
  //Update
   function updateTenant(obj, properties){
    Tenant.updateOne(obj, properties, function(err, tent){
      err && console.log(err)
    })
  }
  
  //Delete
   function deleteTenant(obj){
    Tenant.deleteOne(obj, function(err, tenant){
    })
  }

  /////////////////////////////////////////////// /KTExtract Data save /////////////////////////////////////////////// 
  const dateSchema = new mongoose.Schema({
   date: String
  });
  const savedDate = mongoose.model("Date", dateSchema);

  function saveDate(newDate){

    savedDate.updateOne({'_id': "6022b5cb8618df555ba1981c"}, {'date': newDate},{ runValidators: true }, function(err, date){
    })
  }

  async function retrieveDate(){
    
    let startDate
    await savedDate.find({'_id': "6022b5cb8618df555ba1981c"}, function(err, date){
      startDate = date[0]['date']
      
    })


    if (startDate){
      return startDate
    } else {
      setTimeout(function(){
        return startDate
      }, 2000)
    }
    
  }

const Exports = {User: User, registerUser: registerUser, createUser: createUser, findUser: findUser, findAllUsers: findAllUsers, updateUser: updateUser, deleteUser: deleteUser,
                createClient: createClient, findClient: findClient, findAllClients: findAllClients, updateClient: updateClient, deleteClient: deleteClient,
                createRequest: createRequest, findRequest: findRequest, findAllRequests: findAllRequests, findManyRequests: findManyRequests, updateRequest: updateRequest, deleteRequest: deleteRequest,
                createToken: createToken, findToken: findToken, findAllTokens: findAllTokens, updateToken: updateToken, deleteToken: deleteToken,
                createTenant: createTenant, findTenant: findTenant, findAllTenants: findAllTenants, updateTenant: updateTenant, deleteTenant: deleteTenant,
                saveDate: saveDate, retrieveDate: retrieveDate}


  module.exports =  Exports