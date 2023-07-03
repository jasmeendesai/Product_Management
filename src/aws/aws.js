const aws = require('aws-sdk')
require('dotenv').config()
const {accessKeyId, secretAccessKey, region} = process.env

aws.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
})
let uploadFile = async function(file){
    // console.log(file)
    return new Promise(function(resolve, reject){
    let s3 = new aws.S3({apiVersion : "2006-03-01"})
      
    var uploadParams = {
        ACL : "public-read",
        Bucket : "classroom-training-bucket",
        Key : "abc/" + file.originalname,
        Body : file.buffer
    }
   
    s3.upload(uploadParams, function(err, data){
        if(err){
            return reject({"error" : err})
        }
        return resolve(data.Location)
    })
})
}

module.exports = {uploadFile}

