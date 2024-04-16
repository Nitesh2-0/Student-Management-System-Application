const express = require('express'); 
const router  = express.Router(); 
const userModel = require('./users');
const user      = require('./users');
const passport = require('passport'); 
const localStategy = require('passport-local'); 
passport.use(new localStategy(user.authenticate()))


router.get('/', function(req, res, next) {
  res.redirect('/index');
});

router.get('/index', function(req, res, next) {
  res.render('index');
});

router.get('/feed', isloggedIn,  function(req,res,next){
  res.render('feed',{student:true});
})

router.get('/register', function (req, res) {
  res.render('register', { title: 'Register' , errMsg: null});
})


router.post('/register', async (req, res) => {
  try {
    const existingUser = await userModel.findOne({ username: req.body.username });
    if (existingUser) {
      return res.render('register',{errMsg : 'Username is already exist.'})
    }
    const userData = new userModel({
      username: req.body.username,
      role: req.body.admin === 'on' ? 'admin' : 'user',
      mobNumber:req.body.number,
    });
    const registeredUser = await userModel.register(userData, req.body.password);
    passport.authenticate('local')(req, res, () => {
      if (registeredUser.role === 'admin' || registeredUser.role === 'user') {
        res.redirect('/feed');
      } else {
        res.redirect('/');
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  else res.redirect('/login');
}

function isSeller(req, res, next) {
  if (req.user.role === 'admin') return next()
  else res.redirect('/')
}

router.get('/login', function (req, res) {
  res.render('login', { title: 'Login' , errorMessage:null});
})

router.post('/login', async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).send('Internal Server Error');
    }
    if (!user) {
      return res.render('login', { errorMessage: 'Password is not correct.' });
    }
    try {
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        if (user.role === 'admin') {
          res.redirect('/feed');
        } else if (user.role === 'user') {
          res.redirect('/feed');
        } else {
          res.redirect('/');
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).send('Internal Server Error');
    }
  })(req, res, next);
});

router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect('/login');
    });
  else {
    res.redirect('/');
  }
});


module.exports = router;