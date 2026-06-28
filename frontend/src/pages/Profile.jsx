import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { User, Award, BookOpen, Download, Bookmark, History, Edit3, Trash2, XCircle, CheckCircle, ChevronRight, Upload, X, Loader2 } from 'lucide-react';
import api from '../utils/api';

const Profile = ({ onNavigateDetail }) => {
  const {
    currentUser,
    setCurrentUser,
    notes,
    pyqs,
    quizzes,
    downloads,
    quizAttempts,
    bookmarks,
    activities,
    followSubject,
    toggleBookmark,
    deleteUpload,
    refreshCatalog
  } = useContext(AppContext);

  // Tab management inside Profile page
  const [activeProfileTab, setActiveProfileTab] = useState('info'); // info, uploads, downloads, attempts, saved, activity

  // Editing profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBranch, setEditBranch] = useState(currentUser?.branch || '');
  const [editYear, setEditYear] = useState(currentUser?.year || '');

  // Quiz attempt review sub-state
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  // New version modal state
  const [newVersionModal, setNewVersionModal] = useState(null); // { type, id, title }
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [newVersionComment, setNewVersionComment] = useState('');
  const [isVersionUploading, setIsVersionUploading] = useState(false);
  const versionFileRef = useRef(null);

  const openNewVersionModal = (type, id, title) => {
    setNewVersionModal({ type, id, title });
    setNewVersionFile(null);
    setNewVersionComment('');
  };

  const handleNewVersionSubmit = async (e) => {
    e.preventDefault();
    if (!newVersionFile || isVersionUploading) return;
    setIsVersionUploading(true);
    try {
      const form = new FormData();
      form.append('file', newVersionFile);
      form.append('comment', newVersionComment);
      await api.post(`/materials/version/${newVersionModal.type}/${newVersionModal.id}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`✅ New version uploaded for "${newVersionModal.title}"!`);
      setNewVersionModal(null);
      if (refreshCatalog) refreshCatalog();
    } catch (err) {
      alert(`❌ Failed to upload: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsVersionUploading(false);
    }
  };

  // Always stringify IDs so MongoDB ObjectId objects compare correctly to string IDs
  const getNoteById = (id) => notes.find(n => String(n._id || n.id) === String(id));
  const getPyqById = (id) => pyqs.find(p => String(p._id || p.id) === String(id));
  const getQuizById = (id) => quizzes.find(q => String(q._id || q.id) === String(id));

  const handleProfileSave = (e) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      name: editName,
      branch: editBranch,
      year: editYear
    });
    setIsEditing(false);
  };

  // Group uploads based on currentUser.uploads list
  const uploadIds = new Set(currentUser?.uploads?.map(u => String(u.refId)) || []);
  const myUploadedNotes   = notes.filter(n => uploadIds.has(String(n._id || n.id)));
  const myUploadedQuizzes = quizzes.filter(q => uploadIds.has(String(q._id || q.id)));
  const myUploadedPyqs    = pyqs.filter(p => uploadIds.has(String(p._id || p.id)));

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-6 text-left">
      {/* 1. Header Profile Banner Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/10">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-tight flex items-center gap-2">
              <span>{currentUser.name}</span>
              <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-amber-500 transition">
                <Edit3 className="w-4 h-4" />
              </button>
            </h1>
            <p className="text-xs text-slate-400">{currentUser.email} • {currentUser.branch} • {currentUser.year}</p>
          </div>
        </div>

        {/* Karma points badge */}
        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-xl flex items-center gap-2 text-amber-500">
          <Award className="w-6 h-6" />
          <div>
            <span className="block text-[10px] uppercase font-extrabold tracking-wider leading-none text-slate-400">Karma Score</span>
            <span className="text-xl font-black leading-none mt-1 block">⭐ {currentUser.karmaScore} Karma</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog Box */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleProfileSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="font-black text-lg text-white">Edit Profile Details</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch</label>
              <input
                type="text"
                value={editBranch}
                onChange={(e) => setEditBranch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year</label>
              <input
                type="text"
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold hover:bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Version Upload Modal */}
      {newVersionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleNewVersionSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-lg text-white">Upload New Version</h3>
              <button type="button" onClick={() => setNewVersionModal(null)} className="p-1 text-slate-500 hover:text-slate-300 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Uploading a new version of: <span className="font-bold text-slate-200">{newVersionModal.title}</span>
            </p>

            {/* File picker */}
            <div
              onClick={() => versionFileRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer transition group"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-slate-500 group-hover:text-amber-500 transition" />
              {newVersionFile ? (
                <p className="text-xs font-bold text-amber-400">{newVersionFile.name}</p>
              ) : (
                <p className="text-xs text-slate-500">Click to select a PDF file</p>
              )}
              <input
                ref={versionFileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setNewVersionFile(e.target.files[0] || null)}
              />
            </div>

            {/* Optional comment */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. Added Chapter 5 solutions"
                value={newVersionComment}
                onChange={(e) => setNewVersionComment(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNewVersionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold hover:bg-slate-800 text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newVersionFile || isVersionUploading}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVersionUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isVersionUploading ? 'Uploading...' : 'Upload Version'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Profile Inner Section tabs bar */}
      <div className="flex border-b border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'info', label: 'Basic Info & Subjects', icon: User },
          { key: 'uploads', label: 'My Uploads', icon: BookOpen },
          { key: 'downloads', label: 'My Downloads', icon: Download },
          { key: 'attempts', label: 'Quiz Attempts', icon: History },
          { key: 'saved', label: 'Saved Items', icon: Bookmark },
          { key: 'activity', label: 'Activity Log', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveProfileTab(tab.key);
                setSelectedAttempt(null);
              }}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap border-b-2 transition ${
                activeProfileTab === tab.key
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. PROFILE TAB CONTENT PANES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[300px]">

        {/* TAB 1: BASIC INFO & SUBJECT SUBSCRIPTIONS */}
        {activeProfileTab === 'info' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Academic Subscriptions</h3>
              <p className="text-xs text-slate-500 mb-4">You receive live notifications for new activity and document uploads under these followed subjects.</p>
              
              {(currentUser?.followedSubjects || []).length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  You are not following any subject tracks yet. Visit notes listings to follow subjects.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentUser?.followedSubjects || []).map((sub, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-300">{sub}</span>
                      <button
                        onClick={() => followSubject(sub)}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 text-slate-400 transition"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform Statistics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                  <span className="block text-xl font-black text-amber-500">⭐ {currentUser.karmaScore}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karma Points</span>
                </div>
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                  <span className="block text-xl font-black text-slate-200">{currentUser?.uploadsCount ?? (myUploadedNotes.length + myUploadedQuizzes.length)}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resource Uploads</span>
                </div>
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
                  <span className="block text-xl font-black text-slate-200">{downloads.length}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Downloads</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY UPLOADS */}
        {activeProfileTab === 'uploads' && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uploaded Documents Directory</h3>
            
            {/* Notes Uploads */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Notes & Study Guides ({myUploadedNotes.length})</span>
              {myUploadedNotes.length === 0 ? (
                <div className="p-3 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500">No notes uploaded.</div>
              ) : (
                <div className="space-y-2">
                  {myUploadedNotes.map(n => {
                    const nId = String(n._id || n.id);
                    return (
                    <div key={nId} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs flex-wrap gap-3">
                      <div className="space-y-0.5">
                        <span onClick={() => onNavigateDetail('note', nId)} className="font-bold text-slate-200 hover:text-amber-500 cursor-pointer block">{n.title}</span>
                        <span className="text-slate-500 block">Downloads: {n.downloadCount} • Rating: {n.ratingAverage} ⭐</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openNewVersionModal('note', nId, n.title)}
                          className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 font-bold"
                          title="Upload an updated version of this note"
                        >
                          New Version
                        </button>
                        <button
                          onClick={() => deleteUpload('note', nId)}
                          className="p-1 text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 rounded transition"
                          title="Delete this note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quizzes Uploads */}
            <div className="border-t border-slate-800 pt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Interactive MCQ Quizzes ({myUploadedQuizzes.length})</span>
              {myUploadedQuizzes.length === 0 ? (
                <div className="p-3 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500">No quizzes uploaded.</div>
              ) : (
                <div className="space-y-2">
                  {myUploadedQuizzes.map(q => {
                    const qId = String(q._id || q.id);
                    const mcqCount = Array.isArray(q.mcqs) ? q.mcqs.length : 0;
                    return (
                    <div key={qId} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs flex-wrap gap-3">
                      <div className="space-y-0.5">
                        <span onClick={() => onNavigateDetail('quiz', qId)} className="font-bold text-slate-200 hover:text-amber-500 cursor-pointer block">{q.title}</span>
                        <span className="text-slate-500 block">Attempts: {q.attemptCount || 0} • Questions: {mcqCount} MCQs</span>
                      </div>
                      <button
                        onClick={() => deleteUpload('quiz', qId)}
                        className="p-1 text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 rounded transition"
                        title="Delete this quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PYQs Uploads */}
            <div className="border-t border-slate-800 pt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Previous Year Question Papers ({myUploadedPyqs.length})</span>
              {myUploadedPyqs.length === 0 ? (
                <div className="p-3 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500">No PYQs uploaded.</div>
              ) : (
                <div className="space-y-2">
                  {myUploadedPyqs.map(p => {
                    const pId = String(p._id || p.id);
                    return (
                    <div key={pId} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs flex-wrap gap-3">
                      <div className="space-y-0.5">
                        <span onClick={() => onNavigateDetail('pyq', pId)} className="font-bold text-slate-200 hover:text-amber-500 cursor-pointer block">{p.title}</span>
                        <span className="text-slate-500 block">Downloads: {p.downloadCount} • {p.examType} • {p.semester}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openNewVersionModal('pyq', pId, p.title)}
                          className="px-2.5 py-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 font-bold"
                          title="Upload an updated version of this PYQ"
                        >
                          New Version
                        </button>
                        <button
                          onClick={() => deleteUpload('pyq', pId)}
                          className="p-1 text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 rounded transition"
                          title="Delete this PYQ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY DOWNLOADS */}
        {activeProfileTab === 'downloads' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Downloads History</h3>
            
            {downloads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">You have not downloaded any documents yet.</div>
            ) : (
              <div className="space-y-3">
                {downloads.map(d => {
                  const info = d.type === 'note' ? getNoteById(d.refId) : getPyqById(d.refId);
                  if (!info) return null;
                  return (
                    <div
                      key={d.id}
                      onClick={() => onNavigateDetail(d.type, d.refId)}
                      className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl flex justify-between items-center text-xs cursor-pointer group transition"
                    >
                      <div>
                        <span className="text-[9px] uppercase font-bold text-amber-500 block mb-0.5">{d.type} • {info.subject}</span>
                        <span className="font-semibold text-slate-200 group-hover:text-amber-400 block">{info.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{d.downloadedAt}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: QUIZ ATTEMPTS & SCORE REVIEWS */}
        {activeProfileTab === 'attempts' && (
          <div className="space-y-4">
            {!selectedAttempt ? (
              // Quiz Attempt Index
              <>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attempts Log</h3>
                {quizAttempts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No attempts logged yet. Try answering a quiz!</div>
                ) : (
                  <div className="space-y-3">
                    {quizAttempts.map(attempt => (
                      <div
                        key={attempt.id}
                        onClick={() => setSelectedAttempt(attempt)}
                        className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl flex justify-between items-center text-xs cursor-pointer group transition flex-wrap gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[9px] uppercase font-bold text-amber-500 block">{attempt.subject} ASSESSMENT</span>
                          <span className="font-semibold text-slate-200 group-hover:text-amber-400 block">{attempt.quizTitle}</span>
                          <span className="text-[10px] text-slate-500 block">Attempted: {attempt.attemptedAt}</span>
                        </div>

                        {/* score review key */}
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-center">
                            <span className="block font-black text-slate-200 text-sm">{attempt.score} / {attempt.total}</span>
                            <span className="text-[9px] text-slate-500 font-bold block uppercase">Score</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Attempt Question-by-Question breakdown review screen
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <button onClick={() => setSelectedAttempt(null)} className="text-xs text-slate-400 hover:text-amber-500 font-bold">
                    &larr; Back to Attempts List
                  </button>
                  <span className="text-xs text-slate-500 font-medium">Attempt Review: {selectedAttempt.attemptedAt}</span>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">{selectedAttempt.subject} Assessment</span>
                  <h4 className="font-bold text-slate-200 text-sm sm:text-base leading-tight">{selectedAttempt.quizTitle}</h4>
                  <div className="pt-2 text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <span>Accuracy Score:</span>
                    <span className="text-amber-500 text-sm font-black">{selectedAttempt.score} / {selectedAttempt.total} ({Math.round((selectedAttempt.score / selectedAttempt.total) * 100)}%)</span>
                  </div>
                </div>

                {/* Answers listing */}
                <div className="space-y-3.5">
                  {selectedAttempt.answers.map((ans, idx) => {
                    const isRight = ans.selectedOption === ans.correct;
                    const quizDetails = getQuizById(selectedAttempt.quizId);
                    const qObj = quizDetails?.mcqs[idx] || { question: `Question ${idx + 1}` };

                    return (
                      <div key={idx} className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-xs font-bold text-slate-300">{idx + 1}. {qObj.question}</p>
                          {isRight ? (
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                              <CheckCircle className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                              <XCircle className="w-3.5 h-3.5" /> Wrong
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                            <span className="text-slate-500">Your choice:</span>
                            <span className={`font-bold ${isRight ? 'text-emerald-400' : 'text-rose-400'}`}>{ans.selectedOption || 'Unanswered'}</span>
                          </div>
                          <div className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                            <span className="text-slate-500">Answer key:</span>
                            <span className="text-emerald-400 font-bold">{ans.correct}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SAVED / BOOKMARKED ITEMS */}
        {activeProfileTab === 'saved' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bookmarked Resources</h3>
            
            {bookmarks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No bookmarks saved. Click the 🔖 icon on cards to save.</div>
            ) : (
              <div className="space-y-3">
                {bookmarks.map(b => {
                  let info = null;
                  if (b.type === 'note') info = getNoteById(b.refId);
                  else if (b.type === 'pyq') info = getPyqById(b.refId);
                  else if (b.type === 'quiz') info = getQuizById(b.refId);

                  if (!info) return null;

                  return (
                    <div
                      key={b.id}
                      className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-xs flex-wrap gap-3"
                    >
                      <div onClick={() => onNavigateDetail(b.type, b.refId)} className="cursor-pointer group flex-1">
                        <span className="text-[9px] uppercase font-bold text-amber-500 block mb-0.5">{b.type} • {info.subject}</span>
                        <span className="font-semibold text-slate-200 group-hover:text-amber-400 block">{info.title}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleBookmark(b.type, b.refId)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 text-slate-400 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: RECENT ACTIVITY FEED */}
        {activeProfileTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Platform Actions</h3>
            
            <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-4 py-2">
              {activities.map(act => (
                <div key={act.id} className="relative text-xs">
                  {/* dot status indicator */}
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-slate-900 shadow"></div>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-slate-300 font-semibold">{act.description}</p>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{act.type}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
