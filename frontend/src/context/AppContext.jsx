import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const AppContext = createContext();

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS = {
  get: (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} }
};

// ─── ID normalisation helper ──────────────────────────────────────────────────
const normaliseItems = (items) =>
  (items || []).map(item => ({ ...item, id: String(item._id || item.id) }));

// ─── Default subjects seed ────────────────────────────────────────────────────
const DEFAULT_SUBJECTS = [
  'DBMS', 'Operating Systems', 'Computer Networks',
  'Data Structures', 'Algorithms', 'Mathematics', 'Physics'
];

export const AppProvider = ({ children }) => {
  const branchesList = [
    'Computer Science and Engineering (CSE)',
    'Mathematics and Computing (MnC)',
    'Electronics and Communication Engineering (ECE)',
    'Electrical Engineering (EE)',
    'Mechanical Engineering (ME)',
    'Chemical Engineering (CHE)',
    'Civil Engineering (CE)',
    'Engineering Physics (EP)',
    'Environmental Engineering (EnvE)',
    'Mineral & Metallurgical Engineering (MME)',
    'Mining Engineering',
    'Mining Machinery Engineering (MME)',
    'Petroleum Engineering',
    'Integrated M.Tech in Applied Geology',
    'Integrated M.Tech in Applied Geophysics',
    'Integrated M.Tech in Mathematics & Computing'
  ];

  // ── Load initial state from localStorage so refresh doesn't wipe data ──────
  const [subjects, setSubjects]         = useState(() => LS.get('ch_subjects', DEFAULT_SUBJECTS));
  const [currentUser, setCurrentUser]   = useState(() => LS.get('ch_user', null));
  const [notes, setNotes]               = useState(() => LS.get('ch_notes', []));
  const [pyqs, setPyqs]                 = useState(() => LS.get('ch_pyqs', []));
  const [quizzes, setQuizzes]           = useState(() => LS.get('ch_quizzes', []));
  const [bookmarks, setBookmarks]       = useState(() => LS.get('ch_bookmarks', []));
  const [downloads, setDownloads]       = useState(() => LS.get('ch_downloads', []));
  const [quizAttempts, setQuizAttempts] = useState(() => LS.get('ch_attempts', []));
  const [activities, setActivities]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [doubts, setDoubts]             = useState([]);

  // ── Persist to localStorage on every state change ─────────────────────────
  useEffect(() => { LS.set('ch_subjects', subjects); }, [subjects]);
  useEffect(() => { currentUser ? LS.set('ch_user', currentUser) : LS.remove('ch_user'); }, [currentUser]);
  useEffect(() => { LS.set('ch_notes', notes); }, [notes]);
  useEffect(() => { LS.set('ch_pyqs', pyqs); }, [pyqs]);
  useEffect(() => { LS.set('ch_quizzes', quizzes); }, [quizzes]);
  useEffect(() => { LS.set('ch_bookmarks', bookmarks); }, [bookmarks]);
  useEffect(() => { LS.set('ch_downloads', downloads); }, [downloads]);
  useEffect(() => { LS.set('ch_attempts', quizAttempts); }, [quizAttempts]);

  // ── Fetch catalog from backend (merges with any local items already there) ─
  const refreshCatalog = useCallback(async () => {
    try {
      const [resNotes, resPyqs, resQuizzes] = await Promise.all([
        api.get('/materials/note'),
        api.get('/materials/pyq'),
        api.get('/materials/quiz')
      ]);

      if (resNotes.data.success)   setNotes(normaliseItems(resNotes.data.items));
      if (resPyqs.data.success)    setPyqs(normaliseItems(resPyqs.data.items));
      if (resQuizzes.data.success) setQuizzes(normaliseItems(resQuizzes.data.items));

      // Merge backend subjects into subject list
      const allItems = [
        ...(resNotes.data.items   || []),
        ...(resPyqs.data.items    || []),
        ...(resQuizzes.data.items || [])
      ];
      const backendSubjects = allItems.map(i => i.subject).filter(Boolean);
      if (backendSubjects.length > 0) {
        setSubjects(prev => [...new Set([...prev, ...backendSubjects])]);
      }
    } catch {
      console.warn('Backend offline — using localStorage cached catalog.');
      // Don't overwrite existing localStorage data with mocks if we already have items
      const hasCached = LS.get('ch_notes', []).length > 0 ||
                        LS.get('ch_quizzes', []).length > 0;
      if (!hasCached) loadOfflineMocks();
    }
  }, []);

  // ── Offline demo seed (only used when no cached data exists) ───────────────
  const loadOfflineMocks = () => {
    setNotes([{
      id: 'note-1',
      title: 'Database Management Systems — Normalization Complete Guide',
      uploaderName: 'Demo Senior',
      uploaderComment: 'Detailed notes on 1NF, 2NF, 3NF, BCNF with solved GATE questions.',
      instructorName: 'Dr. R. K. Prasad',
      subject: 'DBMS',
      branch: 'Computer Science and Engineering (CSE)',
      year: '2nd Year',
      semester: 'Monsoon',
      academicYear: '2024-2025',
      ratingAverage: 4.8,
      downloadCount: 142,
      weeklyDownloads: 25,
      versions: [{ version: 'v1', url: '#', filename: 'dbms_notes.pdf', comment: 'Added BCNF examples', date: 'Mar 2025' }],
      ratings: [{ rating: 5, comment: 'Saves a lot of time before exams!', username: 'Vikram Singh' }]
    }]);
    setPyqs([{
      id: 'pyq-1',
      title: 'DBMS End-Semester Exam Paper Nov 2024',
      uploaderComment: 'Standard 3-hour paper. Question 3 was tricky.',
      instructorName: 'Dr. R. K. Prasad',
      subject: 'DBMS',
      examType: 'End-sem',
      year: '2nd Year',
      semester: 'Monsoon',
      academicYear: '2024-2025',
      downloadCount: 310,
      weeklyDownloads: 50,
      versions: [{ version: 'v1', url: '#', filename: 'dbms_pyq_2024.pdf', comment: 'Scanned copy', date: 'Nov 2024' }]
    }]);
    setQuizzes([{
      id: 'quiz-1',
      title: 'DBMS Normalization & Relational Algebra MCQ Challenge',
      uploaderName: 'Demo Senior',
      uploaderComment: 'Test your understanding of dependency preservation and lossless joins.',
      instructorName: 'Dr. R. K. Prasad',
      subject: 'DBMS',
      year: '2nd Year',
      semester: 'Monsoon',
      academicYear: '2024-2025',
      attemptCount: 156,
      weeklyAttempts: 32,
      quizPdfUrl: '/sample_quiz.pdf',
      solutionPdfUrl: '/sample_solution.pdf',
      mcqs: [
        {
          question: 'Which of the following is used to style a webpage?',
          options: ['HTML', 'CSS', 'XML', 'SQL'],
          correct: 'B'
        },
        {
          question: 'In a database, what does ACID stand for?',
          options: [
            'Atomicity, Consistency, Isolation, Durability',
            'Accuracy, Control, Integration, Design',
            'Activity, Connection, Index, Density',
            'None of the above'
          ],
          correct: 'A'
        },
        {
          question: 'Which normal form resolves partial dependencies?',
          options: ['1NF', '2NF', '3NF', 'BCNF'],
          correct: 'B'
        },
        {
          question: 'What is the default port for MongoDB server?',
          options: ['3000', '27017', '5432', '8080'],
          correct: 'B'
        },
        {
          question: 'Which HTTP method is used to create resources on a server?',
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          correct: 'B'
        }
      ]
    }]);
  };

  // ── Load user profile from API ─────────────────────────────────────────────
  const loadUserProfile = useCallback(async () => {
    try {
      const res = await api.get('/users/profile');
      if (res.data.success) {
        const user = res.data.user;
        const profile = {
          id: String(user._id),
          name: user.name,
          email: user.email,
          branch: user.branch,
          year: user.year,
          karmaScore: user.karmaScore,
          followedSubjects: user.followedSubjects || [],
          uploadsCount: (user.uploads || []).length,
          uploads: (user.uploads || []).map(up => ({
            type: up.type,
            refId: String(up.refId)
          }))
        };
        setCurrentUser(profile);

        setBookmarks((user.bookmarks || []).map(b => ({
          id: String(b._id),
          type: b.type,
          refId: String(b.refId)
        })));

        setDownloads((user.downloads || []).map(d => ({
          id: String(d._id),
          type: d.type,
          refId: String(d.refId),
          downloadedAt: new Date(d.downloadedAt).toLocaleDateString()
        })));

        setQuizAttempts((user.quizAttempts || []).map(qa => ({
          id: String(qa._id),
          quizId: String(qa.quizId),
          quizTitle: qa.quizTitle,
          subject: qa.subject,
          score: qa.score,
          total: qa.total,
          attemptedAt: new Date(qa.attemptedAt).toLocaleDateString(),
          answers: qa.answers
        })));

        fetchNotifications();
        fetchActivities();
      }
    } catch {
      // Use cached localStorage user if backend is offline — don't wipe them out
      const cached = LS.get('ch_user', null);
      if (!cached) {
        // First time offline: set a guest profile
        setCurrentUser({
          name: 'Campus Student',
          email: 'student@iit.ac.in',
          branch: 'Computer Science and Engineering (CSE)',
          year: '3rd Year',
          karmaScore: 0,
          followedSubjects: ['DBMS'],
          uploadsCount: 0,
          uploads: []
        });
      }
      // else: keep the already-restored localStorage value unchanged
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/doubts/notifications');
      if (res.data.success) setNotifications(res.data.notifications);
    } catch {}
  };

  const dismissNotification = async (notificationId) => {
    const sid = String(notificationId);
    try {
      await api.delete(`/doubts/notifications/${sid}`);
      setNotifications(prev => prev.filter(n => String(n._id || n.id) !== sid));
    } catch {
      setNotifications(prev => prev.filter(n => String(n._id || n.id) !== sid));
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/users/activities');
      if (res.data.success) setActivities(res.data.activities);
    } catch {}
  };

  // ── Bootstrap on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('campushive_token');
    if (token) loadUserProfile();
    refreshCatalog();
  }, []);

  // ── Bookmark toggle ────────────────────────────────────────────────────────
  const toggleBookmark = async (type, id) => {
    const sid = String(id);
    try {
      const res = await api.post('/users/bookmark', { type, refId: sid });
      if (res.data.success) {
        const updated = res.data.bookmarks.map(b => ({
          id: String(b._id), type: b.type, refId: String(b.refId)
        }));
        setBookmarks(updated);
        loadUserProfile();
      }
    } catch {
      const exists = bookmarks.find(b => b.type === type && String(b.refId) === sid);
      if (exists) {
        setBookmarks(bookmarks.filter(b => !(b.type === type && String(b.refId) === sid)));
      } else {
        setBookmarks([...bookmarks, { id: 'b-' + Date.now(), type, refId: sid }]);
      }
    }
  };

  // ── Follow / unfollow subject ──────────────────────────────────────────────
  const followSubject = async (subjectName) => {
    try {
      const res = await api.post('/doubts/follow', { subject: subjectName });
      if (res.data.success) {
        setCurrentUser(prev => ({ ...prev, followedSubjects: res.data.followedSubjects }));
        fetchActivities();
      }
    } catch {
      setCurrentUser(prev => {
        if (!prev) return prev;
        const already = prev.followedSubjects.includes(subjectName);
        return {
          ...prev,
          followedSubjects: already
            ? prev.followedSubjects.filter(s => s !== subjectName)
            : [...prev.followedSubjects, subjectName]
        };
      });
    }
  };

  // ── Add dynamic subject ────────────────────────────────────────────────────
  const addNewSubject = (subjectName) => {
    const trimmed = subjectName.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects(prev => [...prev, trimmed]);
      return true;
    }
    return false;
  };

  // ── Upload new resource ────────────────────────────────────────────────────
  const addUpload = async (type, data) => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('title', data.title);
    formData.append('uploaderComment', data.uploaderComment || '');
    formData.append('instructorName', data.instructorName || '');
    formData.append('subject', data.subject);
    formData.append('branch', data.branch);
    formData.append('year', data.year || '');
    formData.append('semester', data.semester);
    formData.append('academicYear', data.academicYear);

    if (data.examType) formData.append('examType', data.examType);
    if (data.mcqs && data.mcqs.length > 0) {
      formData.append('manualMcqs', JSON.stringify(data.mcqs));
    }
    if (data.fileObject instanceof File)         formData.append('file', data.fileObject);
    if (data.solutionFileObject instanceof File) formData.append('solutionFile', data.solutionFileObject);

    try {
      const res = await api.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        refreshCatalog();
        loadUserProfile();
      }
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.message || 'Server error during upload';
        console.error('Upload failed:', msg);
        alert(`❌ Upload failed: ${msg}`);
        return;
      }

      console.warn('Backend offline — saving upload locally.');
      const { fileObject, solutionFileObject, ...cleanData } = data;
      const id = `${type}-${Date.now()}`;
      const newObj = {
        id,
        uploaderName: currentUser?.name || 'Student',
        ratingAverage: 0,
        downloadCount: 0,
        weeklyDownloads: 0,
        attemptCount: 0,
        weeklyAttempts: 0,
        versions: [{
          version: 'v1', url: '#', comment: 'Initial upload',
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }],
        ratings: [],
        ...cleanData   // includes mcqs, subject, branch, etc.
      };

      if (type === 'note')       setNotes(prev => [newObj, ...prev]);
      else if (type === 'pyq')   setPyqs(prev => [newObj, ...prev]);
      else if (type === 'quiz')  setQuizzes(prev => [newObj, ...prev]);

      // Award karma locally
      setCurrentUser(prev => prev ? {
        ...prev,
        karmaScore: (prev.karmaScore || 0) + 10,
        uploadsCount: (prev.uploadsCount || 0) + 1,
        uploads: [...(prev.uploads || []), { type, refId: id }]
      } : prev);
    }
  };

  // ── Delete an upload ───────────────────────────────────────────────────────
  const deleteUpload = async (type, id) => {
    const sid = String(id);
    const confirmed = window.confirm('Are you sure you want to permanently delete this resource? This cannot be undone.');
    if (!confirmed) return;

    try {
      await api.delete(`/materials/delete/${type}/${sid}`);
    } catch (err) {
      // If backend is unreachable, still remove locally
      console.warn('Backend delete failed, removing locally:', err.message);
    }

    // Optimistically remove from local catalog
    if (type === 'note')      setNotes(prev => prev.filter(n => String(n._id || n.id) !== sid));
    else if (type === 'pyq')  setPyqs(prev => prev.filter(p => String(p._id || p.id) !== sid));
    else if (type === 'quiz') setQuizzes(prev => prev.filter(q => String(q._id || q.id) !== sid));

    // Remove from currentUser.uploads list
    setCurrentUser(prev => prev ? {
      ...prev,
      uploadsCount: Math.max(0, (prev.uploadsCount || 1) - 1),
      uploads: (prev.uploads || []).filter(u => String(u.refId) !== sid)
    } : prev);
  };

  // ── Record download ────────────────────────────────────────────────────────
  const recordDownload = async (type, id) => {
    const sid = String(id);
    try {
      await api.post(`/materials/download/${type}/${sid}`);
      loadUserProfile();
    } catch {
      if (!downloads.find(d => d.type === type && String(d.refId) === sid)) {
        setDownloads(prev => [{ id: 'd-' + Date.now(), type, refId: sid, downloadedAt: 'Just now' }, ...prev]);
      }
    }
  };

  // ── Record quiz attempt ────────────────────────────────────────────────────
  const recordQuizAttempt = async (quizId, score, total, answers) => {
    const sid = String(quizId);
    // find quiz title for local display
    const quizObj = quizzes.find(q => q.id === sid);
    try {
      await api.post(`/materials/attempt-quiz/${sid}`, { score, total, answers });
      loadUserProfile();
    } catch {
      setQuizAttempts(prev => [{
        id: 'qa-' + Date.now(),
        quizId: sid,
        quizTitle: quizObj?.title || 'Unknown Quiz',
        subject: quizObj?.subject || '',
        score,
        total,
        attemptedAt: new Date().toLocaleDateString('en-IN'),
        answers
      }, ...prev]);
    }
  };

  // ── Add a new doubt ────────────────────────────────────────────────────────
  const addDoubt = async (subject, question, anonymous = false) => {
    const newDoubt = {
      id: 'doubt-' + Date.now(),
      subject,
      question,
      anonymous,
      askedBy: anonymous ? 'Anonymous' : (currentUser?.name || 'Student'),
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      answers: []
    };
    try {
      const res = await api.post('/doubts/create', { subject, question, anonymous });
      if (res.data.success) {
        const d = res.data.doubt;
        setDoubts(prev => [{ ...d, id: String(d._id || d.id), answers: d.answers || [] }, ...prev]);
        fetchNotifications();
        return;
      }
    } catch {}
    // Offline fallback — add locally
    setDoubts(prev => [newDoubt, ...prev]);
  };

  // ── Add an answer to a doubt ───────────────────────────────────────────────
  const addAnswer = async (doubtId, text) => {
    const answer = {
      answeredBy: currentUser?.name || 'Student',
      text,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    };
    try {
      const res = await api.post(`/doubts/reply/${doubtId}`, { text });
      if (res.data.success) {
        // Backend returns the full updated doubt; get the last answer from it
        const updatedDoubt = res.data.doubt;
        const lastAns = updatedDoubt?.answers?.slice(-1)[0];
        setDoubts(prev => prev.map(d =>
          String(d.id) === String(doubtId)
            ? { ...d, answers: [...d.answers, lastAns ? { ...lastAns, answeredBy: lastAns.username || lastAns.answeredBy, timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) } : answer] }
            : d
        ));
        fetchNotifications();
        return;
      }
    } catch {}
    // Offline fallback — add locally
    setDoubts(prev => prev.map(d =>
      String(d.id) === String(doubtId)
        ? { ...d, answers: [...d.answers, answer] }
        : d
    ));
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      branchesList,
      subjects, addNewSubject,
      notes, pyqs, quizzes, doubts,
      bookmarks, downloads, quizAttempts,
      activities, notifications,
      toggleBookmark, followSubject,
      addUpload, recordDownload, recordQuizAttempt, deleteUpload,
      addDoubt, addAnswer, setDoubts,
      setNotifications, loadUserProfile, refreshCatalog, dismissNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};
