const express = require('express')
const Task = require('../models/task')
const isValidOperation = require('../utils/isValidOperation')
const updateDocumentProps = require("../utils/updateDocumentProps")
const auth = require('../middware/auth')

const router = express.Router()

//Create Task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

//Read Tasks
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const completed = req.query.completed
    const querySkip = parseInt(req.query.skip)
    const queryLimit = parseInt(req.query.limit)

    const skip = isNaN(querySkip) ? 0 : querySkip
    const limit = isNaN(queryLimit) ? 0 : queryLimit

    if(completed) {
        match.completed = completed === 'true'
    }

    try {
        const tasks = await Task.find({ owner: req.user._id, ...match }).skip(skip).limit(limit)
        res.status(200).send(tasks)
    } catch (error) {
        res.status(500).send(error)
    }
})

//Read Task
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })

        if(!task) {
            return res.status(404).send()
        }

        res.status(200).send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

//Update Task
router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    const body = req.body
    const updates = Object.keys(body)
    const allowedUpdates = ['description', 'completed']
    const validateOperation = isValidOperation(updates, allowedUpdates)

    if(!validateOperation) {
        return res.status(404).send({ 'error': 'Invalid updates!' })
    }

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })

        if(!task) {
            return res.status(404).send()
        }

        updateDocumentProps(updates, task, body)
        task.save()

        res.status(200).send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

//Delete Task
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
        if(!task) {
            return res.status(404).send()
        }

        res.status(200).send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router