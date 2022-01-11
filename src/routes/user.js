const express = require('express')
const User = require('../models/user')
const isValidOperation = require("../utils/isValidOperation")
const updateDocumentProps = require("../utils/updateDocumentProps")
const auth = require('../middware/auth')
const router = express.Router()
const multer = require('multer')

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only jpg, jpeg and png files are allowed!'))
        }

        cb(undefined, true)
    }
})

//Create User
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        const token = await user.generateAuthToken()

        res.status(201).send({user, token})
    } catch (error) {
        res.status(400).send(error)
    }
})

//Login User
router.post('/users/login', async (req, res) => {
    const body = req.body

    try {
        const user = await User.findByCredentials(body.email, body.password)
        const token = await user.generateAuthToken()

        res.status(200).send({user, token})
    } catch (error) {
        res.status(400).send(error)
    }
})

//Logout User
router.post('/users/logout', auth, async (req, res) => {
    const user = req.user

    try {
        user.tokens = user.tokens.filter(token => token.token !== req.token)

        await user.save()
        res.status(200).send()
    } catch (error) {
        res.status(500).send(error)
    }
})

//Logout All User Sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    const user = req.user

    try {
        user.tokens = []

        await user.save()
        res.status(200).send()
    } catch (error) {
        res.status(500).send(error)
    }
})

//Read Profile
router.get('/user/me', auth, async (req, res) => {
    res.status(200).send(req.user)
})

//Update User
router.patch('/users/me', auth, async (req, res) => {
    const body = req.body
    const updates = Object.keys(body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const validateOperation = isValidOperation(updates, allowedUpdates)
    if(!validateOperation) {
        return res.status(404).send({ 'error': 'Invalid updates!' })
    }

    try {
        const user = req.user

        updateDocumentProps(updates, user, body)
        await user.save()

        res.status(200).send(user)
    } catch (error) {
        res.status(500).send(error)
    }
})

//Delete User
router.delete('/users/me', auth, async (req, res) => {
    try {
        const user = req.user

        await user.remove()
        res.status(200).send(user)
    } catch (error) {
        res.status(500).send(error)
    }
})

//Upload Avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const user = req.user
    user.avatar = req.file.buffer
    await user.save()

    res.status(200).send()
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message })
})

//Read Avatar
router.get('/users/me/avatar', auth, async (req, res) => {
    const avatar = req.user.avatar

    try {
        if(!avatar) {
            throw new Error('No avatar found!')
        }

        res.set('Content-Type', 'image/jpg')
        res.status(200).send(req.user.avatar)
    } catch (error) {
        res.status(400).send(error)
    }
})

//Delete Avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    const user = req.user
    user.avatar = undefined
    await user.save()

    res.status(200).send()
})

module.exports = router