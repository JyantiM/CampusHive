const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  branch: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  karmaScore: {
    type: Number,
    default: 10
  },
  followedSubjects: [{
    type: String
  }],
  uploads: [{
    type: {
      type: String,
      enum: ['note', 'pyq', 'quiz']
    },
    refId: mongoose.Schema.Types.ObjectId,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  downloads: [{
    type: {
      type: String,
      enum: ['note', 'pyq']
    },
    refId: mongoose.Schema.Types.ObjectId,
    downloadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  quizAttempts: [{
    quizId: mongoose.Schema.Types.ObjectId,
    quizTitle: String,
    subject: String,
    score: Number,
    total: Number,
    attemptedAt: {
      type: Date,
      default: Date.now
    },
    answers: [{
      questionIndex: Number,
      selectedOption: String,
      correct: String
    }]
  }],
  bookmarks: [{
    type: {
      type: String,
      enum: ['note', 'pyq', 'quiz']
    },
    refId: mongoose.Schema.Types.ObjectId,
    savedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Check text index for user names search if needed
UserSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('User', UserSchema);
