//import all the modules
const express = require("express");
const path = require("path");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

//Edamam Api
const APP_ID = "085fc283";
const APP_KEYS = "12ca3ea10581e8ef20be4652a56e4b57"; 

//setup mongodb
const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/RecipEasy', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

//define Recipe model for DB
const Recipe = mongoose.model("Recipe",{
    rDescription : String,
    rRecipeName : String,
    rPhotoName : String,
    rUserName : String
});
const User = mongoose.model("User", {
    aFirst : {type: String, required: [true, "First name is requried"]},
    aLast : {type: String, required: [true, "Last name is required"]},
    aEmail : {type: String, unique: [true, "Already taken"], required: [true, "Email is requierd"]},
    aUserName: {type: String, unique: [true, "Already taken"], required: [true, "Username is required"]},
    aPass : {type: String, required: [true, "Password is required"]}
});
const FavouriteApiRecipe = mongoose.model("FavouriteApiRecipe", {
    nameURI : {type: String, unique: [true, "Already Exists"]},
    aUserName: {type: String, required: [true, "Username is required"]},
    image : String,
    label : String,
    source: String,
    uri : {type: String, required: [true, "Uri is required"]},
    url : String,
    cuisineType : [String],
    mealType: [String],
    dietLabels : [String],
    ingredientLines: [String],
    mongoRecipeId: [String]
});

//set up express validator
const{check, validationResult} = require("express-validator");
const { exec } = require('child_process');
const { StringDecoder } = require("string_decoder");
const { request } = require("http");
const { json } = require("express");
const { stringify } = require("querystring");

//set up the app
var myApp = express();

//set up variable to use package express-session
myApp.use(session({
    secret: "8p0r2o0gs2y0e2d2",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: true
}));
myApp.use(cookieParser('NotSoSecret'));
myApp.use(flash());

myApp.use(function(req, res, next) {
    res.locals.user = req.session.aUserName;
    next();
});

//set up body parser
myApp.use(express.urlencoded({extended:false}));
myApp.use(fileUpload());

//define/set the path to public and views folder
myApp.set("view engine", "ejs");
myApp.set("views", path.join(__dirname, "views"));  // set a value for express
myApp.use(express.static(__dirname+ "/public")); // set up a middleware to server static file

// define the route for landing page "/"
myApp.get('/', function(req, res){
    res.render("search");
})

// define the route for about us page
myApp.get('/about-us', function(req, res){
    res.render("about-us");
})

// define the route for login page
myApp.get('/login', function(req, res){
    res.render("login");
})

// define the route for register page
myApp.get('/register', function(req, res){
    res.render("register");
})

//handle post for the register form
myApp.post("/register", function(req,res){
    var newUser = new User();
    newUser.aUserName = req.body.aUserName;
    newUser.aPass = req.body.aPass;
    newUser.aEmail = req.body.aEmail;
    newUser.aFirst = req.body.aFirst;
    newUser.aLast = req.body.aLast;

    newUser.save(function(err){
        if(err){
            //console.log(err);
            return res.render("register", {newUser : newUser, err : err});
        }
        res.render("login", {message: "Account Created Successfully"});
    });
});


//handle post for the login form
myApp.post("/login",async function(req,res){
    //fetch sname and spass
    var aUserName = req.body.aUserName;
    var aPass = req.body.aPass;
    //find it in the database
    User.findOne({aUserName: aUserName, aPass: aPass}).exec(function(err, user){
        //set up the session variables for logged in user
        if(err || !user){
            res.render("login", {errors: "errors"});
        }else{
            req.session.aUserName = user.aUserName;
            req.session.loggedIn =  true;
            global.userLog = req.session.loggedIn;
            //redirect to dashboard
            res.redirect("dashboard");
        }
    })
});
// clear session for log out
myApp.get("/logout", function(req,res){
    //reset the variables for login
    req.session.aUserName = "";
    req.session.loggedIn = false;
    global.userLog = req.session.loggedIn;
    res.redirect("/login");
});

// set route for search page
myApp.get('/search', async function(req, res){
    res.render("search");
});

// handle search and get response from api
//https://forkify-api.herokuapp.com/v2 try this later
myApp.get("/search-results", async function(req,res){
    // // const APP_ID = "085fc283";
    // // const APP_KEYS = "12ca3ea10581e8ef20be4652a56e4b57"; 
    var search_keywords = req.query.search_keywords.trim();
    var cuisineSelected = req.query.cuisineType;
    var mealSelected = req.query.mealType;
    var dietSelected = req.query.dietLabel;
    if(typeof(req.query.healthLabel) == "string" ){
        var healthSelected = [req.query.healthLabel];
    }else{
        var healthSelected = req.query.healthLabel;
    }
    const RESULTS_NO = 32;
    var fetchString = `https://api.edamam.com/search?app_id=${APP_ID}&app_key=${APP_KEYS}&q=${search_keywords}&from=0&to=${RESULTS_NO}`;

    if (typeof(cuisineSelected) != "undefined" && cuisineSelected != ""){
        fetchString += `&cuisineType=${cuisineSelected}`;
    }
    if (typeof(mealSelected) != "undefined" && mealSelected != ""){
        fetchString += `&mealType=${mealSelected}`;
    }
    if (typeof(dietSelected) != "undefined" && dietSelected != ""){
        fetchString += `&diet=${dietSelected}`;
    }
    if (typeof(healthSelected) != "undefined" && healthSelected[0] != ""){
        healthSelected.forEach(element => {
            fetchString += `&health=${element}`;
        });
    }
    const response = await fetch(fetchString);
    const jsonRes = await response.json();
    jsonRes["cuisineSelected"] = cuisineSelected;
    jsonRes["mealSelected"] = mealSelected;
    jsonRes["dietSelected"] = dietSelected;
    jsonRes["healthSelected"] = healthSelected;
    //console.log(jsonRes);
    //console.log(fetchString);
    //console.log(jsonRes.hits);
    //print json object to explore
    //var jsonPretty = JSON.stringify(jsonRes.hits[0],null,2);
    //console.log(jsonPretty);
    res.render("search-result", jsonRes);
})

//show only one edamam recipe
myApp.get("/print-recipe/:checkid", async function(req,res){
    var checkURI = req.params.checkid;
    var encodedURI = encodeURIComponent(checkURI)
    // const APP_ID = "085fc283";
    // const APP_KEYS = "12ca3ea10581e8ef20be4652a56e4b57"; 
    var fetchString = `https://api.edamam.com/search?app_id=${APP_ID}&app_key=${APP_KEYS}&r=${encodedURI}`;
    const response = await fetch(fetchString);
    const jsonRes = await response.json();
    res.render("show-edamam-recipe", jsonRes[0]);
});
// dashboard
myApp.get("/dashboard" , async function(req, res){
    if (req.session.loggedIn){
        aUserName = req.session.aUserName;
        if (aUserName == "admin"){
            Recipe.find({}).exec(function(err, recipes){
                res.render('dashboard', {recipes : recipes});
            });
        }else{
            Recipe.find({rUserName : aUserName}).exec(function(err, recipes){
                res.render('dashboard', {recipes : recipes});
            });
        }
    }else{
        res.redirect("/login");
    }
});
// recipes by user-recipe
myApp.get("/user-recipe/:username" , async function(req, res){
    if (req.session.loggedIn){
        var rUserName = req.params.username;
        Recipe.find({rUserName : rUserName}).exec(function(err, recipes){
            res.render('user-recipe', {recipes : recipes, rUserName: rUserName});
        });
    }else{
        res.redirect("/login");
    }
});
// featured recipes
myApp.get("/featured" , function(req, res){
    Recipe.find({}).exec(function(err, recipes){
        if(err){
            res.redirect("/search");
        }
        res.render('featured', {recipes : recipes});
    });
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
        Recipe.findOne({_id: checkID}).exec(function(err, recipe){
            User.findOne({aUserName : recipe.rUserName}).exec(function(err, user){
                if(err){
                    res.redirect("/login");
                }
                var showRecipe = {
                    rEmail : user.aEmail,
                    rName : user.aFirst + " " + user.aLast,
                    rDescription : recipe.rDescription,
                    rRecipeName : recipe.rRecipeName,
                    rPhotoName : recipe.rPhotoName,
                    rUserName : recipe.rUserName,
                    _id : recipe._id
                }
                res.render("show-recipe", showRecipe);
            });
        });
    }
    else{
         res.redirect("/login");
    }
});

// to delete a recipe from database
myApp.get("/delete-recipe/:recipeid", function(req,res){
    if (req.session.loggedIn){
        var recipeID = req.params.recipeid;
        var rUserName = req.session.aUserName;
        Recipe.findOne({_id: recipeID}).exec(function(err,recipe){
            if (recipe.rUserName != rUserName){
                res.redirect("/logout");
            }else{
                Recipe.findByIdAndDelete({_id: recipeID}).exec(function(err, recipe){
                    res.render("delete-recipe", recipe);
                });
            }
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
        var rUserName = req.session.aUserName;
        Recipe.findOne({_id: recipeID}).exec(function(err,recipe){
            if (recipe.rUserName != rUserName){
                res.redirect("/logout");
            }else{
                res.render("edit-recipe", recipe);
            }
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
        var rUserName = req.session.aUserName;
        var recipeID = req.params.recipeid;
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
        Recipe.findByIdAndUpdate({_id: recipeID}).exec(function(err,recipe){
            recipe.rDescription = rDescription;
            recipe.rRecipeName = rRecipeName;
            recipe.rPhotoName = rPhotoName;
            recipe.save();
            res.render("edit-recipe", {recipe});
        });
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

//handle post from recipe form
myApp.post("/add-recipe",[
    check("rRecipeName", "Please write a name for your recipe").notEmpty(),
    check("rDescription", "Please describe your recipe").notEmpty()
], function(req,res){
    const rErrors = validationResult(req);
    const rErrorsMap = validationResult(req).mapped();
    if(!rErrors.isEmpty()){
        res.render("add-recipe", {
            rErrors: rErrors.array(),
            rErrorsMap: rErrorsMap,
            keepReqFormData: req.body
        });
    } else{
        var rRecipeName = req.body.rRecipeName;
        var rDescription = req.body.rDescription;
        var rUserName = req.session.aUserName;

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
            rDescription    : rDescription,
            rRecipeName     : rRecipeName,
            rPhotoName      : rPhotoName,
            rUserName       : rUserName
        };
        //create an object from the DB model to save to DB
        var userRecipe = new Recipe(reqFormData);
        userRecipe.save();
        //send the data to the view and render it 
        res.render("add-recipe", reqFormData);
    }
});
//show only one edamam recipe
myApp.get("/favourite-recipe" , async function(req, res){
    if (req.session.loggedIn){
        aUserName = req.session.aUserName;
        const flashMessage = req.flash('flashMessage');
        FavouriteApiRecipe.find({aUserName: req.session.aUserName}, function(err, fRecipes){
            var favouriteRecipes = Object.values(fRecipes);
            res.render("favourite-recipe", {favouriteRecipes:favouriteRecipes, flashMessage : flashMessage } );
        });
    }else{
        res.redirect("/login");
    }
});
// add-favourite recipes
myApp.get("/add-favourite/:recipeURI", async function(req,res){
    if (req.session.loggedIn){
        var checkURI = req.params.recipeURI;
        var encodedURI = encodeURIComponent(checkURI);
        var fetchString = `https://api.edamam.com/search?app_id=${APP_ID}&app_key=${APP_KEYS}&r=${encodedURI}`;
        const response = await fetch(fetchString);
        const jsonRes = await response.json();
        var userFavourite = new FavouriteApiRecipe();
        userFavourite.aUserName = req.session.aUserName;
        userFavourite.mongoRecipeId = "";
        userFavourite.image = jsonRes[0].image;
        userFavourite.label = jsonRes[0].label;
        userFavourite.source = jsonRes[0].source;
        userFavourite.uri = jsonRes[0].uri;
        userFavourite.url = jsonRes[0].url;
        userFavourite.cuisineType = jsonRes[0].cuisineType;
        userFavourite.mealType = jsonRes[0].mealType;
        userFavourite.dietLabels = jsonRes[0].dietLabels;
        userFavourite.ingredientLines = jsonRes[0].ingredientLines;
        userFavourite.nameURI = req.session.aUserName + jsonRes[0].uri;

        FavouriteApiRecipe.findOne({aUserName : aUserName}).exec(function(err, exist){
            if(err){
                res.redirect("/login");
            }else{
                userFavourite.save(function(err){
                    if(err){
                        //console.log(err);
                        req.flash('flashMessage', "Already Exists in Favourite!");
                    }else{
                        req.flash('flashMessage', "Added to your Favourite");
                    }
                    res.redirect("/favourite-recipe");
                });
            }
        });
    }else{
        res.redirect("/login");
    }
    });

//start the server (listen at a port)
myApp.listen(8080);
console.log("Everything executed, open http://localhost:8080/ in the browser.");