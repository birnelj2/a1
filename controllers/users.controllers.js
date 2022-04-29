const User = require('../models/user');
const passport = require('passport');
const LocalStrategy=require('passport-local').Strategy;
const { body, validationResult } = require('express-validator');
var db = require('./db')
const crypto=require('crypto');
const bodyParser = require('body-parser');

const customFields={
    usernameField:'email',
    passwordField:'password',
    
};
//emailField:'email'
//TODO Add an ID to the DB to use in passport 
/*Passport JS*/
const verifyCallback=(username,password,done)=>{
    console.log("CALLBACK");
   
    db.query('SELECT * FROM users WHERE email = ? ', [username], function(error, results, fields) {
       if (error) {
           console.log('error');
           return done(error);
       }
           

       if(results.length==0)
       {
           console.log('length 0')
           return done(null,false);
       }
       const isValid=validPassword(password,results[0].hash,results[0].salt);
       user={id:results[0].id,username:results[0].username,hash:results[0].hash,salt:results[0].salt};
       if(isValid)
       {
           console.log('valid')
           return done(null,user);
       }
       else{

            console.log('invalid')
           return done(null,false);
       }
   });
}

const strategy=new LocalStrategy(customFields,verifyCallback);
passport.use(strategy);


passport.serializeUser((user,done)=>{
    console.log("inside serialize");
    done(null,user.id)
});

passport.deserializeUser(function(userId,done){
    console.log('deserializeUser'+ userId);
    db.query('SELECT * FROM users where id = ?',[userId], function(error, results) {
            done(null, results[0]);    
    });
});



/*middleware*/
function validPassword(password,hash,salt)
{
    var hashVerify=crypto.pbkdf2Sync(password,salt,10000,60,'sha512').toString('hex');
    return hash === hashVerify;
}

function genPassword(password)
{
    var salt=crypto.randomBytes(32).toString('hex');
    var genhash=crypto.pbkdf2Sync(password,salt,10000,60,'sha512').toString('hex');
    return {salt:salt,hash:genhash};
}


 function isAuth(req,res,next)
{
    if(req.isAuthenticated())
    {
        console.log("auth'd")
        next();
    }
    else
    {
        res.redirect('/login');
    }
}


const userLogout = (req, res, next) => {
    console.log('logout processed');
    req.session.destroy();
    req.logout();
    res.redirect('/post/about');
};
function userExists(req,res,next)
{
    db.query('Select * from users where username=? ', [req.body.username], function(error, results, fields) {
        if (error) 
            {
                console.log("Error");
            }
       else if(results.length>0)
         {
            console.log(results.length)
            console.log(results)
            console.log("redirect")
            res.redirect('register')
        }
        else
        {
            next();
        }
       
    });
}

function emailExists(req,res,next)
{
    console.log("Email Chec!");
    db.query('Select * from users where email=? ', [req.body.email], function(error, results, fields) {
        if (error) 
            {
                console.log("Error");
            }
       else if(results.length>0)
         {
            console.log(results.length)
            console.log(results)
            console.log("redirect")
            res.redirect('register')
        }
        else
        {
            next();
        }
       
    });
}


const userRegister =((req,res,next)=>{
    console.log("Inside post");
    console.log(req.body.password);
    const saltHash=genPassword(req.body.password);
    console.log(saltHash);
    const salt=saltHash.salt;
    const hash=saltHash.hash;

    db.query('Insert into users(username,email,hash,salt) values(?,?,?,?) ', [req.body.username,req.body.email,hash,salt], function(error, results, fields) {
        if (error) 
            {
                console.log("Error");
            }
        else
        {
            console.log("Successfully Entered");
        }
       
    });

    res.redirect('/login');
});

const userAuth=(req,res,next) =>{
    passport.authenticate('local',{failureRedirect:'/user/login',successRedirect:''})(req,res,next)
}

module.exports = {
    userRegister,
    userLogout,
    userExists,
    userAuth,
    emailExists
};
