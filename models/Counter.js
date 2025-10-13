const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to get next sequence
counterSchema.statics.getNextSequence = async function(counterName) {
  const counter = await this.findByIdAndUpdate(
    counterName,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

module.exports = mongoose.model('Counter', counterSchema);

