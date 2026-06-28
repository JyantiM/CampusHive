const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  question: {
    type: String,
    required: true
  },
  askedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    default: 'Anonymous Student'
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  answers: [{
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Doubt', DoubtSchema);
