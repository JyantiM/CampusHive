const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
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
  branch: {
    type: String,
    required: true
  },
  year: String,
  semester: {
    type: String,
    enum: ['Monsoon', 'Winter']
  },
  academicYear: String,
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

// Create a compound text index on title, uploader comment and instructor name for rich search results.
NoteSchema.index({ title: 'text', uploaderComment: 'text', instructorName: 'text' });

module.exports = mongoose.model('Note', NoteSchema);
