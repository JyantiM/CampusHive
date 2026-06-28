import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import FilePreview from '../components/FilePreview';
import { ArrowLeft, Play, Eye, CheckCircle2, XCircle, Award, ListChecks, Sparkles, Brain, Loader2 } from 'lucide-react';
import api from '../utils/api';

const QuizDetail = ({ id, onBack }) => {
  const { quizzes, recordQuizAttempt, recordDownload } = useContext(AppContext);
  const [activeMode, setActiveMode] = useState('pdf'); // pdf, attempt
  const [showSolutionPdf, setShowSolutionPdf] = useState(false);

  // Attempt mode states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // questionIndex -> letter (e.g. 'B')
  const [hasAnswered, setHasAnswered] = useState({}); // questionIndex -> boolean
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // AI Summary states
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Support both MongoDB _id (ObjectId object) and local fallback id (string)
  // Always stringify both sides so ObjectId("abc") === "abc" works
  const quiz = quizzes.find(q => String(q._id || q.id) === String(id));

  if (!quiz) {
    return (
      <div className="p-8 text-center text-slate-400">
        Quiz not found.
        <button onClick={onBack} className="block mx-auto mt-4 px-4 py-2 bg-slate-800 rounded">Go Back</button>
      </div>
    );
  }

  // Normalise mcqs — ensure it is always an array even if backend returns undefined
  const [reparsedMcqs, setReparsedMcqs] = useState(null);
  const [isReparsing, setIsReparsing] = useState(false);

  const safeMcqs = reparsedMcqs || (Array.isArray(quiz.mcqs) ? quiz.mcqs : []);

  // Check if MCQs are just placeholders (from failed parsing)
  const hasRealMcqs = safeMcqs.length > 0 && !safeMcqs.some(m => 
    m.question?.includes('placeholder') || m.question?.includes('Sample placeholder')
  );

  const handleReparseQuiz = async () => {
    setIsReparsing(true);
    try {
      const quizId = quiz._id || quiz.id;
      const res = await api.post(`/materials/reparse-quiz/${quizId}`);
      if (res.data.success && Array.isArray(res.data.mcqs) && res.data.mcqs.length > 0) {
        setReparsedMcqs(res.data.mcqs);
        handleResetQuiz();
      }
    } catch (e) {
      console.warn('Reparse failed:', e.message);
    } finally {
      setIsReparsing(false);
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  const handleOptionClick = (optionLetter) => {
    // Prevent double clicking
    if (hasAnswered[currentQuestionIndex]) return;

    const currentQuestion = safeMcqs[currentQuestionIndex];
    const isCorrect = optionLetter === currentQuestion.correct;

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionLetter
    });

    setHasAnswered({
      ...hasAnswered,
      [currentQuestionIndex]: true
    });

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < safeMcqs.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finished all questions!
      setIsCompleted(true);
      const attemptAnswers = safeMcqs.map((q, idx) => ({
        questionIndex: idx,
        selectedOption: selectedAnswers[idx],
        correct: q.correct
      }));
      recordQuizAttempt(quiz.id, score, safeMcqs.length, attemptAnswers);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setHasAnswered({});
    setIsCompleted(false);
    setScore(0);
  };

  // AI Summary handler
  const handleTriggerSummary = async () => {
    setIsAiLoading(true);
    try {
      const quizId = quiz._id || quiz.id;
      const res = await api.post(`/materials/ai-summary/quiz/${quizId}`);
      if (res.data.success && res.data.summary) {
        setAiSummaryText(res.data.summary);
      } else {
        throw new Error('No summary returned');
      }
    } catch (e) {
      console.warn('Backend quiz summary failed, using unique offline fallback.');
      // Unique offline fallback using quiz-specific data
      setAiSummaryText(
        `[Offline Summary] This quiz "${quiz.title}" covers the subject "${quiz.subject}" for ${quiz.academicYear || 'the current academic year'}. ` +
        `It contains ${safeMcqs.length} MCQ question(s) that test conceptual understanding, application, and problem-solving skills. ` +
        `Prepared under the guidance of ${quiz.instructorName || 'department faculty'} for ${quiz.semester || 'semester'} assessment. ` +
        `Review all questions carefully and attempt the interactive quiz mode to evaluate your preparation.`
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto space-y-8 text-left">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-amber-500 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </button>

      {/* Main header block */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              QUIZ ASSESSMENT
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {quiz.subject} • {quiz.academicYear} • {safeMcqs.length} Questions
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight leading-snug">{quiz.title}</h1>
          <p className="text-xs text-slate-400 mt-1 italic">"{quiz.uploaderComment}"</p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveMode('pdf')}
            className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider relative transition ${
              activeMode === 'pdf' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mode A — PDF View
          </button>
          <button
            onClick={() => {
              if (safeMcqs.length === 0) return;
              setActiveMode('attempt');
              handleResetQuiz();
            }}
            disabled={safeMcqs.length === 0}
            title={safeMcqs.length === 0 ? "Mode B is disabled because no interactive questions or solution PDF were uploaded." : ""}
            className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider relative transition ${
              safeMcqs.length === 0 
                ? 'text-slate-600 cursor-not-allowed'
                : activeMode === 'attempt' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mode B — Interactive Attempt Mode
          </button>
        </div>

        {/* AI Summary Button */}
        <div className="pt-2">
          <button
            onClick={handleTriggerSummary}
            disabled={isAiLoading}
            className="flex items-center justify-center gap-2 w-full p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/10"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAiLoading ? 'Analyzing Quiz...' : 'Generate AI Summary'}</span>
          </button>
        </div>

        {/* AI Summary Output */}
        {aiSummaryText && !isAiLoading && (
          <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <Brain className="w-4 h-4" />
              <span>AI Quiz Summary</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{aiSummaryText}</p>
          </div>
        )}
      </div>

      {/* MODE A: PDF Preview Viewer */}
      {activeMode === 'pdf' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowSolutionPdf(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                !showSolutionPdf
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Show Quiz PDF
            </button>
            {quiz.solutionPdfUrl && (
              <button
                onClick={() => setShowSolutionPdf(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  showSolutionPdf
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Show Solution PDF
              </button>
            )}
          </div>

          <FilePreview
            title={`${quiz.title} - ${showSolutionPdf ? 'Solution Key' : 'Questions'}`}
            filename={`${quiz.subject.toLowerCase()}_quiz_${showSolutionPdf ? 'solution' : 'paper'}.pdf`}
            fileUrl={showSolutionPdf ? quiz.solutionPdfUrl : quiz.quizPdfUrl}
            onDownload={() => recordDownload('quiz', quiz.id || quiz._id)}
          />
        </div>
      )}

      {/* MODE B: Interactive MCQ Attempt Mode */}
      {activeMode === 'attempt' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Guard: no MCQs uploaded */}
          {safeMcqs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="text-4xl">📝</div>
              <p className="text-base font-bold text-slate-300">No MCQ Questions Available</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                The uploader did not add interactive questions for this quiz.
                Switch to <strong>PDF View</strong> mode to read the question paper directly.
              </p>
              <button
                onClick={() => setActiveMode('pdf')}
                className="mt-2 px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition"
              >
                Switch to PDF View →
              </button>
            </div>
          ) : !isCompleted ? (
            // Attempting Questions
            <div className="space-y-6">
              {/* Question Header Status */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400">
                  Question {currentQuestionIndex + 1} of {safeMcqs.length}
                </span>
                <span className="text-xs text-amber-500 font-bold">
                  Score: {score}
                </span>
              </div>

              {/* Question Statement */}
              <p className="text-base font-bold text-slate-100 leading-snug">
                {safeMcqs[currentQuestionIndex].question}
              </p>

              {/* Option Buttons */}
              <div className="grid grid-cols-1 gap-3">
                {safeMcqs[currentQuestionIndex].options.map((opt, idx) => {
                  const optionLetter = optionLetters[idx];
                  const isSelected = selectedAnswers[currentQuestionIndex] === optionLetter;
                  const isCorrectAnswer = optionLetter === safeMcqs[currentQuestionIndex].correct;
                  const answered = hasAnswered[currentQuestionIndex];

                  let btnStyle = 'bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800';

                  if (answered) {
                    if (isCorrectAnswer) {
                      // Correct option is always green after answering
                      btnStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold';
                    } else if (isSelected) {
                      // Selected wrong option is highlighted red
                      btnStyle = 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold';
                    } else {
                      btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-600';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(optionLetter)}
                      disabled={answered}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all duration-200 flex items-start gap-3 ${btnStyle}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-center font-bold text-xs">
                        {optionLetter}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Control Actions */}
              {hasAnswered[currentQuestionIndex] && (
                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/10"
                  >
                    {currentQuestionIndex < safeMcqs.length - 1 ? 'Next Question →' : 'Submit & Review'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Score Board Summary Review
            <div className="space-y-6 text-center">
              <div className="inline-flex w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 items-center justify-center shadow-inner border border-amber-500/20">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Quiz Attempt Review</h2>
                <p className="text-xs text-slate-400 mt-1">Check your results and study correct answers below.</p>
              </div>

              {/* Progress score indicators */}
              <div className="max-w-xs mx-auto bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <p className="text-sm font-bold text-slate-400">Total Score</p>
                <p className="text-3xl font-black text-amber-500">
                  {score} <span className="text-sm text-slate-500">/ {safeMcqs.length}</span>
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {safeMcqs.length > 0 ? Math.round((score / safeMcqs.length) * 100) : 0}% Pass Accuracy
                </p>
              </div>

              {/* Score bar */}
              <div className="max-w-md mx-auto w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    score === safeMcqs.length ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${safeMcqs.length > 0 ? (score / safeMcqs.length) * 100 : 0}%` }}
                ></div>
              </div>

              {/* Full Question breakdown reviews */}
              <div className="space-y-4 text-left pt-6 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-amber-500" />
                  <span>Question Analysis</span>
                </h3>

                {safeMcqs.map((mcq, idx) => {
                  const selAns = selectedAnswers[idx];
                  const isCorrect = selAns === mcq.correct;

                  return (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-xs sm:text-sm font-bold text-slate-200">
                          {idx + 1}. {mcq.question}
                        </p>
                        {isCorrect ? (
                          <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Your answer:</span>
                          <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {selAns || 'Unanswered'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Correct key:</span>
                          <span className="text-emerald-400 font-bold">
                            {mcq.correct}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom reset actions */}
              <div className="flex justify-center pt-4 border-t border-slate-800">
                <button
                  onClick={handleResetQuiz}
                  className="px-6 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  Attempt Quiz Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizDetail;
