const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  uploaderName: String,
  uploaderComment: String,
  instructorName: String,
  subject: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    enum: ['Monsoon', 'Winter'],
    required: true
  },
  academicYear: String,
  year: String,
  quizPdfUrl: {
    type: String,
    required: true
  },
  solutionPdfUrl: {
    type: String,
    required: true
  },
  mcqs: [{
    question: {
      type: String,
      required: true
    },
    options: [{
      type: String,
      required: true
    }],
    correct: {
      type: String,
      required: true,
      enum: ['A', 'B', 'C', 'D']
    }
  }],
  attemptCount: {
    type: Number,
    default: 0
  },
  weeklyAttempts: {
    type: Number,
    default: 0
  },
  aiSummary: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Create text index for search
QuizSchema.index({ title: 'text', uploaderComment: 'text', instructorName: 'text' });

module.exports = mongoose.model('Quiz', QuizSchema);
