const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const User = require('../models/user')

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user)
  })
})

passport.use('local.signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
}, (req, email, password, done) => {
  User.findOne({"email": email}, (err, user) => {
    if (err) {
      return done(err)
    }

    if (user) {
      return done(null, false)
    }
    console.log(req.body.password)
    let newUser = new User()
    newUser.fullname = req.body.fullname
    newUser.email = req.body.email
    newUser.password = newUser.encryptPassword(req.body.password)

    newUser.save((err) => {
      console.log(newUser)
      return done(null, newUser)
    })
  })
}))