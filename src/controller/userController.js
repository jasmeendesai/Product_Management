// ## User APIs 
// ### POST /register
// - Create a user document from request body. Request body must contain image.
// - Upload image to S3 bucket and save it's public url in user document.
// - Save password in encrypted format. (use bcrypt)
// - __Response format__
//   - _**On success**_ - Return HTTP status 201. Also return the user document. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)
// ```yaml

const bcrypt = require('bcrypt')
const userModel = require('../model/userModel')
const { uploadFile } = require('../aws/aws')
const jwt = require('jsonwebtoken')
const { hashPassWord,
    comparePassword,
    isValid,
    isValidRequestBody,
    isValidEmail,
    isValidObjectId,
    isValidMobileNum } = require('../util/validator')
require('dotenv').config()

const { SECRET_KEY } = process.env


// { 
//   fname: {string, mandatory},
//   lname: {string, mandatory},
//   email: {string, mandatory, valid email, unique},
//   profileImage: {string, mandatory}, // s3 link
//   phone: {string, mandatory, unique, valid Indian mobile number}, 
//   password: {string, mandatory, minLen 8, maxLen 15}, // encrypted password
//   address: {
//     shipping: {
//       street: {string, mandatory},
//       city: {string, mandatory},
//       pincode: {number, mandatory}
//     },
//     billing: {
//       street: {string, mandatory},
//       city: {string, mandatory},
//       pincode: {number, mandatory}
//     }
//   },

// }


const register = async function (req, res) {
    try {
        let data = req.body;


        //body data vaidation

        const { fname, lname, email, phone, password} = data
        
        let address = JSON.parse(req.body.address);
        
        
        //req.body 
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }

        if (!fname || !lname || !email || !phone || !password) {
            return res.status(400).send({ status: false, message: "Enter required fields" })
        }

        //fname
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "Enter valid fname" })
        }

        //lname
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "Enter valid lname" })
        }

        //email

        if (!isValid(email) || !isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "enter valid email" })
        }

        const isEmail = await userModel.findOne({ email: email })

        if (isEmail) {
            return res.status(400).send({ status: false, message: "email is already registered" })
        }

        //phoneNumber
        if (!isValid(phone) || !isValidMobileNum(phone)) {
            return res.status(400).send({ status: false, message: "enter valid phone Number" })
        }

        const phoneNum = await userModel.findOne({ phone: phone })
        if (phoneNum) {
            return res.status(400).send({ status: false, message: "Phone number is already registered" })
        }

        //password
        if (!isValid(password) || password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "enter valid password" })
        }

        data.password = await hashPassWord(data.password)

        //address
        if(address){
            const { shipping, billing } = address
            if(!shipping.street || !shipping.city ||!shipping.pincode ||!billing.street ||!billing.city ||!billing.pincode){
                return res.status(400).send({ status: false, message: "enter required address field" })
            }
        if (!isValid(shipping.street) || !isValid(shipping.city) || !isValid(shipping.pincode)) {
            return res.status(400).send({ status: false, message: "enter valid shipping address" })
        }

        if (!isValid(billing.street) || !isValid(billing.city) || !isValid(billing.pincode)) {
            return res.status(400).send({ status: false, message: "enter valid billing address" })
        }
            data.address = address
        }   
        
    

        // profileImage
        let files = req.files

        if (files.length === 0) {
            return res.status(400).send({ status: false, message: "No file found" })
        }

        let uploadedFiles = await uploadFile(files[0])

        data.profileImage = uploadedFiles
        const createUser = await userModel.create(data)

        return res.status(201).send({ status: true, message: "User created successfully", data: createUser })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// ### POST /login
// - Allow an user to login with their email and password.
// - On a successful login attempt return the userId and a JWT token contatining the userId, exp, iat.
// > **_NOTE:_** There is a slight change in response body. You should also return userId in addition to the JWT token.
// - __Response format__
//   - _**On success**_ - Return HTTP status 200 and JWT token in response body. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)


const login = async function (req, res) {
    try {

        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }

        const { email, password } = req.body

        if (!email || !password) return res.status(400).send({ status: false, message: "email or password is missing" })

        //email
        if (!isValid(email) || !isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "enter valid email" })
        }
        
        //password
        if (!isValid(password) || password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "enter valid password" })
        }

        const userDetail = await userModel.findOne({ email: email });

        const passwordStatus = await comparePassword(password, userDetail.password)

        if (!userDetail || !passwordStatus) {
            return res.status(401).send({ status: false, message: "username or the password is not correct" })
        }

        //generate token

        const token = jwt.sign({ userId: userDetail._id, exp: 7560606060 }, SECRET_KEY)

        return res.status(200).send({ status: true, data: { userId: userDetail._id, token: token } })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// ## GET /user/:userId/profile (Authentication required)
// - Allow an user to fetch details of their profile.
// - Make sure that userId in url param and in token is same
// - __Response format__
//   - _**On success**_ - Return HTTP status 200 and returns the user document. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

const getUser = async function (req, res) {
    try {
        const userId = req.params.userId;

        const userDetail = await userModel.findById(userId)
        if (!userDetail) {
            return res.status(404).send({ status: false, message: "user is not found" })
        }

        return res.status(200).send({ status: true, "message": "User profile details", data: userDetail })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// ```

// ## PUT /user/:userId/profile (Authentication and Authorization required)
// - Allow an user to update their profile.
// - A user can update all the fields
// - Make sure that userId in url param and in token is same
// - __Response format__
//   - _**On success**_ - Return HTTP status 200. Also return the updated user document. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)


const updateUser = async function (req, res) {
    try {
        const userId = req.params.userId;
        let data = req.body;

        const { fname, lname, email, phone, password } = data
        let address = JSON.parse(req.body.address);
    
        let files = req.files

        //body validation
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }
        
        //fname
        if (fname) {
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, message: "Enter valid fname" })
            }
        }

        //lname
        if (lname) {
            if (!isValid(lname)) {
                return res.status(400).send({ status: false, message: "Enter valid lname" })
            }
        }

        //email
        if (email) {
            if (!isValid(email) || !isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "enter valid email" })
            }

            const isEmail = await userModel.findOne({ email: email })

            if (isEmail) {
                return res.status(400).send({ status: false, message: "email is already registered" })
            }
        }
        //phoneNumber
        if (phone) {
            if (!isValid(phone) || !isValidMobileNum(phone)) {
                return res.status(400).send({ status: false, message: "enter valid phone Number" })
            }

            const phoneNum = await userModel.findOne({ phone: phone })
            if (phoneNum) {
                return res.status(400).send({ status: false, message: "Phone number is already registered" })
            }
        }
        //password
        if (password) {
            if (!isValid(password) || password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, message: "enter valid password" })
            }
            data.password = await hashPassWord(data.password)
        }

        //address
        if (address) {
            const { shipping, billing } = address
            if (!isValid(shipping.street) || !isValid(shipping.city) || !isValid(shipping.pincode)) {
                return res.status(400).send({ status: false, message: "enter valid shipping address" })
            }

            if (!isValid(billing.street) || !isValid(billing.city) || !isValid(billing.pincode)) {
                return res.status(400).send({ status: false, message: "enter valid billing address" })
            }
            data.address = address
        }

        if (files) {
            if (files.length === 0) {
                return res.status(400).send({ status: false, message: "No file found" })
            }

            let uploadedFiles = await uploadFile(files[0])

            data.profileImage = uploadedFiles
        }

        const userDetail = await userModel.findById(userId)
        if (!userDetail) {
            return res.status(404).send({ status: false, message: "user is not found" })
        }

        const updateUser = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })
        return res.status(200).send({ status: true, "message": "User profile updated", data: updateUser })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
// ```yaml
// {
//     "status": true,
//     "message": "User profile updated",
//     "data": {
//         "address": {
//             "shipping": {
//                 "street": "MG Road",
//                 "city": "Delhi",
//                 "pincode": 110001
//             },
//             "billing": {
//                 "street": "MG Road",
//                 "city": "Indore",
//                 "pincode": 452010
//             }
//         },
//         "_id": "6162876abdcb70afeeaf9cf5",
//         "fname": "Jane",
//         "lname": "Austin",
//         "email": "janedoe@mailinator.com",
//         "profileImage": "https://classroom-training-bucket.s3.ap-south-1.amazonaws.com/user/laura-davidson-QBAH4IldaZY-unsplash.jpg",
//         "phone": 9876543210,
//         "password": "$2b$10$jgF/j/clYBq.3uly6Tijce4GEGJn9EIXEcw9NI3prgKwJ/6.sWT6O",
//         "createdAt": "2021-10-10T06:25:46.051Z",
//         "updatedAt": "2021-10-10T08:47:15.297Z",
//         "__v": 0
//     }
// }
// ```

// Note: [Bcrypt](https://www.npmjs.com/package/bcrypt)
// Send [form-data](https://developer.mozilla.org/en-US/docs/Web/API/FormData)


module.exports = { register, login, getUser, updateUser }