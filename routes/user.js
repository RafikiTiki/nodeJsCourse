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
