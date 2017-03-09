const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')
const async = require('async')

const crypto = require('crypto')
const User = require('../models/user')

module.exports = (app, passport) => {
  app.get('/', (req, res, next) => {
    res.render('index', {title: "RateMe"})
  })

  app.get('/signup', (req, res, next) => {
    const errors = req.flash('error')
    res.render('user/signup', {title: 'Sign up || RateMe', messages: errors, hasErrors: errors.length > 0})
  })

  app.post('/signup', validateSignUpForm, passport.authenticate('local.signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true,
  }))

  app.get('/login', (req, res, next) => {
    const errors = req.flash('error')
    res.render('user/login', {title: 'Login || RateMe', messages: errors, hasErrors: errors.length > 0})
  })

  app.post('/login', passport.authenticate('local.login', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.get('/home', (req, res) => {
    res.render('home', {title: 'Home || RateMe'})
  })

  app.get('/forgot', (req, res) => {
    const errors = req.flash('error')
    const info = req.flash('info')
    res.render('user/forgot', {title: 'Forgot Password', messages: errors, hasErrors: errors.length > 0, info: info, hasInfo: info.length > 0})
  })

  app.post('/forgot', (req, res, next) => {
    async.waterfall([
      function (callback) {
        crypto.randomBytes(20, (err, buf) => {
          const rand = buf.toString('hex')
          callback(err, rand)
        })
      },

      function (rand, callback) {
        User.findOne({'email': req.body.email}, (err, user) => {
          if (!user) {
            req.flash('error', 'No account matches that email or email is invalid')
            return res.redirect('/forgot')
          }

          user.passwordResetToken = rand
          user.passwordResetExpires = Date.now() + 60*60*10000

          user.save(err => {
            callback(err, rand, user)
          })
        })
      },

      function (rand, user, callback) {
        const smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
          }
        })

        const mailOptions = {
          to: user.email,
          from: 'RafixDev '+'<'+process.env.EMAIL+'>',
          subject: 'RafixDev application password reset token',
          text: 'You have requested a password reset token. \n\n'+
                'Please click on the link below to complete the process: \n\n'+
                'http://localhost:3000/reset/'+rand+'\n\n'

        }

        smtpTransport.sendMail(mailOptions, (err, response) => {
          req.flash('info', `A password reset token has been sent to ${user.email}`)
          return callback(err, user)
        })
      }
    ], (err) => {
      if (err) {
        return next(err)
      }

      res.redirect('/forgot')
    })
  })

  app.get('/reset/:token', (req, res) => {
    User.findOne({'passwordResetToken': req.params.token, 'passwordResetExpires': {$gt: Date.now()}}, (err, user) => {
      if (!user) {
        req.flash('error', 'Password reset token expired or is invalid. Insert your email again to get a new token.')
        return res.redirect('/forgot')
      }

      const errors = req.flash('error')
      const success = req.flash('success')
      res.render('user/reset', {title: 'Reset Password', messages: errors, hasErrors: errors.length > 0, success, isSuccess: success.length > 0})

    })
  })

  app.post('/reset/:token', (req, res, next) => {
    async.waterfall([
      function (callback) {
        User.findOne({'passwordResetToken': req.params.token, 'passwordResetExpires': {$gt: Date.now()}}, (err, user) => {
          console.log(req.params)
          if (!user) {
            console.log(req.params)
            req.flash('error', 'Password reset token expired or is invalid. Insert your email again to get a new token.')
            return res.redirect('/forgot')
          }

          req.checkBody('newPassword', 'Password is required').notEmpty()
          req.checkBody('newPassword', 'Password must not be less than 5').isLength({min: 5})
          req.check('newPassword', 'Password must contain at lest 1 number').matches(/(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]+/, 'i')

          const errors = req.validationErrors()

          if (req.body.newPassword === req.body.confirmPassword) {
            if (errors) {
              let messages = []
              errors.forEach(error => messages.push(error.msg))
              req.flash('error', messages)
              res.redirect(`/reset/${req.params.token}`)
            } else {
              const syf = new User()
              user.password = syf.encryptPassword(req.body.newPassword)
              user.passwordResetToken = ''
              user.passwordResetExpires = Date.now()

              user.save(err => {
                req.flash('success', 'Password has been successfully changed')
                callback(err, user)
              })
            }
          } else {
            req.flash('error', 'Passwords are not equall')
          }

        })
      },

      function (user, callback) {
        const smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
          }
        })

        const mailOptions = {
          to: user.email,
          from: 'RafixDev '+'<'+process.env.EMAIL+'>',
          subject: 'Password reset',
          text: 'Your password has been successfully changed!',

        }

        smtpTransport.sendMail(mailOptions, (err, response) => {
          callback(err, user)

          const errors = req.flash('error')
          const success = req.flash('success')
          res.render('user/reset', {title: 'Reset Password', messages: errors, hasErrors: errors.length > 0, success, isSuccess: success.length > 0})
        })
      }
    ])
  })

}

function validateSignUpForm(req, res, next) {
  req.checkBody('fullname', 'Fullname is Required').notEmpty()
  req.checkBody('fullname', 'Fullname must not be less than 5').isLength({min: 5})
  req.checkBody('email', 'Email is required').notEmpty()
  req.checkBody('email', 'Email is invalid').isEmail()
  req.checkBody('password', 'Password is required').notEmpty()
  req.checkBody('password', 'Password must not be less than 5').isLength({min: 5})
  req.check('password', 'Password must contain at lest 1 number').matches(/(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]+/, 'i')

  const errors = req.validationErrors()

  if (errors) {
    let messages = []
    errors.forEach(error => messages.push(error.msg))

    req.flash('error', messages)
    res.redirect('/signup')
  } else {
    return next()
  }
}
