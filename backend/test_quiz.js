const path = require('path');
const { extractTextFromPdf } = require('./utils/pdfParser');
const { parseQuizMcqs } = require('./utils/aiHelper');
const fs = require('fs');

async function testQuiz() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir);
  
  // Find quizzes and their solutions
  // Usually file-XXXX.pdf and solutionFile-XXXX.pdf
  const quizzes = files.filter(f => f.startsWith('file-'));
  const solutions = files.filter(f => f.startsWith('solutionFile-'));
  
  // Let's just try parsing each quiz with every solution or just try parsing the most recent quiz & solution.
  // We can group them by timestamp if they are related
  // file-1782302391387-169006652.pdf
  // solutionFile-1782302391387-184298393.pdf
  
  for (const sol of solutions) {
    const timestamp = sol.split('-')[1];
    const quizFile = quizzes.find(f => f.includes(timestamp));
    if (quizFile) {
      console.log(`\nTesting Quiz: ${quizFile} with Solution: ${sol}`);
      try {
        const quizText = await extractTextFromPdf(path.join(uploadsDir, quizFile));
        const solText = await extractTextFromPdf(path.join(uploadsDir, sol));
        const mcqs = await parseQuizMcqs(quizText, solText);
        console.log(`Parsed ${mcqs.length} MCQs`);
        for (let i=0; i<Math.min(2, mcqs.length); i++) {
          console.log(`Q: ${mcqs[i].question}`);
          console.log(`Options: ${mcqs[i].options.join(', ')}`);
          console.log(`Correct: ${mcqs[i].correct}`);
        }
      } catch(e) {
        console.log("Error:", e.message);
      }
    }
  }
}
testQuiz();
