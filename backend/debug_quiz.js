const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campushive';
console.log('Connecting to:', uri);

mongoose.connect(uri).then(async () => {
  const Quiz = require('./models/Quiz');
  const quizzes = await Quiz.find({}).select('title subject quizPdfUrl solutionPdfUrl mcqs');
  
  console.log('Found', quizzes.length, 'quizzes');
  
  quizzes.forEach(q => {
    console.log('---');
    console.log('Title:', q.title);
    console.log('Subject:', q.subject);
    console.log('QuizPDF:', q.quizPdfUrl);
    console.log('SolutionPDF:', q.solutionPdfUrl);
    console.log('MCQs count:', q.mcqs ? q.mcqs.length : 0);
    if (q.mcqs && q.mcqs.length > 0) {
      q.mcqs.forEach((m, i) => {
        console.log('  Q' + (i+1) + ': ' + (m.question || '').substring(0, 120));
        console.log('    correct: ' + m.correct + ' | options: ' + JSON.stringify(m.options));
      });
    }
  });
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
