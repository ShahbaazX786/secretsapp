//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine',ejs);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));

app.listen(PORT,(err)=>{
    if(!err){
        console.log('server started on port '+PORT+' bro!');
    }
    else{
        console.log(err);
    }
});