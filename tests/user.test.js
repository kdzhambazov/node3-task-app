const request = require('supertest')
const app = require('../src/app')
const mongoose = require('mongoose')
const User = require('../src/models/user')
const jwt = require('jsonwebtoken')

const userId = new mongoose.Types.ObjectId()
const userToken = jwt.sign({_id: userId}, process.env.JWT_SECRET)
const userProps = {
    _id: userId,
    name: "Node test3333rd",
    email: "node@gmail.com",
    password: "test12345",
    tokens: [
        {
            token: userToken
        }
    ]
}

beforeEach(async () => {
    await User.deleteMany()
    await new User(userProps).save()
})

describe('User requests test', () => {
    test('Should Create User', async () => {
        await request(app).post('/users')
            .send({
                name: "Node test3333rd",
                email: "node1@gmail.com",
                password: "test12345"
            })
            .expect(201)
    })

    test('Should Login User', async () => {
        const response = await request(app).post('/users/login')
            .send({
                name: "Node test3333rd",
                email: "node@gmail.com",
                password: "test12345"
            })
            .expect(200)

        const user = await User.findById(userId)
        expect(response.body.token).toBe(user.tokens[1].token)
    })

    test('Should Logout User', async () => {
        await request(app).post('/users/logout')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: "Node test3333rd",
                email: "node@gmail.com",
                password: "test12345"
            })
            .expect(200)
    })

    test('Should Logout All User Sessions', async () => {
        await request(app).post('/users/logoutAll')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: "Node test3333rd",
                email: "node@gmail.com",
                password: "test12345"
            })
            .expect(200)

        const user = await User.findById(userId)
        expect(user.tokens.length).toBe(0)
    })

    test('Should Read User', async () => {
        await request(app).get('/user/me')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: "Node test3333rd",
                email: "node@gmail.com",
                password: "test12345"
            })
            .expect(200)
    })

    test('Should Update User', async () => {
        await request(app).patch('/users/me')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: "Node new name",
            })
            .expect(200)

        const user = await User.findById(userId)
        expect(user.name).toBe('Node new name')
    })

    test('Should Delete User', async () => {
        await request(app).delete('/users/me')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: "Node new name",
            })
            .expect(200)

        const user = await User.findById(userId)
        expect(user).toBeNull()
    })

    test('Should Upload Avatar', async () => {
        await request(app).post('/users/me/avatar')
            .set('Authorization', `Bearer ${userToken}`)
            .attach('avatar', 'tests/fixtures/me.jpg')
            .expect(200)
    })

    test('Should Read Avatar', async () => {
        await request(app).get('/users/me/avatar')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(400)
    })
})