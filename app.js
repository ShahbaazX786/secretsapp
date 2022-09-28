//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


const URL = 'mongodb://127.0.0.1:27017/userDB'
mongoose.connect(URL,{useNewUrlParser:true},function(err){
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




app.listen(PORT, function(err){
    if(!err){
        console.log('server started on port '+PORT+' bro!');
    }
    else{
        console.log('There was some error while connecting to the server | port bro'+err);
    }
        
});