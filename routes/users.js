require('dotenv').config();
const mongoose  = require('mongoose'); 
const plm = require('passport-local-mongoose'); 

mongoose.connect(process.env.URI).then(() => {
    console.log("Database is connected.");
  })
  .catch((err) => {
    console.error("Connection error:", err);
});

const userShema = mongoose.Schema({
  username: String,
  password: String,
  mobNumber:String,
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  adminId:{
    type:String,
  }
})

userShema.plugin(plm)
module.exports = mongoose.model("user",userShema);