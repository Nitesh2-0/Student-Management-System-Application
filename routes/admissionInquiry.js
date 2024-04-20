const mongoose = require('mongoose'); 

const admissionShema = new mongoose.Schema({
  username:String,
  email:String,
  name: String,
  phoneNumber : String,
  course:String, 
  message:String,
  image:{
    type:String,
    default:'https://static.vecteezy.com/system/resources/thumbnails/020/911/740/small_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png'
  }
})

module.exports = mongoose.model('admissionRequest',admissionShema);