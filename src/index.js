const express = require('express')
const mongoose = require('mongoose')
const route = require('./route/route')

require('dotenv').config()
const multer = require('multer')
const {MONGODB_STRING, PORT} = process.env
const app = express()


app.use(express.json())
app.use(express.urlencoded({extended : true}))


mongoose.connect(MONGODB_STRING, {
    useNewUrlParser : true
}).then(()=> console.log("MongoDb is Connected"))
.catch((err) => console.log(err))


app.use(multer().any())
app.use('/',route)

app.listen(PORT, function(){
    console.log("Express is connected to port " + PORT)
})