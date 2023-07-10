// Products API (_No authentication required_)
// ### POST /products
// - Create a product document from request body.
// - Upload product image to S3 bucket and save image public url in document.
// - __Response format__
//   - _**On success**_ - Return HTTP status 201. Also return the product document. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

const productModel = require('../model/ProductModel')
const { uploadFile } = require('../aws/aws')
const {
    isValid,
    isValidRequestBody,
    isValidObjectId } = require('../util/validator')



const createProduct = async function (req, res) {
    try {
        let data = req.body;

        //body data vaidation

        let { title, description, price, currencyId, currencyFormat, style, installments, availableSizes } = data

        //req.body 
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }

        if (!title || !description || !price || !currencyId || !currencyFormat) {
            return res.status(400).send({ status: false, message: "Enter required fields" })
        }

        //title: {string, mandatory, unique},
        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Enter valid title" })
        }
        const istitle = await productModel.findOne({ title: title })
        if (istitle) {
            return res.status(400).send({ status: false, message: "title is already present" })
        }

        // description: {string, mandatory},
        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Enter valid description" })
        }

        // price: {number, mandatory, valid number/decimal},
        price = (+price)
        if (typeof price !== "number") {
            return res.status(400).send({ status: false, message: "Enter valid price" })
        }

        // currencyId: {string, mandatory, INR}

        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "Enter valid currencyId" })
        }

        // currencyFormat: {string, mandatory, Rupee symbol},
        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "Enter valid currencyFormat" })
        }

        // style: {string},
        if (!isValid(style)) {
            return res.status(400).send({ status: false, message: "Enter valid style" })
        }

        // installments: {number}
        installments = (+installments)
        if (typeof installments !== "number") {
            return res.status(400).send({ status: false, message: "Enter valid installments" })
        }

        // availableSizes: {array of string, at least one size, enum["S", "XS","M","X", "L","XXL", "XL"]},

        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes)) {
            return res.status(400).send({ status: false, message: "Enter valid availableSizes" })
        }

        // productImage
        let files = req.files

        if (files.length === 0) {
            return res.status(400).send({ status: false, message: "No file found" })
        }

        let uploadedFiles = await uploadFile(files[0])

        data.productImage = uploadedFiles

        const createProduct = await productModel.create(data)

        return res.status(201).send({ status: true, message: "User created successfully", data: createProduct })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// ### GET /products
// - Returns all products in the collection that aren't deleted.
//   - __Filters__
//     - Size (The key for this filter will be 'size')
//     - Product name (The key for this filter will be 'name'). You should return all the products with name containing the substring recieved in this filter
//     - Price : greater than or less than a specific value. The keys are 'priceGreaterThan' and 'priceLessThan'. 

// > **_NOTE:_** For price filter request could contain both or any one of the keys. For example the query in the request could look like { priceGreaterThan: 500, priceLessThan: 2000 } or just { priceLessThan: 1000 } )

//   - __Sort__
//     - Sorted by product price in ascending or descending. The key value pair will look like {priceSort : 1} or {priceSort : -1}
//   _eg_ /products?size=XL&name=Nit%20grit
// - __Response format__
//   - _**On success**_ - Return HTTP status 200. Also return the product documents. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

const getProduct = async function (req, res) {
    try {


        let { size, name, priceGreaterThan, priceLessThan, priceSort } = req.query
        let filter = {}
        filter.isDeleted = false


        if (size) {

            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size))) {

                return res.status(400).send({ status: false, message: "Please provide valid size" })
            }
            filter.availableSizes = size

        }

        if (name) {
            if (!(isValid(name))) {
                return res.status(400).send({ status: false, message: "Please provide valid title" })
            }
            filter.title = { $regex: new RegExp(name, 'i') }
        }

        if (priceGreaterThan) {
            priceGreaterThan = (+priceGreaterThan)
            if (typeof priceGreaterThan !== "number") {
                return res.status(400).send({ status: false, message: "Please provide valid number " })
            }
            filter.price = {$gt: priceGreaterThan}
        }
        if (priceLessThan) {
            priceLessThan = (+priceLessThan)
            if (typeof priceLessThan !== "number") {
                return res.status(400).send({ status: false, message: "Please provide valid number " })
            }
            // filter.price={$lt:priceLessThan}
            if (filter.price) {
                filter.price.$lt = priceLessThan
            }
            else {
                filter.price = { $lt: priceLessThan }
            }
        }

        const product = await productModel.find(filter).sort({ price: priceSort })
        if(product.length==0){
            res.status(404).send({ status: false, message: "product not found"})
        }
        return res.status(200).send({ status: true, message: "Here is the filtered data", data: product })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//====================================================================


// ### GET /products/:productId
// - Returns product details by product id
// - __Response format__
//   - _**On success**_ - Return HTTP status 200. Also return the product documents. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)
//===

const getProductById = async (req, res) => {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(401).send({ status: false, message: "Invalid Product Id" })
        }
        const product = await productModel.findById(productId)
        if(!product){
            res.status(404).send({ status: false, message: "product not found"})
        }

        return res.status(200).send({ status: true, message: "Here is the filtered data", data: product })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//==============================
// ### PUT /products/:productId
// - Updates a product by changing at least one or all fields
// - Check if the productId exists (must have isDeleted false and is present in collection). If it doesn't, return an HTTP status 404 with a response body like [this](#error-response-structure)
// - __Response format__
//   - _**On success**_ - Return HTTP status 200. Also return the updated product document. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

//===============================================

const updateProduct = async (req, res) => {
    try {
        const productId = req.params.productId

        //body data vaidation

        let { title, description, price, currencyId, currencyFormat, style, installments, availableSizes, isFreeShipping } = req.body

        let data = {};


        //productId validation
        if (!isValidObjectId(productId)) {
            return res.status(401).send({ status: false, message: "Invalid Product Id" })
        }

        const productDetail = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetail) {
            return res.status(404).send({ status: false, message: "product is not found" })
        }

        //req.body 
        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }

        //title: {string, mandatory, unique},
        if (title) {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: "Enter valid title" })
            }
            const istitle = await productModel.findOne({ title: title })
            if (istitle) {
                return res.status(400).send({ status: false, message: "title is already present" })
            }
            data.title = title
        }

        // description: {string, mandatory},
        if (description) {
            if (!isValid(description)) {
                return res.status(400).send({ status: false, message: "Enter valid description" })
            }
            data.description = description
        }

        // price: {number, mandatory, valid number/decimal},
        if (price) {
            price = (+price)
            if (typeof price !== "number") {
                return res.status(400).send({ status: false, message: "Enter valid price" })
            }
            data.price = price
        }

        // currencyId: {string, mandatory, INR}
        if (currencyId) {
            if (!isValid(currencyId)) {
                return res.status(400).send({ status: false, message: "Enter valid currencyId" })
            }
            data.currencyId = currencyId
        }

        // currencyFormat: {string, mandatory, Rupee symbol},
        if (currencyFormat) {
            if (!isValid(currencyFormat)) {
                return res.status(400).send({ status: false, message: "Enter valid currencyFormat" })
            }
            data.currencyFormat = currencyFormat
        }

        // style: {string},
        if (style) {
            if (!isValid(style)) {
                return res.status(400).send({ status: false, message: "Enter valid style" })
            }
            data.style = style
        }

        // installments: {number}
        if (installments) {
            installments = (+installments)
            if (typeof installments !== "number") {
                return res.status(400).send({ status: false, message: "Enter valid installments" })
            }
            data.installments = installments
        }

        // availableSizes: {array of string, at least one size, enum["S", "XS","M","X", "L","XXL", "XL"]},
        if (availableSizes) {

            if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes)) {
                return res.status(400).send({ status: false, message: "Enter valid availableSizes" })
            }
        }

        // productImage
        let files = req.files

        if (files.length === 0) {
            return res.status(400).send({ status: false, message: "No file found" })
        }
        if (isFreeShipping) {
            data.isFreeShipping = isFreeShipping
        }
        let uploadedFiles = await uploadFile(files[0])

        data.productImage = uploadedFiles

        const updateproduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, 
            {$set : data,
            $addToSet: {
                availableSizes: availableSizes
            }
        },
        
            { new: true })
        return res.status(200).send({ status: true, "message": "User profile updated", data: updateproduct })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//===============================================
// ### DELETE /products/:productId
// - Deletes a product by product id if it's not already deleted
// - __Response format__
//   - _**On success**_ - Return HTTP status 200. The response should be a JSON object like [this](#successful-response-structure)
//   - _**On error**_ - Return a suitable error message with a valid HTTP status code. The response should be a JSON object like [this](#error-response-structure)

const deleteProductId = async (req, res) => {
    try {
        const productId = req.params.productId

        //productId validation
        if (!isValidObjectId(productId)) {
            return res.status(401).send({ status: false, message: "Invalid Product Id" })
        }

        const productDetail = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetail) {
            return res.status(404).send({ status: false, message: "Product is not found" })
        }

        await productModel.findOneAndUpdate({ _id: productId }, { $set: {isDeleted: true, deletedAt: new Date } })

        return res.status(200).send({ status: true, message: "Product is deleted successfully" })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createProduct, getProduct, getProductById, updateProduct, deleteProductId }