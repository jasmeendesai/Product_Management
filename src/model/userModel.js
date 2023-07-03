const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fname: {
        type : String, 
        required : true
    },
    lname: {
        type : String, 
        required : true
    },
    email: {
        type : String, 
        required : true,
        trim : true,
        unique : true,
        validate: {
            validator: function(value) {
                // Regular expression to validate email format
                return  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value); 
            },
            message: 'Invalid email format'
      }
    },
    profileImage: {
        type : String, 
        required : true
    }, // s3 link
    phone: {
        type : String, 
        trim : true,
        required : true, 
        unique : true,
        minLength: 9,
        maxLength: 10
    }, 
    password: { 
        type : String, 
        required : true,
        trim : true,
        // minLength: 8,
        // maxLength: 15
    }, // encrypted password
    address: {
      shipping: {
        street: {
            type : String, 
            required : true
        },
        city: {
            type : String, 
            required : true
        },
        pincode: {
            type : String, 
            required : true
        }
      },
      billing: {
        street: {
            type : String, 
            required : true
        },
        city: {
            type : String, 
            required : true
        },
        pincode: {
            type : String, 
            required : true
        }
      }
    }

},{timestamps : true})

module.exports = mongoose.model('user',userSchema)

