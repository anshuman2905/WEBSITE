const mongoose = require('mongoose');

const CompletedTaskSchema = new mongoose.Schema({
  taskIndex: { type: Number, required: true },
  photoPath: { type: String, required: true },
  completedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNo: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  farmSize: String,
  location: String,
  currentTaskIndex: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  tasksCompleted: [CompletedTaskSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
