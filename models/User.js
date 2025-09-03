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
  currentTaskIndexWheat: { type: Number, default: 0 },
  currentTaskIndexRice: { type: Number, default: 0 },
  currentTaskIndexCorn: { type: Number, default: 0 },
  currentTaskIndexBajra: { type: Number, default: 0 },
  pointsWheat: { type: Number, default: 0 },
  pointsRice: { type: Number, default: 0 },
  pointsCorn: { type: Number, default: 0 },
  pointsBajra: { type: Number, default: 0 },
  tasksCompletedWheat: [CompletedTaskSchema],
  tasksCompletedRice: [CompletedTaskSchema],
  tasksCompletedCorn: [CompletedTaskSchema],
  tasksCompletedBajra: [CompletedTaskSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
