const mongoose = require('mongoose');
//use mongoose.Schema to define the schema 
const homeSchema = new mongoose.Schema({
  houseName: { type: String, required: true },
  price: { type: String, required: true },
  location: { type: String, required: true },
  rating: { type: Number, required: true },
  photo: { type: String },
  description: { type: String },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Add host reference
});

// call mongoose.model to create a Home model from homeSchema and export that Home model and anyone can import and use it 
module.exports = mongoose.model('Home', homeSchema);

 