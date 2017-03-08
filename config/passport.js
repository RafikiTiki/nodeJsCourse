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
      return done(null, false, req.flash('error', 'There is already user with thet email '))
    }

    let newUser = new User()
    newUser.fullname = req.body.fullname
    newUser.email = req.body.email
    newUser.password = newUser.encryptPassword(req.body.password)

    newUser.save((err) => {
      return done(null, newUser)
    })
  })
}))

passport.use('local.login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
}, (req, email, password, done) => {
  User.findOne({"email": email}, (err, user) => {
    if (err) {
      return done(err)
    }

    let messages = []

    if (!user) {
      messages.push('Email does not exist')
      return done(null, false, req.flash('error', messages))
    } else if (!user.validPassword(password)) {
      messages.push('Password does not match email')
      return done(null, false, req.flash('error', messages))
    }

    return done(null, user)

  })
}))