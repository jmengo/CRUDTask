const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is not valid :(");
      }
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error("Age must be a positive number");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (value.length <= 6) {
        throw new Error("Password length must exceed 6 characters");
      } else if (value.toLowerCase().includes("password")) {
        throw new Error("Passwords should not contain the string 'password'");
      }
    },
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
})
userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({
    _id: user.id.toString()
  }, 'taskApp')
  user.tokens = user.tokens.concat({
    token
  })
  await user.save()
  return token
}

userSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()
  delete userObject.password
  delete userObject.tokens
  return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({
    email
  })
  if (!user) {
    throw new Error('Unable to login')
  }
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new Error('Unable to login')
  }
  return user
}

// Hash Plaintext Password
userSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }
  next()
})

const User = mongoose.model("User", userSchema);

module.exports = User