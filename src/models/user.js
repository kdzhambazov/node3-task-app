const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require('./task')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            lowercase: true,
            validate(value) {
                if(!validator.isEmail(value)) {
                    throw new Error('The email must be in the valid format!')
                }
            }
        },
        age: {
            type: Number,
            default: 0,
            validate(value) {
                if(value < 0) {
                    throw new Error('The age must be a positive number!')
                }
            }
        },
        password: {
            type: String,
            required: true,
            minLength: 7,
            trim: true,
            validate(value) {
                if(value.toLowerCase().includes('password')) {
                    throw new Error('The password cannot contain the "password" word!')
                }
            }
        },
        tokens: [
            {
                token: {
                    type: String,
                    required: true
                }
            }
        ],
        avatar: {
            type: Buffer
        }
    },
    {
        timestamps: true
    }
)

userSchema.virtual('taks', {
    'ref': 'Task',
    'localField': '_id',
    'foreignField': 'owner'
})

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email });
    if(!user) {
        throw new Error('Wrong email!')
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) {
        throw new Error('Wrong password!')
    }

    return user
}

userSchema.methods.generateAuthToken = async function() {
    const token = jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET)

    this.tokens = this.tokens.concat({token})
    await this.save()

    return token
}

userSchema.methods.toJSON = function() {
    const userObject = this.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.pre('save', async function() {
    if(this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }
});

userSchema.pre('remove', async function() {
    Task.deleteMany({ owner: this._id })
});

const User = mongoose.model('user', userSchema)

module.exports = User