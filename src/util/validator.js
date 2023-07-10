const mongoose = require('mongoose')
const bcrypt = require("bcrypt");

//==============================================================================
const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};


//==============================================================================

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};

//==============================================================================

const isValidEmail = function (email) {
    return email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
};

//==============================================================================

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId);
};

//==============================================================================

const isValidMobileNum = function (MobileNum) {
    if (MobileNum.length !== 10) {
        return false
    }
    // return MobileNum.match(/^[0-9]+$/)
    return MobileNum.match(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/)

};

//==============================================================================

const hashPassWord = async (password) => {
    try {
        const saltRounds = 10;
        const hasspassword = await bcrypt.hash(password, saltRounds);
        return hasspassword;

    } catch (error) {
        res.status(500).send({ status: false, message: "hashpassword error" })
    }
}

//==============================================================================

const comparePassword = async (password, hashpassword) => {
    return bcrypt.compare(password, hashpassword);
};

//=============================================================================

function TotalPrice(items, products) {
    let totalPrice = 0
    for (const item of items) {
        const product = products.find(product => product._id.toString() === item.productId.toString());
        if (product) {
            totalPrice += product.price * item.quantity;
        }
    }
    return totalPrice;
}


module.exports = { isValid, isValidRequestBody, isValidEmail, isValidObjectId, isValidMobileNum ,hashPassWord, comparePassword, TotalPrice}