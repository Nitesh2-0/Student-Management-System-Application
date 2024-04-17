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

router.get('/feed/student', isloggedIn, async function(req,res,next){
  const username = traceCurrentUser(req, res); 
  const user = await userModel.findOne({ username });
  res.render('feed',{user,title:user.username});
})

router.get('/feed/admin', isloggedIn, async (req, res) => {
  try {
    const username = traceCurrentUser(req, res);
    const admin = await userModel.findOne({ username }); 
    const users = await userModel.find({ role: { $ne: 'admin' } });
    res.render('admin',{users , admin});
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/feed/admin/Dets/:id', isloggedIn, async (req, res) => {
  try {
    const admin = await userModel.findById(req.params.id); 
    res.render('cart',{admin,title:admin.username,isAdmin:true})
  } catch (error) {
    console.error('Error fetching admin data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/feed/user/Dets/:id', isloggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id); 
    res.render('cart',{user,title:user.username,isAdmin:false, adminRequest:true})
  } catch (error) {
    console.error('Error fetching admin data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cart',(rea,res) => {
  res.render('cart')
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
     // Store user information in session
     req.session.user = {
      _id: registeredUser._id,
      username: registeredUser.username,
      role: registeredUser.role,
    };
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

// router.post('/login', async (req, res, next) => {
//   passport.authenticate('local', async (err, user, info) => {
//     if (err) {
//       console.error('Authentication error:', err);
//       return res.status(500).send('Internal Server Error');
//     }
//     if (!user) {
//       return res.render('login', { errorMessage: 'Password is not correct.' });
//     }
//     req.session.user = {
//       _id: req.user._id,
//       username: req.user.username,
//       role: req.user.role
//     };
//     try {
//       req.login(user, (err) => {
//         if (err) {
//           console.error('Login error:', err);
//           return next(err);
//         }
//         if (user.role === 'admin') {
//           res.redirect('/feed');
//         } else if (user.role === 'user') {
//           res.redirect('/feed');
//         } else {
//           res.redirect('/');
//         }
//       });
//     } catch (error) {
//       console.error('Login error:', error);
//       return res.status(500).send('Internal Server Error');
//     }
//   })(req, res, next);
// });

router.post('/login', async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    try {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).send('Internal Server Error');
      }
      if (!user) {
        return res.render('login', { errorMessage: 'Password is not correct.' });
      }
      
      // Store user information in session
      req.session.user = {
        _id: user._id, 
        username: user.username,
        role: user.role
      };
      
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return next(err);
        }
        if (user.role === 'admin' || user.role === 'user') {
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

const traceCurrentUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    const currUser = req.user; 
    return currUser.username;
  } else {
    return null; 
  }
};

router.get('/feed', async (req, res) => {
  try {
    const username = traceCurrentUser(req, res); 
    if (username) {
      const dets = await userModel.findOne({username:username});
      if(dets.role == 'user'){
        return res.redirect('/feed/student');
      }
      return res.redirect('/feed/admin');
    }else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;