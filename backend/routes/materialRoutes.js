const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadMaterial,
  getMaterials,
  getMaterialDetail,
  downloadMaterial,
  rateMaterial,
  uploadNewVersion,
  getAiSummary,
  getAiFlashcards,
  attemptQuiz,
  deleteMaterial,
  reparseQuizMcqs,
  proxyPdf
} = require('../controllers/materialController');

// Multer multi-files field parser
const multiUpload = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'solutionFile', maxCount: 1 }
]);

router.get('/proxy', proxyPdf);
router.post('/upload', protect, multiUpload, uploadMaterial);
router.get('/:type', getMaterials);
router.get('/detail/:type/:id', getMaterialDetail);
router.post('/download/:type/:id', protect, downloadMaterial);
router.post('/rate/:type/:id', protect, rateMaterial);
router.post('/version/:type/:id', protect, upload.single('file'), uploadNewVersion);
router.post('/ai-summary/:type/:id', protect, getAiSummary);
router.post('/ai-flashcards/:id', protect, getAiFlashcards);
router.post('/attempt-quiz/:id', protect, attemptQuiz);
router.post('/reparse-quiz/:id', protect, reparseQuizMcqs);
router.delete('/delete/:type/:id', protect, deleteMaterial);

module.exports = router;
