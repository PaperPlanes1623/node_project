const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// const localStrategy = require('passport-local').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const flash = require('connect-flash');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
})

//mongodb connection
mongoose.connect("mongodb://localhost:27017/profilerDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);
//create schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// passport.use(new localStrategy(User.authenticate()));



app.get("/", function (req, res) {
  res.render("home");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/success", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("success");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function (req, res) {
  let errors = [];
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }
    else {
      User.findOne({ username: username }).then(user => {
        if (user) {
          errors.push({ msg: 'Email already exists' });
          res.render('register', {
            errors,
            username,
            password
          }).catch(err => console.log(err));
        } else {
          const newUser = new User({
            username,
            password
          });
          newUser.save()
            .then(user => {
              req.flash('success_msg', 'You are now registered');
              res.redirect('login');
            })
            .catch(err => console.log(err));
        }
      })
    }
  })
});

app.post("/login", function (req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/success',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});


app.listen(3000, function () {
  console.log('Server started on port 3000');
});