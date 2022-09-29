//jshint esversion:6
require('dotenv').config(); // import and config once and it will run forever until the server is stopped.
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
// const encrypt = require('mongoose-encryption');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
// const md5 = require('md5');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')




const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


app.use(session({
    secret:"long sentence bro",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.URL,{useNewUrlParser:true},function(err){
    if(!err){
        console.log('Successfully connected to the database bro!!');
    }
    else{
        console.log('There seems to be a problem while connecting to the DB!'+err);
    }
});

// mongoose.set('useCreateIndex',true); //uncomment this if you get any deprecated for passsport lib in console.

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose); //useful for salting and hashing the schema and storing it into the db.
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, {secret:process.env.MYSECRET, encryptedFields:['password']});

const User = new mongoose.model('User',userSchema);

passport.use(User.createStrategy()); // this will handle authenticatoin itseems.

// this below commented section is mongoose implementation of passport methods and they are only working for local strategies but not with other strateies like outh2 google etc,
// passport.serializeUser(User.serializeUser()); // it will create cookie and adds the userinfo into the cookie.
// passport.deserializeUser(User.deserializeUser()); //it will destroy cookie and retrieves the info from cookie so that we can use the info to authenticate the user on our server.
// // serializeUser and deserializeUser are only necessary when you are working with sessions

// so using the passport's own cookie creator method(serializer) and cookie destroyer method (deseralizer)
passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/',function(req,res){
    res.render('home');
});

app.get('/auth/google', function(req,res){
    passport.authenticate('google',{scope:['profile']});
});

app.get('/auth/google/secrets', passport.authenticate('google', {failureRedirect:'/login'}), function(req,res){
    res.redirect('/secrets');
});


app.get('/login',function(req,res){ //if user is already authenticated then it is meaning less to send him again to the login page so send him to secrets page instead.
    if(req.isAuthenticated()){
        res.redirect('secrets');
    }
    else{
        res.render('login');
    }
});

app.get('/register',function(req,res){
    if(req.isAuthenticated()){
        res.redirect('secrets');
    }
    else{
        res.render('register');
    }
});

app.get('/secrets',function(req,res){ //this mehod makes sure that you are visiting secrets page only if you have already been authenticated.
    User.find({'secret':{$ne:null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        }
        else if(foundUsers){
            res.render('secrets',{usersWithSecrets:foundUsers});
        }
    });
    // if(req.isAuthenticated()){
    //     res.render('secrets');
    // }
    // else{
    //     res.redirect('/login'); // if not authenticated or session is closed/expired then login again.
    // }
});

app.get('/logout', function(req, res){
    req.logout(function(err){ // this function is now async and now it requires a callback func to report the status, else it will not work.
        if(err){
            console.log(err);
        }
    });
    res.redirect('/');
});

app.get('/submit', function(req,res){
    if(req.isAuthenticated()){
        res.render('submit');
    }
    else{
        res.redirect('/login');
    }
});

app.post('/submit', function(req,res){
    const submittessecret = req.body.secret;
    User.findById(req.body.id, function(err, foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret = submittessecret;
                foundUser.save(function(){
                    res.redirect('/secrets');
                });
            }
        }
    });
});



// app.post('/register',function(req,res){ //f bcrypt used to work i would replace this method with commented bcrypt method commented below.
//     const newUser = new User({
//         email:req.body.username,
//         password:md5(req.body.password) //hashing at registration and saving to database.
//     });
//     newUser.save(function(err){
//         if(!err){
//             res.render('secrets');
//         }
//         else{
//             console.log(err);
//         }
//     });
// });

app.post('/register',function(req,res){ 
    User.register({username:req.body.username}, req.body.password, function(err,user){ // now this is a passport method and it will create a username and password, username is not touched but password is salted and a super saiyan 3 hash is created like literally. check below comments for more info.
        if(err){
            console.log(err);
            res.redirect('/register');
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect('/secrets');
            });
        }
    });
});

// app.post('/login', function(req,res){
//     const username = req.body.username;
//     const password= md5(req.body.password); //hashing at login
//     User.findOne({email:username}, function(err,foundUser){
//         if(err){
//             console.log(err);
//         }
//         else{
//             if(password === foundUser.password){
//                 res.render('secrets');
//             }
//         }
//     });
// });
app.post('/login', function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("login")(req, res, function(){
                res.redirect('/secrets');
            });
        }
    });
});



app.listen(PORT, function(err){
    if(!err){
        console.log('server started on port '+PORT+' bro!');
    }
    else{
        console.log('There was some error while connecting to the server | port bro'+err);
    }
        
});



// i tried to use bcrypt to use salting concept but bcrypt was being sassy and not getting installed correctly in node version 18+ so i just implemented the code for practice
// i can use nvm but i will pass for now.


// app.post('/register',function(req,res){ 
//     bcrypt.hash(req.body.password, saltRounds, function(err,hash){
//         const newUser = new User({
//             email:req.body.username,
//             password:hash  //bcrypt hash is a very good replacement of md5.
//         });
//         newUser.save(function(err){
//             if(!err){
//                 res.render('secrets');
//             }
//             else{
//                 console.log(err);
//             }
//         });
//     })
// });

// app.post('/login', function(req,res){
//     const username = req.body.username;
//     const password= req.body.password; 
//     User.findOne({email:username}, function(err,foundUser){
//         if(err){
//             console.log(err);
//         }
//         else{
//             bcrypt.compare(password,foundUser.password,function(err,result){
//                 if(result === true){
//                     res.render('secrets');
//                 }
//             });
//         }
//     });
// });




// normal hash via md5 or bcrypt : 
// fac6703d5ae10450906553c59adbbaeec11a2afad08a0728d449db3df156af02
// super saiyan 3 hash using passportjs(passport local mongoose package):
// 7ee5f5103ab4e6e607112ab7207ca865499832c8ed184d457ae0bda7395d75bf7bf52bba5698a2423df6d097149b8cc5e2788eaf599c7b1a2e31f9b46ac1609ee4592638ef92fe326b68707f4b85ec5ab6c47480335bf622d42be4c0b0417785a5fa87ce42cafd7aa551b3ae756a64470a33c95f5d793ae7f00a4c607d98ca46da8d8c2913c6427bc393621ccb5c3145bb96595d8d062e6eb83f89338ee41785e318dc4c45adb7b00b32fad28d18864ab2880d1cb0b76d15894f45167135b4f1bcbe80c7d189267537bdf53323388b14503fa2a04f50dd0132ba685aa23624828946e60ad2219fcc76def5f65e407c0f792409dcb7c831cfd06febae4e1f0b81657f65d10c824c845db387736f6e84176c9fa3c034b7b4cbbc172c9c92b5ac6467c11083f4a359660608f732c8114d6c714a142a91eb28dc176d1944228fe1531b8409a205c260ce506708535e928c9b6e1f99c6bbd6e2cea30d7d145c172bcd70e4c949d7030c31b796a7efeedd97a9202cd965b76a8e8faa461192ba4424b1961c2167bc23b3a6a78ed2a7f9a5da2fa925b4d3f132ccc907f33790743f74c5ed37ae1195eeda8f6ed6d9254ad902b677252aede1c2940882f7c9333d1f33c59691e287a6e9aa86f0b5600cf23468ee2ca5c9ab7052c0226d27eec9b3790d2ea454881fdadc3a8dd6b5b669d86184a043295a4946cf42f4fd7496df0286406btoavoidemptycommit