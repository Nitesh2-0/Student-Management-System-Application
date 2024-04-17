require('dotenv').config(); 
const express = require('express'); 
const app = express(); 
const path = require('path');
const expressSession = require('express-session');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/users')
const passport = require('passport');


app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs'); 

app.use(expressSession({
  resave:false,
  saveUninitialized:false,
  secret:process.env.SECRET
}))

app.use(passport.initialize()); 
app.use(passport.session()); 
passport.serializeUser(userRouter.serializeUser()); 
passport.deserializeUser(userRouter.deserializeUser());

app.use(express.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,'public')));

app.use('/',indexRouter); 
app.use('/users',userRouter);

app.listen(process.env.PORT, ()=>{
  console.log(`Server is running on the port ${process.env.PORT}.`);
})