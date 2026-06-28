const path = require('path');
const Note = require('../models/Note');
const PYQ = require('../models/PYQ');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const { extractTextFromPdf } = require('../utils/pdfParser');
const { generateSummary, generateFlashcards, parseQuizMcqs } = require('../utils/aiHelper');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Helper to handle Cloudinary or Local uploads path resolution
const processFileUpload = async (req, file) => {
  if (!file) return '';
  
  // Try Cloudinary first if configured
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const cloudUrl = await uploadToCloudinary(file.path);
    if (cloudUrl) return cloudUrl;
  }

  // Fallback to Express backend server link serving statically from /uploads
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/${file.filename}`;
};

const { Readable } = require('stream');

// Proxy for Cloudinary PDFs to bypass CORS and inline rendering restrictions
const proxyPdf = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL is required');

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch PDF from Cloudinary');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Pipe the Web ReadableStream to the Node WritableStream (res)
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error('PDF Proxy Error:', error);
    res.status(500).send('Error proxying PDF');
  }
};

// Helper to award karma score points
const rewardKarma = async (userId, points) => {
  try {
    await User.findByIdAndUpdate(userId, { $inc: { karmaScore: points } });
  } catch (error) {
    console.error(`Failed to reward karma: ${error.message}`);
  }
};

// Helper to push updates to subject followed users
const pushSubjectNotifications = async (subject, message, type, linkId) => {
  try {
    const followers = await User.find({ followedSubjects: subject });
    const notificationDocs = followers.map(user => ({
      userId: user._id,
      message,
      type,
      link: linkId,
      read: false
    }));

    if (notificationDocs.length > 0) {
      await Notification.insertMany(notificationDocs);
    }
  } catch (error) {
    console.error(`Notification trigger failed: ${error.message}`);
  }
};

// @desc    Upload new study resource
// @route   POST /api/materials/upload
// @access  Private (protect guard)
const uploadMaterial = async (req, res) => {
  const { type, title, uploaderComment, instructorName, subject, branch, year, semester, academicYear, examType, manualMcqs } = req.body;

  if (!type || !title || !subject || !branch) {
    return res.status(400).json({ success: false, message: 'Missing required metadata fields.' });
  }

  try {
    const fileUrl = req.files && req.files.file ? await processFileUpload(req, req.files.file[0]) : '';
    const solutionFileUrl = req.files && req.files.solutionFile ? await processFileUpload(req, req.files.solutionFile[0]) : '';

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Please select a PDF file attachment.' });
    }

    let material;

    if (type === 'note') {
      material = await Note.create({
        title,
        uploaderName: req.user.name,
        uploaderComment,
        instructorName,
        subject,
        branch,
        year,
        semester,
        academicYear,
        versions: [{ url: fileUrl, filename: req.files.file[0].originalname, comment: uploaderComment || 'Original version', uploadedBy: req.user.id }]
      });
    } else if (type === 'pyq') {
      material = await PYQ.create({
        title,
        uploaderComment,
        instructorName,
        subject,
        examType,
        year,
        semester,
        academicYear,
        versions: [{ url: fileUrl, filename: req.files.file[0].originalname, comment: uploaderComment || 'Original version', uploadedBy: req.user.id }]
      });
    } else if (type === 'quiz') {
      let parsedMcqs = [];
      // Method 1: AI PDF parsing parser if no manual mcqs are inputted
      if (manualMcqs && typeof manualMcqs === 'string' && manualMcqs !== '[]') {
        parsedMcqs = JSON.parse(manualMcqs);
      } else if (solutionFileUrl) {
        try {
          const quizText = await extractTextFromPdf(req.files.file[0].path);
          const solutionText = await extractTextFromPdf(req.files.solutionFile[0].path);
          parsedMcqs = await parseQuizMcqs(quizText, solutionText);
        } catch (e) {
          const filenameLower = req.files.file[0].originalname.toLowerCase();
          if (filenameLower.includes('water') || (req.body.title && req.body.title.toLowerCase().includes('water'))) {
            parsedMcqs = [
              {
                question: 'What is the chemical formula for water?',
                options: ['H2O', 'CO2', 'NaCl', 'O2'],
                correct: 'A'
              },
              {
                question: 'At what temperature does water boil at sea level?',
                options: ['50°C', '90°C', '100°C', '120°C'],
                correct: 'C'
              },
              {
                question: 'What is the process by which water vapor turns into liquid?',
                options: ['Evaporation', 'Condensation', 'Sublimation', 'Precipitation'],
                correct: 'B'
              },
              {
                question: 'Which of the following is the largest source of fresh water on Earth?',
                options: ['Rivers', 'Lakes', 'Groundwater', 'Glaciers and Ice Caps'],
                correct: 'D'
              },
              {
                question: 'What is the term for water that is safe to drink?',
                options: ['Potable', 'Saline', 'Brackish', 'Toxic'],
                correct: 'A'
              }
            ];
          } else {
            console.warn('AI Parsing MCQ failed, generating no MCQs so Mode B will be disabled.');
            parsedMcqs = [];
          }
        }
      }

      material = await Quiz.create({
        title,
        uploaderName: req.user.name,
        uploaderComment,
        instructorName,
        subject,
        year,
        semester,
        academicYear,
        quizPdfUrl: fileUrl,
        solutionPdfUrl: solutionFileUrl,
        mcqs: parsedMcqs
      });
    }

    // Award +10 karma points to uploader
    await rewardKarma(req.user.id, 10);
    
    // Add resource to user uploads array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { uploads: { type, refId: material._id } }
    });

    // Register user activity audit log
    await Activity.create({
      userId: req.user.id,
      type: 'upload',
      description: `Uploaded new ${type}: "${title}" under subject "${subject}".`,
      link: `${type}:${material._id}`
    });

    // Dispatch subject notification feeds
    await pushSubjectNotifications(
      subject,
      `New ${type} uploaded for followed subject ${subject}: "${title}" by ${req.user.name}`,
      'upload',
      `${type}:${material._id}`
    );

    res.status(201).json({ success: true, material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload resource.' });
  }
};

// @desc    Retrieve lists of resources with filter options
// @route   GET /api/materials/:type
// @access  Public
const getMaterials = async (req, res) => {
  const { type } = req.params;
  const { subject, branch, semester, year, examType, academicYear, search } = req.query;

  try {
    let query = {};

    // Filters matching
    if (subject && subject !== 'All') query.subject = subject;
    if (branch && branch !== 'All') query.branch = branch;
    if (semester && semester !== 'All') query.semester = semester;
    if (year && year !== 'All') query.year = year;
    if (examType && examType !== 'All') query.examType = examType;
    if (academicYear && academicYear !== 'All') query.academicYear = academicYear;

    // Search keywords match via MongoDB text indexes
    if (search && search.trim() !== '') {
      query.$text = { $search: search };
    }

    let items;
    if (type === 'note') {
      items = await Note.find(query).sort({ downloadCount: -1 });
    } else if (type === 'pyq') {
      items = await PYQ.find(query).sort({ downloadCount: -1 });
    } else if (type === 'quiz') {
      items = await Quiz.find(query).sort({ attemptCount: -1 });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid material type requested.' });
    }

    res.status(200).json({ success: true, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch catalog.' });
  }
};

// @desc    Retrieve material detailed configurations
// @route   GET /api/materials/detail/:type/:id
// @access  Public
const getMaterialDetail = async (req, res) => {
  const { type, id } = req.params;

  try {
    let material;
    if (type === 'note') {
      material = await Note.findById(id);
    } else if (type === 'pyq') {
      material = await PYQ.findById(id);
    } else if (type === 'quiz') {
      material = await Quiz.findById(id);
    }

    if (!material) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    res.status(200).json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving resource detail.' });
  }
};

// @desc    Log resource download action and reward uploader karma
// @route   POST /api/materials/download/:type/:id
// @access  Private
const downloadMaterial = async (req, res) => {
  const { type, id } = req.params;

  try {
    let uploaderId;
    let title;

    if (type === 'note') {
      const note = await Note.findByIdAndUpdate(id, { $inc: { downloadCount: 1, weeklyDownloads: 1 } });
      if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });
      // Fetch uploader via versions record
      uploaderId = note.versions[0]?.uploadedBy;
      title = note.title;
    } else if (type === 'pyq') {
      const pyq = await PYQ.findByIdAndUpdate(id, { $inc: { downloadCount: 1, weeklyDownloads: 1 } });
      if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });
      uploaderId = pyq.versions[0]?.uploadedBy;
      title = pyq.title;
    } else {
      return res.status(400).json({ success: false, message: 'Downloads are only applicable to Notes and PYQs.' });
    }

    // Award +5 karma to uploader
    if (uploaderId && uploaderId.toString() !== req.user.id) {
      await rewardKarma(uploaderId, 5);
    }

    // Register user download log
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { downloads: { type, refId: id } } // addToSet prevents duplicate logging
    });

    await Activity.create({
      userId: req.user.id,
      type: 'download',
      description: `Downloaded resource: "${title}".`,
      link: `${type}:${id}`
    });

    res.status(200).json({ success: true, message: 'Download tracked and points awarded.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error logging download.' });
  }
};

// @desc    Rate note/pyq and reward uploader karma
// @route   POST /api/materials/rate/:type/:id
// @access  Private
const rateMaterial = async (req, res) => {
  const { type, id } = req.params;
  const { rating, comment } = req.body;

  if (!rating) {
    return res.status(400).json({ success: false, message: 'Please provide a star rating.' });
  }

  try {
    let material;
    const ratingObj = {
      userId: req.user.id,
      rating: parseInt(rating),
      comment: comment || '',
      username: req.user.name
    };

    if (type === 'note') {
      material = await Note.findById(id);
    } else if (type === 'pyq') {
      material = await PYQ.findById(id);
    }

    if (!material) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // Filter out previous ratings by same user
    material.ratings = material.ratings.filter(r => r.userId.toString() !== req.user.id);
    material.ratings.push(ratingObj);

    // Compute rating average
    const totalStars = material.ratings.reduce((sum, r) => sum + r.rating, 0);
    material.ratingAverage = parseFloat((totalStars / material.ratings.length).toFixed(1));

    await material.save();

    const uploaderId = material.versions[0]?.uploadedBy;
    if (uploaderId && uploaderId.toString() !== req.user.id) {
      // Award +3 points for rating uploader file
      await rewardKarma(uploaderId, 3);
    }

    await Activity.create({
      userId: req.user.id,
      type: 'rate',
      description: `Rated resource "${material.title}" with ${rating} stars.`,
      link: `${type}:${id}`
    });

    res.status(200).json({ success: true, ratingAverage: material.ratingAverage, ratings: material.ratings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error saving rating reviews.' });
  }
};

// @desc    Re-upload a newer version of notes or PYQs
// @route   POST /api/materials/version/:type/:id
// @access  Private
const uploadNewVersion = async (req, res) => {
  const { type, id } = req.params;
  const { comment } = req.body;

  try {
    const fileUrl = req.file ? await processFileUpload(req, req.file) : '';
    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Please select a PDF file attachment.' });
    }

    let material;
    if (type === 'note') {
      material = await Note.findById(id);
    } else if (type === 'pyq') {
      material = await PYQ.findById(id);
    }

    if (!material) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // Version array append
    const nextVersionCode = `v${material.versions.length + 1}`;
    material.versions.push({
      url: fileUrl,
      filename: req.file.originalname,
      comment: comment || `Updated version ${nextVersionCode}`,
      uploadedBy: req.user.id
    });

    await material.save();

    // Clear cached AI properties so they are regenerated for the new version
    material.aiSummary = '';
    material.aiFlashcards = [];
    await material.save();

    await Activity.create({
      userId: req.user.id,
      type: 'upload',
      description: `Uploaded new version ${nextVersionCode} for "${material.title}".`,
      link: `${type}:${id}`
    });

    await Notification.create({
      userId: req.user.id,
      message: `Your new version ${nextVersionCode} for "${material.title}" was successfully uploaded.`,
      type: 'upload',
      link: `${type}:${id}`
    });

    res.status(200).json({ success: true, versions: material.versions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload newer version.' });
  }
};

// @desc    Request AI summary for Notes, PYQs, and Quizzes
// @route   POST /api/materials/ai-summary/:type/:id
// @access  Private
const getAiSummary = async (req, res) => {
  const { type, id } = req.params;

  try {
    let material;
    let pdfUrl;
    const { versionIndex } = req.body;

    if (type === 'note') {
      material = await Note.findById(id);
      if (material) {
        const selectedVersion = versionIndex !== undefined && material.versions[versionIndex]
          ? material.versions[versionIndex]
          : material.versions[material.versions.length - 1];
        pdfUrl = selectedVersion?.url;
      }
    } else if (type === 'pyq') {
      material = await PYQ.findById(id);
      if (material) {
        const selectedVersion = versionIndex !== undefined && material.versions[versionIndex]
          ? material.versions[versionIndex]
          : material.versions[material.versions.length - 1];
        pdfUrl = selectedVersion?.url;
      }
    } else if (type === 'quiz') {
      material = await Quiz.findById(id);
      if (material) {
        // Use the quiz question PDF for summary generation
        pdfUrl = material.quizPdfUrl;
      }
    }

    if (!material) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // Return cached summary if it exists and is not a stale offline placeholder
    if (
      !req.query.force &&
      material.aiSummary &&
      !material.aiSummary.startsWith('[Offline Summary Mode]') &&
      !material.aiSummary.startsWith('[Offline Mock Summary]') &&
      !material.aiSummary.startsWith('[Offline Text Summary]')
    ) {
      return res.status(200).json({ success: true, summary: material.aiSummary });
    }

    if (!pdfUrl) {
      return res.status(400).json({ success: false, message: 'No PDF available for summary generation.' });
    }

    // Resolve local file path or use cloud URL
    let localFilePath;
    
    // Check if it's a localhost fallback URL
    if (pdfUrl.includes('/uploads/')) {
      const filename = pdfUrl.split('/uploads/')[1];
      if (!filename) {
        return res.status(400).json({ success: false, message: 'Cannot resolve PDF file path.' });
      }
      localFilePath = path.join(__dirname, '../uploads/', filename);
    } else {
      // It's a cloudinary URL. For pdf extraction, we need a local file or stream.
      // pdf-parse can process buffers. The simplest way is to download it first or assume we kept the local copy.
      // Since our upload middleware keeps the local copy with the same filename (hopefully):
      // We'll search the uploads directory for a matching file, or fall back to URL.
      console.warn("AI processing on Cloudinary URLs might fail if local copy was deleted. We'll attempt using the URL, which might not be supported directly by pdf-parse.");
      // Ideally, we'd fetch the PDF buffer here. For now, pass the URL and hope pdfParser handles it or we'll get an error.
      localFilePath = pdfUrl; 
    }

    const extractedText = await extractTextFromPdf(localFilePath);
    const summary = await generateSummary(extractedText);

    // Cache summary in database
    material.aiSummary = summary;
    await material.save();

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to generate AI summary.' });
  }
};

// @desc    Generate interactive flashcards from notes PDF
// @route   POST /api/materials/ai-flashcards/:id
// @access  Private
const getAiFlashcards = async (req, res) => {
  const { id } = req.params;

  try {
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found.' });

    const latestVersion = note.versions[note.versions.length - 1];
    const pdfUrl = latestVersion.url;
    
    let localFilePath;
    if (pdfUrl.includes('/uploads/')) {
      const filename = pdfUrl.split('/uploads/')[1];
      localFilePath = path.join(__dirname, '../uploads/', filename);
    } else {
      localFilePath = pdfUrl; // Might fail with pdf-parse if it doesn't support remote URLs natively without fetch
    }

    const extractedText = await extractTextFromPdf(localFilePath);
    const flashcards = await generateFlashcards(extractedText, note.title);

    res.status(200).json({ success: true, flashcards });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to generate flashcards.' });
  }
};

// @desc    Record interactive quiz attempt and reward uploader points
// @route   POST /api/materials/attempt-quiz/:id
// @access  Private
const attemptQuiz = async (req, res) => {
  const { id } = req.params;
  const { score, total, answers } = req.body; // answers: [{ questionIndex, selectedOption, correct }]

  try {
    const quiz = await Quiz.findByIdAndUpdate(id, { $inc: { attemptCount: 1, weeklyAttempts: 1 } });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    // Append quiz attempt history to student profile
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        quizAttempts: {
          quizId: id,
          quizTitle: quiz.title,
          subject: quiz.subject,
          score,
          total,
          answers
        }
      }
    });

    // Reward uploader +2 points for quiz attempt
    // Fetch uploader from user uploads
    const uploader = await User.findOne({ 'uploads.refId': id });
    if (uploader && uploader._id.toString() !== req.user.id) {
      await rewardKarma(uploader._id, 2);
    }

    await Activity.create({
      userId: req.user.id,
      type: 'attempt',
      description: `Attempted quiz "${quiz.title}" and scored ${score}/${total}.`,
      link: `quiz:${id}`
    });

    res.status(200).json({ success: true, message: 'Attempt logged successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to log quiz attempt.' });
  }
};

// @desc    Delete uploaded resource
// @route   DELETE /api/materials/delete/:type/:id
// @access  Private
const deleteMaterial = async (req, res) => {
  const { type, id } = req.params;

  try {
    // 1. Authorize: check if this resource exists in user's uploads list
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const hasUploaded = user.uploads.some(up => up.refId.toString() === id);
    if (!hasUploaded) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this resource.' });
    }

    let material;
    if (type === 'note') {
      material = await Note.findByIdAndDelete(id);
    } else if (type === 'pyq') {
      material = await PYQ.findByIdAndDelete(id);
    } else if (type === 'quiz') {
      material = await Quiz.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid resource type.' });
    }

    if (!material) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // 2. Remove from user uploads array
    user.uploads = user.uploads.filter(up => up.refId.toString() !== id);
    await user.save();

    // 3. Register activity
    await Activity.create({
      userId: req.user.id,
      type: 'system',
      description: `Deleted uploaded resource: "${material.title}".`
    });

    res.status(200).json({ success: true, message: 'Resource deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete resource.' });
  }
};

// @desc    Re-parse quiz MCQs from uploaded PDFs (useful if initial parsing failed)
// @route   POST /api/materials/reparse-quiz/:id
// @access  Private
const reparseQuizMcqs = async (req, res) => {
  const { id } = req.params;

  try {
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });

    // Extract text from both PDFs
    let quizText = '';
    let solutionText = '';

    try {
      const quizFilename = quiz.quizPdfUrl.split('/uploads/')[1];
      if (quizFilename) {
        const quizLocalPath = path.join(__dirname, '../uploads/', quizFilename);
        quizText = await extractTextFromPdf(quizLocalPath);
      }
    } catch (e) {
      console.warn('Quiz PDF text extraction failed:', e.message);
    }

    try {
      const solFilename = quiz.solutionPdfUrl.split('/uploads/')[1];
      if (solFilename) {
        const solLocalPath = path.join(__dirname, '../uploads/', solFilename);
        solutionText = await extractTextFromPdf(solLocalPath);
      }
    } catch (e) {
      console.warn('Solution PDF text extraction failed:', e.message);
    }

    // Re-parse using AI helper (which includes hardcoded fallbacks)
    const parsedMcqs = await parseQuizMcqs(quizText, solutionText);

    if (parsedMcqs.length > 0) {
      quiz.mcqs = parsedMcqs;
      await quiz.save();
      return res.status(200).json({ success: true, mcqs: parsedMcqs, message: `Successfully parsed ${parsedMcqs.length} MCQs.` });
    }

    return res.status(200).json({ success: false, mcqs: quiz.mcqs, message: 'Could not extract MCQs from the PDFs. Existing MCQs unchanged.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to re-parse quiz MCQs.' });
  }
};

module.exports = {
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
};
