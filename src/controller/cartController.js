// ## Cart APIs (_authentication required as authorization header - bearer token_)
// ### POST /users/:userId/cart (Add to cart)


const productModel = require('../model/ProductModel')
const userModel = require('../model/userModel')
const cartModel = require('../model/cartModel')
const {
    isValidRequestBody,
    isValidObjectId,
    TotalPrice } = require('../util/validator')
const ProductModel = require('../model/ProductModel')


// creating cart but based on condition that if cart exist then update otherwise create new cart 
const createCart = async function (req, res) {
    try {
        const userId = req.params.userId;
        const { productId, quantity, cartId } = req.body

        //req.body 
        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }

        //mandatory fields validations
        if (!userId) {
            return res.status(400).send({ status: false, message: "Enter userId" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(401).send({ status: false, message: "Invalid User Id" })
        }

        const userExist = await userModel.findById(userId)

        if (!userExist) {
            return res.status(404).send({ status: false, message: "User does not exist" })
        }

        const userCart = await cartModel.findOne({ userId: userId })

        if (!userCart) {
            let cart = {
                userId: userId,
                items: [],
                totalPrice: 0,
                totalItems: 0
            }
            const createData = await cartModel.create(cart)
            return res.status(201).send({ status: true, message: "cart is created", data: createData })
        }

        if (userCart) {
            // const productInCart = await cartModel.find({})

            if (!productId || !quantity) {
                return res.status(400).send({ status: false, message: "Enter mandatory fields" })
            }

            if (!isValidObjectId(productId)) {
                return res.status(401).send({ status: false, message: "Invalid product Id" })
            }

            const product = await productModel.findOne({ _id: productId, isDeleted: false })

            if (!product) {
                return res.status(404).send({ status: false, message: "Product does not exist" })
            }

            if (!cartId) {
                return res.status(400).send({ status: false, message: "Enter cartId" })
            }

            if (!isValidObjectId(cartId)) {
                return res.status(401).send({ status: false, message: "Invalid cart Id" })
            }

            if (userCart._id.toString() !== cartId) {
                return res.status(403).send({ status: false, message: "CartId not matched not Authorised" })
            }

            const existingItems = userCart.items.find((val) => val.productId.toString() == productId)

            if (existingItems) {
                existingItems.quantity += quantity //check
            } else {
                // If the product doesn't exist in the cart, add it as a new item
                userCart.items.push({
                    productId: productId,
                    quantity: quantity
                });
            }
            userCart.totalItems = userCart.items.length;


            userCart.totalPrice = userCart.totalPrice + TotalPrice(userCart.items, [product]);
            // Save the updated cart
            await userCart.save();

            // Return the updated cart document with product details
            const response = {
                _id: userCart._id,
                userId: userCart.userId,
                items: userCart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                totalPrice: userCart.totalPrice,
                totalItems: userCart.totalItems,
                createdAt: userCart.createdAt,
                updatedAt: userCart.updatedAt
            };

            return res.status(201).send({ status: true, message: "cart created", data: response });

        }
    }

    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//================================================================================================

// ### PUT /users/:userId/cart (Remove product / Reduce a product's quantity from the cart)


const updateCart = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { productId, removeProduct, cartId } = req.body

        if (!isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }

        //mandatory fields validations
        if (!userId || !productId || !removeProduct) {
            return res.status(400).send({ status: false, message: "Enter mandatory fields" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(401).send({ status: false, message: "Invalid User Id" })
        }

        const userExist = await userModel.findById(userId)

        if (!userExist) {
            return res.status(404).send({ status: false, message: "User does not exist" })
        }


        if (!isValidObjectId(productId)) {
            return res.status(401).send({ status: false, message: "Invalid product Id" })
        }

        const cart = await cartModel.findById(cartId)
        if (!cart) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }

        let productData = await ProductModel.findOne({ _id: productId, isDeleted: false })

        if (!productData) {
            return res.status(404).send({ status: false, message: "product not found" })
        }

        if (!(removeProduct == 0 || removeProduct == 1)) {
            return res.status(401).send({ status: false, message: "removeProduct field should contain 0 or 1" })
        }
        const items = cart.items

        const product = items.find((val) => val.productId.toString() === productId)

        let price = productData.price

        if (removeProduct == 0) {

            for (let i = 0; i < items.length; i++) {

                if (items[i].productId === product.productId) {

                    let x = items.splice(i, 1)

                    cart.items = items

                    cart.totalPrice = cart.totalPrice - TotalPrice(x, [productData])

                }

            }

        }

        else if (removeProduct == 1) {

            for (let i = 0; i < items.length; i++) {
                if (items[i].productId === product.productId) {

                    if (items[i].quantity > 1) {

                        items[i].quantity = items[i].quantity - 1
                        cart.totalPrice = cart.totalPrice - (price * items[i].quantity)
                    }
                    else if (items[i].quantity == 1) {
                        let x = items.splice(i, 1)
                        cart.items = items
                        cart.totalPrice = cart.totalPrice - TotalPrice(x, [productData])
                    }
                }

            }
        }

        cart.totalItems = items.length

        const updatedCart = await cartModel.findOneAndUpdate({ _id: cartId }, cart, { new: true })
        return res.status(200).send({ status: false, message: "Cart updated Successfully", data: updatedCart })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



//=============================================================================
// ### GET /users/:userId/cart

const getCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(401).send({ status: false, message: "Invalid User Id" })
        }
        let user = await userModel.findById(userId)

        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        
        let cart = await cartModel.findOne({ userId: userId })

        if (!cart) {
            return res.status(404).send({ status: false, message: "There is no cart for this user" })
        }
        return res.status(200).send({ status: true, message: "Detail of cart of this user", data: cart })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//=============================================================================
// ### DELETE /users/:userId/cart

const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(401).send({ status: false, message: "Invalid User Id" })
        }

        let user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({ status: false, message: "User not found" })
        }
        let cart = await cartModel.findOne({ userId: userId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "There is no cart for this user" })
        }
        cart.items = []
        cart.totalItems = 0
        cart.totalPrice = 0

        let deletedCartDetail = await cartModel.findOneAndUpdate({ _id: cart._id }, cart, { new: true })
        console.log(deletedCartDetail)
        return res.status(200).send({ status: true, message: "Detail of cart of this user", data: cart })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createCart, updateCart, getCart, deleteCart }