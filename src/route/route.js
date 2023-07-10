const express = require('express')
const router = express.Router()

const {register,login, getUser, updateUser} = require('../controller/userController')
const {Authentication,Authorisation} = require('../middleware/middleware')
const {createProduct,getProduct,getProductById,updateProduct,deleteProductId} = require('../controller/productController')
const {createCart, updateCart,getCart, deleteCart} = require('../controller/cartController')

const { createOrder, updateOrder } = require('../controller/orderController')

//=========================================================================
//user Api's

//register user
router.post('/register', register)

//login user
router.post('/login', login)

//get user
router.get('/user/:userId/profile', Authentication, getUser)

//update user
router.put('/user/:userId/profile', Authentication, Authorisation, updateUser)


//=========================================================================
//Product Api's

//create product
router.post('/products', createProduct)

//get product
router.get('/products', getProduct)

//get product by productId
router.get('/products/:productId', getProductById)

//update product by productId
router.put('/products/:productId', updateProduct)

//delete product by productId
router.delete('/products/:productId', deleteProductId)

//=========================================================================
//Cart Api's

// POST /users/:userId/cart
router.post('/users/:userId/cart', Authentication,Authorisation,createCart)

//get Cart
router.get('/users/:userId/cart', Authentication,Authorisation,getCart)

//delete Cart
router.delete('/users/:userId/cart', Authentication,Authorisation, deleteCart)

router.put('/users/:userId/cart',updateCart)
//=========================================================================

// oder Api

// create order 
router.post('/users/:userId/orders', Authentication, Authorisation, createOrder)

// update order
router.put('/users/:userId/orders', Authentication, Authorisation, updateOrder)

//=======================================================================

router.use('*',(req, res) =>{
    res.status(400).send("Invalid url request");
})

module.exports = router