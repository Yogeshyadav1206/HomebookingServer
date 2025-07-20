const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, required: true, enum: ['host', 'guest'] },
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Home' }],
  hostHomesList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Home' }],
});


// call mongoose.model to create a User model from userSchema and export that User model and anyone can import and use it 
module.exports = mongoose.model('User', userSchema);

