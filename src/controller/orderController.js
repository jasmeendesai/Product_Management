const cartModel = require("../model/cartModel")
const orderModel = require("../model/orderModel")
const userModel = require("../model/userModel")
const { isValidObjectId } = require("../util/validator")

const createOrder = async function (req, res) {    //userId===cart.userId--authorization
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid user Id" })
        }
        let user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({ status: false, message: "Please provide valid user" })
        }
        let { cartId } = req.body
        let data = {
            status: "pending",
            cancellable: true
        }
        if (!cartId) {
            return res.status(400).send({ status: false, message: "cartId is required" });
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Please provide valid cart Id" })
        }
        
        let cart = await cartModel.findOne({ _id: cartId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "Please provide valid cart" })
        }

        if (cart.userId != userId) {
            return res.status(403).send({ status: false, message: "Not authorised" })
        }
        let quantity = 0;
        for (let i = 0; i < cart.items.length; i++) {
            quantity = quantity + cart.items[i].quantity
        }
        data.userId = userId
        data.items = cart.items
        data.totalPrice = cart.totalPrice
        data.totalItems = cart.totalItems
        data.totalQuantity = quantity
        // console.log(cart)
        let createdOrder = await orderModel.create(data)
        return res.status(200).send({ status: true, message: "created order", data: createdOrder })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid user Id" })

        let user = await userModel.findById(userId)

        if (!user) {
            return res.status(404).send({ status: false, message: "Please provide valid user" })
        }

        let { orderId, status } = req.body

        if (!orderId) {
            return res.status(400).send({ status: false, message: "orderId is required" });
        }

        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "Please provide valid order Id" })

        let order = await orderModel.findOne({ _id: orderId, isDeleted: false })

        if (!order) {
            return res.status(404).send({ status: false, message: "Please provide valid order" })
        }

        if (order.userId != userId) {
            return res.status(403).send({ status: false, message: "Not authorised" })
        }

        if (!["pending", "completed", "cancelled"].includes(status)) {
            return res.status(400).send({ status: false, message: "Please provide valid status" });
        }

        if (order.cancellable == false) {
            return res.status(400).send({ status: false, message: "we can't cancel the order" });
        }

        if (order.status == "cancelled") {
            return res.status(400).send({ status: false, message: "we can't cancel the order ..it is either a pending order or a cancelled order" });
        }

        if (order.status == "completed") {
            return res.status(400).send({ status: false, message: "we can't cancel the order as it is already completed" });
        }

        let result = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })
        return res.status(200).send({ status: true, message: "status is updated", data: result })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createOrder, updateOrder }