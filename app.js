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
const md5 = require('md5');

const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


mongoose.connect(process.env.URL,{useNewUrlParser:true},function(err){
    if(!err){
        console.log('Successfully connected to the database bro!!');
    }
    else{
        console.log('There seems to be a problem while connecting to the DB!'+err);
    }
});

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

// userSchema.plugin(encrypt, {secret:process.env.MYSECRET, encryptedFields:['password']});

const User = new mongoose.model('User',userSchema);


app.get('/',function(req,res){
    res.render('home');
});

app.get('/login',function(req,res){
    res.render('login');
});
app.get('/register',function(req,res){
    res.render('register');
});

app.post('/register',function(req,res){ //f bcrypt used to work i would replace this method with commented bcrypt method commented below.
    const newUser = new User({
        email:req.body.username,
        password:md5(req.body.password) //hashing at registration and saving to database.
    });
    newUser.save(function(err){
        if(!err){
            res.render('secrets');
        }
        else{
            console.log(err);
        }
    });
});

app.post('/login', function(req,res){
    const username = req.body.username;
    const password= md5(req.body.password); //hashing at login
    User.findOne({email:username}, function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(password === foundUser.password){
                res.render('secrets');
            }
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