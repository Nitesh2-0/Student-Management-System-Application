const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function(req, file, cb) {
    const fn = crypto.randomBytes(20).toString('hex') + path.extname(file.originalname);
    cb(null, fn);
  }
});

const upload = multer({ storage: storage });

module.exports = upload;
