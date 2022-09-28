//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

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