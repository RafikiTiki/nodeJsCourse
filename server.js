const express = require('express')
const coockieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const engine = require('ejs-mate')
const session = require('express-session')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session)
const passport = require('passport')
const flash = require('connect-flash')


const app = express()

mongoose.connect('mongodb://localhost/rateme')

require('./config/passport')

app.use(express.static('public'))
app.engine('ejs', engine)
app.set('view engine', 'ejs')
app.use(coockieParser())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.use(session({
  secret: 'Thisismyteskey',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}))

app.use(flash())

app.use(passport.initialize())
app.use(passport.session())

require('./routes/user')(app, passport)


app.listen(3000, () => {
  console.log('App runing on port 3000')
})