const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Note = require('./models/Note');
const PYQ = require('./models/PYQ');
const Quiz = require('./models/Quiz');
const Doubt = require('./models/Doubt');
const Activity = require('./models/Activity');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campushive');
    console.log('Seed: MongoDB connected.');

    // Clear existing collections
    await User.deleteMany({});
    await Note.deleteMany({});
    await PYQ.deleteMany({});
    await Quiz.deleteMany({});
    await Doubt.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    console.log('Seed: Cleared old collections.');

    // 1. Create default seed users
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    const senior = await User.create({
      name: 'Amit Sharma',
      email: 'amit.s@university.ac.in',
      branch: 'Computer Science and Engineering (CSE)',
      year: '4th Year',
      password: defaultPassword,
      karmaScore: 50,
      followedSubjects: ['DBMS', 'Operating Systems']
    });

    const student = await User.create({
      name: 'Jyanti Kumar',
      email: 'jyanti.k@university.ac.in',
      branch: 'Computer Science and Engineering (CSE)',
      year: '3rd Year',
      password: defaultPassword,
      karmaScore: 340,
      followedSubjects: ['DBMS', 'Operating Systems', 'Computer Networks']
    });

    console.log('Seed: Created Users.');

    // 2. Create seed Notes
    const note1 = await Note.create({
      title: 'Database Management Systems - Normalization Complete Guide',
      uploaderName: senior.name,
      uploaderComment: 'Detailed notes on 1NF, 2NF, 3NF, BCNF with solved gate questions.',
      instructorName: 'Dr. R. K. Prasad',
      subject: 'DBMS',
      branch: 'Computer Science and Engineering (CSE)',
      year: '2nd Year',
      semester: 'Monsoon',
      academicYear: '2024-2025',
      ratingAverage: 4.8,
      downloadCount: 142,
      weeklyDownloads: 25,
      versions: [{ url: 'http://localhost:5000/uploads/dbms_notes_v1.pdf', filename: 'dbms_notes.pdf', comment: 'Added BCNF examples', uploadedBy: senior._id }],
      ratings: [{ userId: student._id, rating: 5, comment: 'Saves a lot of time before exams!', username: student.name }]
    });

    const note2 = await Note.create({
      title: 'Operating Systems - Process Synchronization & Semaphores',
      uploaderName: senior.name,
      uploaderComment: 'Handwritten notes focusing on Producer-Consumer and Reader-Writer problems.',
      instructorName: 'Prof. Sandeep Sen',
      subject: 'Operating Systems',
      branch: 'Computer Science and Engineering (CSE)',
      year: '3rd Year',
      semester: 'Winter',
      academicYear: '2024-2025',
      ratingAverage: 4.5,
      downloadCount: 88,
      weeklyDownloads: 12,
      versions: [{ url: 'http://localhost:5000/uploads/os_notes_v1.pdf', filename: 'os_notes.pdf', comment: 'Original upload', uploadedBy: senior._id }]
    });

    console.log('Seed: Created Notes.');

    // 3. Create seed PYQs
    const pyq1 = await PYQ.create({
      title: 'DBMS End-Semester Exam Paper Nov 2024',
      uploaderComment: 'Standard 3-hour paper. Question 3 was tricky.',
      instructorName: 'Dr. R. K. Prasad',
      subject: 'DBMS',
      examType: 'End-sem',
      semester: 'Monsoon',
      academicYear: '2024-2025',
      downloadCount: 310,
      weeklyDownloads: 50,
      versions: [{ url: 'http://localhost:5000/uploads/dbms_pyq_2024.pdf', filename: 'dbms_pyq_2024.pdf', comment: 'Scanned copy', uploadedBy: senior._id }]
    });

    console.log('Seed: Created PYQs.');

    // 4. Create seed Quizzes
    const quiz1 = await Quiz.create({
      title: 'DBMS Normalization & Relational Algebra MCQ Challenge',
      uploaderName: senior.name,
      uploaderComment: 'Test your understanding of dependency preservation and lossless joins.',
      instructorName: 'Dr. R. K. Prasad',
      subject: 'DBMS',
      semester: 'Monsoon',
      academicYear: '2024-2025',
      attemptCount: 156,
      weeklyAttempts: 32,
      quizPdfUrl: 'http://localhost:5000/uploads/dbms_quiz.pdf',
      solutionPdfUrl: 'http://localhost:5000/uploads/dbms_quiz_solutions.pdf',
      mcqs: [
        {
          question: 'If a relation schema R is in BCNF, then which of the following functional dependencies is TRUE?',
          options: [
            'R is also in 3NF, and all key attributes are prime.',
            'For every non-trivial functional dependency X -> Y, X must be a superkey.',
            'R may contain transitive dependencies.',
            'None of the above.'
          ],
          correct: 'B'
        },
        {
          question: 'A relation R(A, B, C, D) has functional dependencies AB -> C, C -> D, and D -> A. What is the candidate key for R?',
          options: [
            'AB only',
            'AB, BC',
            'AB, C, D',
            'AB, CB, DB'
          ],
          correct: 'D'
        }
      ]
    });

    console.log('Seed: Created Quizzes.');

    // 5. Create seed Doubts
    await Doubt.create({
      subject: 'DBMS',
      question: 'How do we check if a decomposition is dependency-preserving when there are circular dependencies?',
      askedBy: student._id,
      username: student.name,
      anonymous: false,
      answers: [
        {
          answeredBy: senior._id,
          username: senior.name,
          text: 'You need to compute the closure of each functional dependency in the original set under the union of projection sets. If all FDs can be inferred, it is dependency preserving.',
        }
      ]
    });

    console.log('Seed: Created Doubts.');

    // Link uploads to senior user
    senior.uploads = [
      { type: 'note', refId: note1._id },
      { type: 'note', refId: note2._id },
      { type: 'pyq', refId: pyq1._id },
      { type: 'quiz', refId: quiz1._id }
    ];
    await senior.save();

    console.log('Database seeded successfully.');
    process.exit();
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
