const mongoose = require('mongoose');

const PYQSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  uploaderComment: String,
  instructorName: String,
  subject: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    enum: ['Mid-sem', 'End-sem'],
    required: true
  },
  semester: {
    type: String,
    enum: ['Monsoon', 'Winter'],
    required: true
  },
  academicYear: String,
  year: String,
  versions: [{
    url: String,
    filename: String,
    comment: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  ratings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    username: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  ratingAverage: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  weeklyDownloads: {
    type: Number,
    default: 0
  },
  aiSummary: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Create text index for search
PYQSchema.index({ title: 'text', uploaderComment: 'text', instructorName: 'text' });

module.exports = mongoose.model('PYQ', PYQSchema);
