const fs = require('fs');
const pdfParse = require('pdf-parse');

const extractTextFromPdf = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    // Return extracted text string
    return data.text || '';
  } catch (error) {
    console.error(`[PDF Parsing Error]: ${error.message}`);
    throw new Error('Failed to parse PDF document text.');
  }
};

module.exports = { extractTextFromPdf };
