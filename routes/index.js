const express = require('express'); 
const router  = express.Router(); 
const userModel = require('./users');
const user      = require('./users');
const dbAdmission = require('./admissionInquiry')
const passport = require('passport'); 
const localStategy = require('passport-local'); 
const upload = require('./multer'); 
passport.use(new localStategy(user.authenticate()))

//default route 
router.get('/', function(req, res, next) {
  res.redirect('/index');
});

//college page 
router.get('/index', function(req, res, next) {
  res.render('index');
});

//user feed
router.get('/feed/student', isloggedIn, async function(req,res,next){
  try {
    const username = traceCurrentUser(req, res); 
    const user = await userModel.findOne({ username });
    if(user && user.role=='admin') return res.redirect('/feed/admin');
    res.render('feed',{user,title:user.username});
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

//admin feed
router.get('/feed/admin', isloggedIn, async (req, res) => {
  try {
    const username = traceCurrentUser(req, res); 
    const admin = await userModel.findOne({ username }); 
    if(admin && admin.role === 'admin') {
      // console.log(admin.role);
      const users = await userModel.find({ role: { $ne: 'admin' } });
      res.render('admin', { users, admin });
    }else {
    res.redirect('/feed/student');    
   }
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//admin profile details 
router.get('/feed/admin/Dets/:id', isloggedIn, async (req, res) => {
  try {
    const admin = await userModel.findById(req.params.id); 
    res.render('cart',{admin,title:admin.username,isAdmin:true})
  } catch (error) {
    console.error('Error fetching admin data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//user profile request by admin
router.get('/feed/user/Dets/:id', isloggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id); 
    res.render('cart',{user,title:user.username,isAdmin:false, adminRequest:true})
  } catch (error) {
    console.error('Error fetching admin data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//user profile request by user
router.get('/feed/user/details/:id', isloggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id); 
    res.render('cart',{user,title:user.username,isAdmin:false, adminRequest:false})
  } catch (error) {
    console.error('Error fetching admin data:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//user delted by the admin here
router.get('/feed/user/delete/:id', async (req,res) => {
  try {
    await userModel.findByIdAndDelete(req.params.id); 
    res.redirect('/feed/admin');
  } catch (error) {
    console.log(error.message);
  }
})

//create user render here
router.get('/feed/admin/createNewUser', async (req, res) => {
  try {
    const username = traceCurrentUser(req, res); 
    const crrUser = await userModel.findOne({ username });
    if(crrUser && crrUser.role === 'user') return res.redirect('/feed/student');
    res.render('createAndUpdateUser', { errMsg: null, formType: 'Create New User', action: 'Create User', title: 'Create New User' });
  } catch (error) {
    console.log(error.message); 
  }
});

//user created here
router.post('/feed/admin/user/created', isloggedIn ,async (req,res) =>{
  try {
    const existingUser = await userModel.findOne({ username: req.body.username });
    if (existingUser) {
      return res.render('createAndUpdateUser',{errMsg : 'This Username is already exist.',title:'Create New User',action:'Create User', formType:'Create New User'});
    }
    const newUser = new userModel({
      username:req.body.username,
      mobNumber:req.body.mobNumber,
      college:req.body.college,
      course:req.body.course,
      session:req.body.session,
    })
    const registeredUser = await userModel.register(newUser, req.body.password);
    passport.authenticate('local')(req, res, () => {
      res.redirect('/feed/admin')
    });
   

  } catch (error) {
    console.log(error.message)
    res.status(500).send('Internal Server Error');
  }
})

// update user rendering by admin
router.get('/feed/user/update/:id', isloggedIn ,async (req,res) =>{
  try {
    const userData = await userModel.findById({_id:req.params.id});
    res.render('createAndUpdateUser',{action:null, userData, title:'Update User Details', errMsg:null});
  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error")
  }
})

//
router.get('/feed/admin/update/:id', isloggedIn ,async (req,res) =>{
  try {
    const userData = await userModel.findById(req.params.id);
    res.render('createAndUpdateUser',{action:'admin',userData, title:'Update admin Details', errMsg:null});
  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error")
  }
})

// image uploading
router.post('/feed/upload/:id', isloggedIn ,upload.single('image'), async (req, res) => {
  try {
      const uri = 'https://static.vecteezy.com/system/resources/thumbnails/020/911/740/small_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png'
      const userId = req.params.id; 
      const uploadedImageUrl = req.file ? '/uploads/' + req.file.filename : uri; 
      await userModel.findByIdAndUpdate(userId, { img: uploadedImageUrl });
      res.redirect('/feed/student');
  } catch (error) {
      console.error('Error updating image:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// update user action 
router.post('/feed/user/updated', isloggedIn ,async (req,res) => {
  try {
    let {username, mobNumber, college, course, session} = req.body;
    const isUser = await userModel.findOne({username});
    const userData = {
      username:username,
      mobNumber:mobNumber,
      college:college,
      course:course,
      session:session
    }
    if(!isUser) return res.render('createAndUpdateUser',{errMsg : 'No username changes permitted.',title:'Update User Details',action:'update user', userData}); 
    await userModel.findOneAndUpdate(
      { username },
      {
        $set: {
          mobNumber: mobNumber,
          college: college,
          course: course,
          session: session
        }
      }
    );    
    res.redirect('/feed/admin');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
})

//admin updated by this route
router.post('/feed/admin/updated', isloggedIn ,async (req,res) => {
  try {
    let {username, mobNumber,college} = req.body;
    const isUser = await userModel.findOne({username});
    const userData = {
      username:username,
      mobNumber:mobNumber,
      college:college,
    }
    if(!isUser) return res.render('createAndUpdateUser',{errMsg : 'No username changes permitted.',title:'Update Admin Details',action:'admin', userData}); 
    await userModel.findOneAndUpdate(
      { username },
      {
        $set: {
          mobNumber: mobNumber,
          college:college
        }
      }
    );    
    res.redirect('/feed/admin');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
})

//admin details update
router.post('/feed/admin/updated', isloggedIn,async (req,res) => {
  try {
    let {username, mobNumber, college, course, session} = req.body;
    const isUser = await userModel.findOne({username});
    const userData = {
      username:username,
      mobNumber:mobNumber,
      college:college,
      course:course,
      session:session
    }
    if(!isUser) return res.render('createAndUpdateUser',{errMsg : 'No username changes permitted.',title:'Update User Details',action:'update user', userData}); 
    await userModel.findOneAndUpdate(
      { username },
      {
        $set: {
          mobNumber: mobNumber,
          college: college,
          course: course,
          session: session
        }
      }
    );    
    res.redirect('/login');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
})

// Admission Request form submission
router.post('/feed/admission/request/:id', async (req, res) => {
  let { name, email, phone, course, message } = req.body;
  const talsvir = await userModel.findOne({ _id: req.params.id }).select('img -_id');
  try {
    const admissionRequest = await new dbAdmission({
      username: email,
      email: email,
      name: name,
      phoneNumber: "+91 " + phone,
      course: course,
      message: message,
      image:talsvir.img,
    });
    await admissionRequest.save();
    res.redirect('/feed/student')
  } catch (error) {
    res.status(500).json({ success: false, message: "An error occurred while processing your request." });
  }
});

//admission Request Deleted by Admin
router.get('/feed/admin/delete/request/:id', async (req,res) => {
  await dbAdmission.findByIdAndDelete(req.params.id); 
  res.redirect('/feed/admin/admissionRequest/dashboard')
})

//admission Inquery 
router.get('/feed/admin/admissionRequest/dashboard', isloggedIn ,async (req, res) => {
  try {
    const username = traceCurrentUser(req,res); 
    const isAdmin = await userModel.findOne({username})
    if(isAdmin && isAdmin.role == 'user') return res.redirect('/feed/student')
    const newAdmissions = await dbAdmission.find({});
    // console.log(newAdmissions);
    res.render('newAdmission', { newAdmissions});
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/cart',isloggedIn,(rea,res) => {
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
      if (registeredUser.role == 'admin' || registeredUser.role == 'user') {
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

router.get('/login', function (req, res) {
  res.render('login', { title: 'Login' , errorMessage:null});
})

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

// tracking current user
const traceCurrentUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    const currUser = req.user; 
    return currUser.username;
  } else {
    return null; 
  }
};

router.get('/feed', isloggedIn ,async (req, res) => {
  try {
    const username = traceCurrentUser(req, res); 
    if (username) {
      const dets = await userModel.findOne({username:username});
      if(dets.role == 'user'){
        return res.redirect('/feed/student');
      }
      return res.redirect('/feed/admin');
    }else {
      res.redirect('/login')
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('*', (req,res) =>{
  res.render('pageNotFound')
})

module.exports = router;