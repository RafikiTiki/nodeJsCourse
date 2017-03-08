const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const Schema = mongoose.Schema

const userSchema = Schema({
  fullname: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String},
  role: {type: String, default: ''},
  company: {
    name: {type: String, default: ''},
    image: {type: String, default: ''},
  },
  passwordResetToken: {type: String, default: ''},
  passwordResetExpires: {type: Date, default: Date.now()}
})

userSchema.methods.encryptPassword = password => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
}

module.exports = mongoose.model("User", userSchema)