const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');

mongoose.connect('mongodb://localhost:27017/campushive')
  .then(async () => {
    // Clear any quiz that has a stale offline-generated summary
    const result = await Quiz.updateMany(
      { aiSummary: { $regex: /^\[Offline/ } },
      { $set: { aiSummary: '' } }
    );
    console.log('Cleared stale quiz summaries from DB. Modified count:', result.modifiedCount);
    mongoose.disconnect();
  })
  .catch(e => {
    console.error('DB error:', e.message);
    process.exit(1);
  });
