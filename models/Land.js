const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serial: { type: Number, required: true },
  crop: { type: String, required: true },
  area: { type: Number, required: true }
}, { timestamps: true });

landSchema.index({ user: 1, serial: 1 }, { unique: true });

module.exports = mongoose.model('Land', landSchema);
