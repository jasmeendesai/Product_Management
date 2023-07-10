const jwt = require('jsonwebtoken');
const userModel = require('../model/userModel')
const {isValidObjectId} = require('../util/validator')

require('dotenv').config()
const {SECRET_KEY} = process.env

const Authentication = async function(req, res, next){
    try{
        let token = req.headers.authorization;
        token=token.replace("Bearer","").trim()
        if(!token){
            return res.status(401).send({status : false, message : "token is missing"})
        }
        let decodeToken = jwt.verify(token, SECRET_KEY);
        req.decodedToken = decodeToken.userId
        next()

    }
    catch(error){
        if(error.message =="Invalid token"){
            return res.status(401).send({status : false, message : "Enter valid token"})
        }
        return res.status(500).send({status : false, message : error.message})
    }
}

const Authorisation = async function(req,res,next){
    try{
        
        let userId = req.params.userId
        let userLoggedin = req.decodedToken

   
        // userId valiadtion
        if(!isValidObjectId(userId)){
            return res.status(401).send({status : false, message : "Invalid User Id"})
        }
        
       
        const userData = await userModel.findById(userId)
        const userToBeModified = userData._id.toString()
            
        if(userToBeModified!==userLoggedin){
            return res.status(403).send({status: false, message : "Unauthorised user"})
        }
      
        next()

    }
    catch(error){
        return res.status(500).send({status : false, message : error.message})
    }

}

module.exports = {Authentication,Authorisation}