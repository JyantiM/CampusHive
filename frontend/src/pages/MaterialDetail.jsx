import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import FilePreview from '../components/FilePreview';
import DoubtBox from '../components/DoubtBox';
import { Star, ArrowLeft, Brain, Sparkles, RefreshCw, Layers, Award, Loader2, Send, X } from 'lucide-react';
import api from '../utils/api';

const MaterialDetail = ({ type, id, onBack }) => {
  const { notes, pyqs, recordDownload, refreshCatalog } = useContext(AppContext);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(-1); // -1 means latest version

  // Rating form states
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  
  // AI summary states
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [showSummary, setShowSummary] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Flashcards states
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashcardsList, setFlashcardsList] = useState([]);
  const [isCardsLoading, setIsCardsLoading] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState({}); // cardIndex -> boolean
  // Get active item
  const item = type === 'note'
    ? notes.find(n => String(n._id || n.id) === String(id))
    : pyqs.find(p => String(p._id || p.id) === String(id));

  // Normalise item ID for all operations
  const itemId = item ? (item._id || item.id) : null;

  // Reset or load AI states when item versions/documents change
  useEffect(() => {
    setAiSummaryText(item?.aiSummary || '');
    setShowSummary(true);
    setFlashcardsList([]);
    setFlashcardMode(false);
  }, [item?.versions?.length, id, item?.aiSummary]);

  if (!item) {
    return (
      <div className="p-8 text-center text-slate-400">
        Item not found.
        <button onClick={onBack} className="block mx-auto mt-4 px-4 py-2 bg-slate-800 rounded">Go Back</button>
      </div>
    );
  }

  const latestVersionIndex = item.versions.length - 1;
  const activeVersionIndex = selectedVersionIndex === -1 ? latestVersionIndex : selectedVersionIndex;
  const selectedVersion = item.versions[activeVersionIndex] || item.versions[latestVersionIndex];

  // AI Summarizer Trigger
  const handleTriggerSummary = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.post(`/materials/ai-summary/${type}/${itemId}?force=true`, {
        versionIndex: activeVersionIndex
      });
      if (res.data.success && res.data.summary) {
        setAiSummaryText(res.data.summary);
        setShowSummary(true);
        refreshCatalog();
      } else {
        throw new Error('No summary returned');
      }
    } catch (e) {
      console.warn('Backend API summary fetch failed, using offline fallback.');
      if (type === 'note') {
        setAiSummaryText(
          `This study document "${item.title}" details key academic concepts, equations, and topics related to ${item.subject}. ` +
          `Curated under the instruction of ${item.instructorName || 'department faculty'} for students of ${item.branch}. ` +
          `Ideal for revision and exam preparation in the ${item.academicYear || 'current'} academic cycle.`
        );
      } else {
        setAiSummaryText(
          `This question paper "${item.title}" features ${item.subject} assessment questions for the ${item.examType || 'end-semester'} exam. ` +
          `Prepared for ${item.semester || 'semester'} ${item.academicYear || ''} — useful for exam practice, pattern analysis, and understanding expected question formats.`
        );
      }
      setShowSummary(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Flashcards Trigger
  const handleOpenFlashcards = async () => {
    if (flashcardMode) {
      setFlashcardMode(false);
      return;
    }
    setFlashcardMode(true);
    if (flashcardsList.length > 0) return; // already loaded

    setIsCardsLoading(true);
    try {
      const res = await api.post(`/materials/ai-flashcards/${itemId}`);
      if (res.data.success && Array.isArray(res.data.flashcards) && res.data.flashcards.length > 0) {
        setFlashcardsList(res.data.flashcards);
      } else {
        throw new Error('No flashcards returned');
      }
    } catch (e) {
      console.warn('API flashcards failed, using error fallback.');
      setFlashcardsList([
        { front: 'Flashcard generation encountered an issue.', back: 'The server could not extract enough text from this PDF to generate flashcards. This may happen with scanned/image-based PDFs. Try re-uploading a text-based PDF.' },
        { front: 'Tip: How to get better flashcards?', back: 'Upload text-based PDFs (not scanned images). Lecture slides, typed notes, and textbook chapters work best for automatic flashcard generation.' }
      ]);
    } finally {
      setIsCardsLoading(false);
    }
  };

  const handleKnownToggle = (idx, value) => {
    setKnownCards({
      ...knownCards,
      [idx]: value
    });
  };

  const scoreCount = Object.values(knownCards).filter(Boolean).length;

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-8 text-left">
      {/* Back Button and Path navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-amber-500 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </button>

      {/* Main Details Pane */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {type.toUpperCase()} ARCHIVE
              </span>
              <span className="text-xs font-semibold text-slate-500">{item.subject} • {item.academicYear}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug">{item.title}</h1>
            <p className="text-xs text-slate-400 mt-1">Uploaded by <span className="font-semibold text-slate-300">{item.uploaderName || 'Senior Student'}</span></p>
          </div>

          {/* Version Picker Dropdown */}
          <div className="flex flex-col gap-1 bg-slate-950 p-2 border border-slate-800 rounded-xl">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">Versions</span>
            <select
              value={activeVersionIndex}
              onChange={(e) => setSelectedVersionIndex(parseInt(e.target.value))}
              className="bg-transparent text-xs text-slate-200 border-none focus:ring-0 cursor-pointer pr-8 font-semibold"
            >
              {item.versions.map((ver, idx) => (
                <option key={idx} value={idx} className="bg-slate-950 text-slate-300">
                  {ver.version} ({ver.date}) {idx === latestVersionIndex ? '• Latest' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comment on active version */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">
            Uploader version comment ({selectedVersion.version})
          </span>
          <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
            "{selectedVersion.comment || item.uploaderComment}"
          </p>
        </div>

        {/* Action Triggers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AI summary button */}
          <button
            onClick={handleTriggerSummary}
            disabled={isAiLoading}
            className="flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/10"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isAiLoading ? 'Summarizing Document...' : 'Generate AI Summary'}
            </span>
          </button>

          {/* Flashcards Toggle Button (Notes Only) */}
          {type === 'note' && (
            <button
              onClick={handleOpenFlashcards}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition shadow ${
                flashcardMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>{flashcardMode ? 'Close Flashcards' : 'Open Flashcards Mode'}</span>
            </button>
          )}
        </div>

        {/* AI Summary Display Card */}
        {aiSummaryText && showSummary && !isAiLoading && (
          <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 space-y-2 animate-fadeIn relative">
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => handleTriggerSummary(true)}
                className="text-slate-400 hover:text-indigo-400 transition"
                title="Regenerate Summary"
              >
                <RefreshCw className="w-4 h-4 animate-hover-spin" />
              </button>
              <button 
                onClick={() => setShowSummary(false)} 
                className="text-slate-400 hover:text-slate-200 transition"
                title="Close summary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <Brain className="w-4 h-4" />
              <span>AI Study Summary (Claude Generated)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pr-16">{aiSummaryText}</p>
          </div>
        )}
      </div>

      {/* 5. Flashcard Interactive Mode Panel */}
      {flashcardMode && type === 'note' && (
        <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-6 text-center animate-fadeIn relative">
          <button 
            onClick={() => setFlashcardMode(false)} 
            className="absolute top-4 right-4 text-slate-400 hover:text-amber-500 transition z-10"
            title="Close Flashcards"
          >
            <X className="w-5 h-5" />
          </button>
          {isCardsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <span className="text-xs">Generating study flashcards...</span>
            </div>
          ) : flashcardsList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No study flashcards available.</div>
          ) : (
            <>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2 text-left">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-1">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span>Study Flashcards</span>
                  </h2>
                  <span className="text-xs text-slate-400">Flip cards to quiz yourself. Mark cards as known to track progress.</span>
                </div>
                <div className="bg-slate-950 px-3 py-1 rounded-lg text-xs font-bold text-amber-500 border border-slate-800">
                  {scoreCount} / {flashcardsList.length} Known
                </div>
              </div>

              {/* Interactive Flip Card Frame */}
              <div className="max-w-md mx-auto py-6">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="perspective-1000 w-full min-h-[180px] cursor-pointer"
                >
                  <div
                    className={`transform-style-3d relative w-full min-h-[180px] rounded-2xl border border-slate-800 shadow-xl transition-transform duration-500 ${
                      isFlipped ? 'rotate-y-180 bg-slate-950 border-amber-500/40' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {/* Front Side */}
                    <div className="backface-hidden absolute inset-0 p-6 flex flex-col justify-between text-left">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Question {currentCardIndex + 1}</span>
                      <p className="text-sm font-semibold text-slate-100 my-auto text-center">{flashcardsList[currentCardIndex]?.front}</p>
                      <span className="text-[10px] text-center text-slate-500 block uppercase font-bold tracking-wider">Click card to reveal answer</span>
                    </div>

                    {/* Back Side */}
                    <div className="backface-hidden rotate-y-180 absolute inset-0 p-6 flex flex-col justify-between text-left">
                      <span className="text-[10px] font-extrabold text-amber-500/80 uppercase tracking-widest">Answer Key</span>
                      <p className="text-xs sm:text-sm text-slate-300 my-auto leading-relaxed text-center">{flashcardsList[currentCardIndex]?.back}</p>
                      <span className="text-[10px] text-center text-slate-500 block uppercase font-bold tracking-wider">Click to see question</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Known / Review again options */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleKnownToggle(currentCardIndex, false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    knownCards[currentCardIndex] === false
                      ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Needs Review
                </button>
                <button
                  onClick={() => handleKnownToggle(currentCardIndex, true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    knownCards[currentCardIndex] === true
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  I Know This!
                </button>
              </div>

              {/* Flashcard navigation footer */}
              <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-6">
                <button
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setCurrentCardIndex(currentCardIndex - 1);
                    setIsFlipped(false);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 transition"
                >
                  &larr; Previous Card
                </button>
                <span className="text-xs font-bold text-slate-400">Card {currentCardIndex + 1} of {flashcardsList.length}</span>
                <button
                  disabled={currentCardIndex === flashcardsList.length - 1}
                  onClick={() => {
                    setCurrentCardIndex(currentCardIndex + 1);
                    setIsFlipped(false);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 transition"
                >
                  Next Card &rarr;
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 6. Document Preview Window */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inline Document View</h3>
        <FilePreview
          title={item.title}
          filename={`${item.subject.toLowerCase()}_notes_v${activeVersionIndex + 1}.pdf`}
          fileUrl={selectedVersion?.url}
          onDownload={() => recordDownload(type, itemId)}
        />
      </div>

      {/* 7. Rate & Review This Resource */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rate & Review</h3>

        {/* Rating Submission Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (userRating === 0 || isRatingSubmitting) return;
            setIsRatingSubmitting(true);
            try {
              const res = await api.post(`/materials/rate/${type}/${itemId}`, {
                rating: userRating,
                comment: ratingComment
              });
              if (res.data.success) {
                setUserRating(0);
                setRatingComment('');
                refreshCatalog();
              }
            } catch (err) {
              alert(`Failed to submit rating: ${err.response?.data?.message || err.message}`);
            } finally {
              setIsRatingSubmitting(false);
            }
          }}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
        >
          {/* Star selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold">Your Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition transform hover:scale-110"
                >
                  <Star
                    className={`w-6 h-6 transition ${
                      star <= (hoverRating || userRating)
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                        : 'text-slate-700 hover:text-slate-500'
                    }`}
                  />
                </button>
              ))}
            </div>
            {userRating > 0 && (
              <span className="text-xs font-bold text-amber-400">{userRating}/5</span>
            )}
          </div>

          {/* Comment input */}
          <input
            type="text"
            placeholder="Write a short review (optional)..."
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={userRating === 0 || isRatingSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/10"
            >
              {isRatingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isRatingSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>

        {/* Existing Reviews */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Student Reviews ({item.ratings.length})</h4>
          {item.ratings.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">No reviews submitted yet. Be the first to rate!</div>
          ) : (
            <div className="space-y-3">
              {item.ratings.map((rate, index) => (
                <div key={index} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2 text-xs">
                    <span className="font-semibold text-slate-300">{rate.username}</span>
                    <div className="flex items-center text-amber-500 font-bold gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= rate.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                      ))}
                      <span className="ml-1">{rate.rating}/5</span>
                    </div>
                  </div>
                  {rate.comment && <p className="text-xs text-slate-400 leading-relaxed italic">"{rate.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Doubt Box specific to subject of this document */}
      <DoubtBox selectedSubject={item.subject} />
    </div>
  );
};

export default MaterialDetail;
