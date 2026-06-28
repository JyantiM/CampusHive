import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Send, User, CheckCircle, Bookmark, EyeOff, Bell, Loader2 } from 'lucide-react';
import api from '../utils/api';

const DoubtBox = ({ selectedSubject }) => {
  const { doubts, addDoubt, addAnswer, currentUser, followSubject, setDoubts } = useContext(AppContext);
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [answerInputs, setAnswerInputs] = useState({}); // doubtId -> text
  const [isPosting, setIsPosting] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);

  // Fetch this subject's doubts from backend on mount
  useEffect(() => {
    const fetchDoubts = async () => {
      setLoadingThreads(true);
      try {
        const res = await api.get(`/doubts/${encodeURIComponent(selectedSubject)}`);
        if (res.data.success) {
          const fetched = (res.data.doubts || []).map(d => ({
            ...d,
            id: String(d._id || d.id),
            askedBy: d.anonymous ? 'Anonymous Student' : (d.username || d.askedBy || 'Student'),
            timestamp: d.createdAt ? new Date(d.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '',
            answers: (d.answers || []).map(a => ({
              ...a,
              answeredBy: a.username || a.answeredBy || 'Student',
              timestamp: a.createdAt ? new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : ''
            }))
          }));
          // Merge: keep any optimistic local doubts not yet in backend
          setDoubts(prev => {
            const backendIds = new Set(fetched.map(d => d.id));
            const localOnly = prev.filter(d => d.subject === selectedSubject && !backendIds.has(d.id));
            const otherSubjects = prev.filter(d => d.subject !== selectedSubject);
            return [...otherSubjects, ...fetched, ...localOnly];
          });
        }
      } catch {}
      setLoadingThreads(false);
    };
    fetchDoubts();
  }, [selectedSubject]);

  const filteredDoubts = doubts.filter(d => d.subject === selectedSubject);
  const isFollowing = currentUser?.followedSubjects?.includes(selectedSubject) ?? false;

  const handlePostDoubt = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || isPosting) return;
    setIsPosting(true);
    await addDoubt(selectedSubject, newQuestion, isAnonymous);
    setNewQuestion('');
    setIsAnonymous(false);
    setIsPosting(false);
  };

  const handlePostAnswer = (e, doubtId) => {
    e.preventDefault();
    const text = answerInputs[doubtId] || '';
    if (!text.trim()) return;
    addAnswer(doubtId, text);
    setAnswerInputs({ ...answerInputs, [doubtId]: '' });
  };

  const handleAnswerInputChange = (doubtId, value) => {
    setAnswerInputs({ ...answerInputs, [doubtId]: value });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-left">
      {/* Doubt Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>💬 Doubt Box:</span>
            <span className="text-amber-500">{selectedSubject}</span>
          </h2>
          <p className="text-xs text-slate-400">Collaborative Q&A board. Seniors help juniors resolve doubts.</p>
        </div>

        {/* Follow/Unfollow Subject Button */}
        <button
          onClick={() => followSubject(selectedSubject)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition duration-200 ${
            isFollowing
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isFollowing ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Following Subject</span>
            </>
          ) : (
            <>
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>Follow Subject</span>
            </>
          )}
        </button>
      </div>

      {/* Ask Doubt Form */}
      <form onSubmit={handlePostDoubt} className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ask a New Doubt</h3>
        <textarea
          placeholder={`Type your doubt regarding ${selectedSubject} here...`}
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          rows="3"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none transition"
        />
        <div className="flex justify-between items-center mt-3 flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded bg-slate-900 border-slate-800 text-amber-500 focus:ring-amber-500"
            />
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              Post Anonymously
            </span>
          </label>
          <button
            type="submit"
            disabled={isPosting || !newQuestion.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/10"
          >
            {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isPosting ? 'Posting...' : 'Post Doubt'}</span>
          </button>
        </div>
      </form>

      {/* Doubts Thread List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Threads</h3>
        {loadingThreads ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
            <span>Loading doubts...</span>
          </div>
        ) : filteredDoubts.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500 text-sm">
            No doubts posted yet for {selectedSubject}. Be the first to ask!
          </div>
        ) : (
          filteredDoubts.map(d => (
            <div key={d.id} className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              {/* Question Body */}
              <div className="p-4 border-b border-slate-900">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                      {d.anonymous ? 'A' : (d.askedBy ? d.askedBy.charAt(0) : 'U')}
                    </div>
                    <span>{d.anonymous ? 'Anonymous Student' : d.askedBy}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{d.timestamp}</span>
                </div>
                <p className="text-sm font-semibold text-slate-100">{d.question}</p>
              </div>

              {/* Answers Grid */}
              <div className="bg-slate-900/40 p-4 space-y-3">
                {d.answers.map((ans, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800/80 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1 text-[10px] font-semibold text-slate-400">
                      <div className="flex items-center gap-1 text-amber-500">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{ans.answeredBy} (Senior/Instructor)</span>
                      </div>
                      <span className="text-slate-500 font-medium">{ans.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{ans.text}</p>
                  </div>
                ))}

                {/* Reply Form */}
                <form onSubmit={(e) => handlePostAnswer(e, d.id)} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Write a reply/answer to this doubt..."
                    value={answerInputs[d.id] || ''}
                    onChange={(e) => handleAnswerInputChange(d.id, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoubtBox;
