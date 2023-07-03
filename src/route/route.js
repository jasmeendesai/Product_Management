const express = require('express')
const router = express.Router()

const {register,login, getUser, updateUser} = require('../controller/userController')
const {Authentication,Authorisation} = require('../middleware/middleware')

router.post('/register', register)
router.post('/login', login)
router.get('/user/:userId/profile', Authentication, Authorisation, getUser)
router.put('/user/:userId/profile', Authentication, Authorisation, updateUser)

router.use('*',(req, res) =>{
    res.status(400).send("Invalid url request");
})

module.exports = router