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
  },
  img:{
    type:String,
    default:'https://static.vecteezy.com/system/resources/thumbnails/020/911/740/small_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png',
  },
  college:{
    type : String,
    default:'Technocrats Institute of Technology Bhopal MP.'
  },
  course:{
    type:String,
    default:'BTech'
  },
  session:{
    type:String,
    default:'0-0'
  }
})

userShema.plugin(plm)
module.exports = mongoose.model("user",userShema);