const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['download', 'upload', 'attempt', 'rate', 'bookmark', 'follow', 'doubt', 'system'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Auto-cleanup hook: Keep only the 10 most recent logs per user
ActivitySchema.post('save', async function() {
  const Activity = this.constructor;
  
  // Find the 10 most recent activities for this specific user
  const recentActivities = await Activity.find({ userId: this.userId })
    .sort({ createdAt: -1 })
    .select('_id')
    .limit(10);
    
  // If there are exactly 10, delete any older ones that aren't in this top 10 list
  if (recentActivities.length === 10) {
    const keepIds = recentActivities.map(act => act._id);
    await Activity.deleteMany({
      userId: this.userId,
      _id: { $nin: keepIds }
    });
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);
