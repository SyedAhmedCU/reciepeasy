//import all the modules
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const fetch = require('node-fetch');

//setup mongodb
const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/RecipEasy', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// define model for admin user for DB
const Admin = mongoose.model("Admin", {
    aName : String,
    aPass : String 
});

//define Recipe model for DB
const Recipe = mongoose.model("Recipe",{
    rName : String,
    rEmail : String,
    rDescription : String,
    rRecipeName : String,
    rPhotoName : String
});

//set up express validator
const{check, validationResult} = require("express-validator");
const { exec } = require('child_process');
const { StringDecoder } = require("string_decoder");
const { request } = require("http");
const { json } = require("express");

//set up the app
var myApp = express();

//set up variable to use package express-session
myApp.use(session({
    secret: "8p0r2o0gs2y0e2d2",
    resave: false,
    saveUninitialized: true
}));

//set up body parser
myApp.use(express.urlencoded({extended:false}));
myApp.use(fileUpload());

//define/set the path to public and views folder
myApp.set("view engine", "ejs");
myApp.set("views", path.join(__dirname, "views"));  // set a value for express
myApp.use(express.static(__dirname+ "/public")); // set up a middleware to server static file

// define the route for index page "/"
myApp.get('/', function(req, res){
    global.adminLog = req.session.loggedIn;
    res.render("search");
})

// define the route for login page
myApp.get('/login', function(req, res){
    global.adminLog = req.session.loggedIn;
    res.render("login");
})

//handle post for the login form
myApp.post("/login", function(req,res){
    //fetch sname and spass
    var aName = req.body.aName;
    var aPass = req.body.aPass;
    //find it in the database
    Admin.findOne({aName: aName, aPass: aPass}).exec(function(err, admin){
        //set up the session variables for logged in user
        if(admin){
            req.session.aName = admin.aName;
            req.session.loggedIn =  true;
            //redirect to dashboard
            res.redirect("dashboard");
        }else{
            res.render("login", {errors: "errors"});
        }
        global.adminLog = req.session.loggedIn;
    })
});
// clear session for log out
myApp.get("/logout", function(req,res){
    //reset the variables for login
    req.session.aName = "";
    req.session.loggedIn = false;
    global.adminLog = req.session.loggedIn;
    res.redirect("/login");
})

// set route for search page
myApp.get('/search', async function(req, res){
    res.render("search");
})

// handle search and get response from api
//https://forkify-api.herokuapp.com/v2 try this later
myApp.get("/search-results", async function(req,res){
    const APP_ID = "085fc283";
    const APP_KEYS = "12ca3ea10581e8ef20be4652a56e4b57"; 
    var search_keywords = req.query.search_keywords.trim();
    var cuisineSelected = req.query.cuisineType;
    var mealSelected = req.query.mealType;
    if(typeof(req.query.healthLabel) == "string" ){
        var healthSelected = [req.query.healthLabel];
    }else{
        var healthSelected = req.query.healthLabel;
    }
    
    console.log(healthSelected);
    const RESULTS_NO = 32;
    var fetchString = `https://api.edamam.com/search?app_id=${APP_ID}&app_key=${APP_KEYS}&q=${search_keywords}&from=0&to=${RESULTS_NO}`;

    if (typeof(cuisineSelected) != "undefined" && cuisineSelected != ""){
        fetchString += `&cuisineType=${cuisineSelected}`;
    }
    if (typeof(mealSelected) != "undefined" && mealSelected != ""){
        fetchString += `&mealType=${mealSelected}`;
    }
    if (typeof(healthSelected) != "undefined" && healthSelected[0] != ""){
        healthSelected.forEach(element => {
            fetchString += `&health=${element}`;
        });
    }
    console.log(fetchString);
    const response = await fetch(fetchString);
    const jsonRes = await response.json();
    jsonRes["cuisineSelected"] = cuisineSelected;
    jsonRes["mealSelected"] = mealSelected;
    jsonRes["healthSelected"] = healthSelected;
    console.log(jsonRes);
    //console.log(jsonRes.hits);
    //print json object to explore
    //var jsonPretty = JSON.stringify(jsonRes.hits[0],null,2);
    //console.log(jsonPretty);
    res.render("search-result", jsonRes);
})

// dashboard
myApp.get("/dashboard" , async function(req, res){
    if (req.session.loggedIn){
        Recipe.find({}).exec(function(err, recipes){
            res.render('dashboard', {recipes : recipes});
        });
    }else{
        res.redirect("/login");
    }
});

// define the route for the recipe page
myApp.get("/add-recipe", function(req, res){
    if(req.session.loggedIn){
        res.render("add-recipe");
    } else{
        res.redirect("/login");
    }
});

// //define route for show recipe page
myApp.get("/show-recipe", function(req, res){
    if(req.session.loggedIn){
        res.render("show-recipe");
    } else{
        res.redirect("/login");
    }
    
});

//show only one recipe
myApp.get("/print/:checkid", function(req,res){
    
    if (req.session.loggedIn){
        var checkID = req.params.checkid;
        //check with the id if it exists in the collection recipes 
        Recipe.countDocuments({_id: checkID}, function (err, count){
            if (count > 0){
                //fetch data using recipe id from Recipe Collection
                Recipe.findOne({_id: checkID}).exec(function(err, recipe){
                    res.render("show-recipe", recipe);
                });
            }
        });
    }
    else{
         res.redirect("/login");
    }
});

// to delete a card from database
myApp.get("/delete-recipe/:recipeid", function(req,res){
    if (req.session.loggedIn){
        var recipeID = req.params.recipeid;
        Recipe.findByIdAndDelete({_id: recipeID}).exec(function(err, recipe){
            res.render("delete-recipe", recipe);
        });
    }
    else{
        res.redirect("/login");
    }
});

//edit an recipe
myApp.get("/edit-recipe/:recipeid", function(req,res){
    if (req.session.loggedIn){
        var recipeID = req.params.recipeid;
        Recipe.findByIdAndUpdate({_id: recipeID}).exec(function(err, recipe){
            res.render("edit-recipe", recipe);
        });
    }
    else{
        res.redirect("/login");
    }
});
// handle post from edit-recipe
myApp.post("/process-edit/:recipeid", function(req,res){
    if(!req.session.loggedIn){
        res.redirect("/login");
    } else{
        var recipeID = req.params.recipeid;
        var rName = req.body.rName;
        var rEmail = req.body.rEmail;
        var rRecipeName = req.body.rRecipeName;
        var rDescription = req.body.rDescription;
        var rPhotoName = "";
        if (req.files != null){
            rPhotoName = req.files.rPhoto.name;
            var rPhotoFile = req.files.rPhoto;
            var rPhotoPath = "public/uploads/"+rPhotoName;
            rPhotoFile.mv(rPhotoPath, function(err){
                console.log(err);
            });
        }else if (req.body.rOldPhotoName != null) {
            rPhotoName = req.body.rOldPhotoName;
        }

        Recipe.findOne({_id: recipeID}).exec(function(err,recipe){
            recipe.rName = rName;
            recipe.rEmail = rEmail;
            recipe.rDescription = rDescription;
            recipe.rRecipeName = rRecipeName;
            recipe.rPhotoName = rPhotoName;
            recipe.save();
            res.render("edit-recipe", {recipe});
        });
    }
});

//handle post from recipe form
myApp.post("/add-recipe",[
    check("rName").notEmpty().withMessage("Name is required")
    .matches(/^$|([a-zA-Z0-9]\s*)+$/).withMessage("Invalid name charecter"),
    check("rEmail", "Email is required").isEmail(),
    check("rRecipeName", "Please write a name for your recipe").notEmpty(),
    check("rDescription", "Please describe your recipe").notEmpty()
], function(req,res){
    const rErrors = validationResult(req);
    const rErrorsMap = validationResult(req).mapped();
    if(!rErrors.isEmpty()){
        res.render("recipe", {
            rErrors: rErrors.array(),
            rErrorsMap: rErrorsMap,
            keepReqFormData: req.body
        });
    } else{
        var rName = req.body.rName;
        var rEmail = req.body.rEmail;
        var rRecipeName = req.body.rRecipeName;
        var rDescription = req.body.rDescription;

        var rPhotoName = "";
        
        if (req.files != null){
            rPhotoName = req.files.rPhoto.name;
            var rPhotoFile = req.files.rPhoto;
            var rPhotoPath = "public/uploads/"+rPhotoName;
            
            rPhotoFile.mv(rPhotoPath, function(err){
                console.log(err);
            });
        }

        var reqFormData = {
            rName           : rName,
            rEmail          : rEmail,
            rDescription    : rDescription,
            rRecipeName     : rRecipeName,
            rPhotoName      : rPhotoName
        };
        //create an object from the DB model to save to DB
        var userRecipe = new Recipe(reqFormData);
        userRecipe.save();
        //send the data to the view and render it 
        res.render("add-recipe", reqFormData);
    }
});

// setup username password for first time
myApp.get("/setup", function(req,res){
    let adminData = [
        {
            aName: "admin",
            aPass: "admin" 
        }
    ]
    Admin.collection.insertMany(adminData);
    res.send("Admin login credentials added");
});

//start the server (listen at a port)
myApp.listen(8080);
console.log("Everything executed, open http://localhost:8080/ in the browser.");