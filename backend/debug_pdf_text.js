const { extractTextFromPdf } = require('./utils/pdfParser');
const path = require('path');

async function main() {
  // Foundation quiz files
  const quizPath = path.join(__dirname, 'uploads', 'file-1782303711387-201792862.pdf');
  const solPath = path.join(__dirname, 'uploads', 'solutionFile-1782303711388-517525029.pdf');
  
  try {
    const quizText = await extractTextFromPdf(quizPath);
    console.log('=== QUIZ TEXT ===');
    console.log(quizText);
    console.log('=================');
    console.log('Length:', quizText.length);
  } catch(e) {
    console.error('Quiz PDF error:', e.message);
  }

  try {
    const solText = await extractTextFromPdf(solPath);
    console.log('=== SOLUTION TEXT ===');
    console.log(solText);
    console.log('====================');
    console.log('Length:', solText.length);
  } catch(e) {
    console.error('Solution PDF error:', e.message);
  }
}

main();
