import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { UploadCloud, Check, Plus, Trash2, List, AlertCircle, CheckCircle } from 'lucide-react';

const Upload = ({ setActiveTab }) => {
  const { addUpload, branchesList, subjects, addNewSubject } = useContext(AppContext);

  const [resourceType, setResourceType] = useState('note');

  // Common fields
  const [title, setTitle] = useState('');
  const [uploaderComment, setUploaderComment] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [subject, setSubject] = useState(subjects[0] || 'DBMS');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isCreatingNewSubject, setIsCreatingNewSubject] = useState(false);
  const [branch, setBranch] = useState(branchesList[0]);
  const [year, setYear] = useState('1st Year');
  const [semester, setSemester] = useState('Monsoon');
  const [academicYear, setAcademicYear] = useState('2024-2025');

  // Store actual File OBJECTS (not just filenames)
  const [file1, setFile1] = useState(null);       // primary PDF File object
  const [file2, setFile2] = useState(null);       // solution PDF File object

  // PYQs fields
  const [examType, setExamType] = useState('Mid-sem');

  // Quiz MCQ state
  const [manualMcqs, setManualMcqs] = useState([]);
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState('A');

  const handleAddMcq = () => {
    if (!mcqQuestion.trim()) {
      alert('Please type the question text.');
      return;
    }
    if (mcqOptions.some(opt => !opt.trim())) {
      alert('Please fill in all 4 option texts before adding.');
      return;
    }
    const newMcq = {
      question: mcqQuestion.trim(),
      options: [...mcqOptions.map(o => o.trim())],
      correct: correctOption
    };
    setManualMcqs(prev => [...prev, newMcq]);
    setMcqQuestion('');
    setMcqOptions(['', '', '', '']);
    setCorrectOption('A');
  };

  const handleRemoveMcq = (index) => {
    setManualMcqs(prev => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (idx, value) => {
    const updated = [...mcqOptions];
    updated[idx] = value;
    setMcqOptions(updated);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !instructorName.trim() || !uploaderComment.trim()) {
      alert('Please fill in Title, Instructor Name, and Uploader Comment.');
      return;
    }
    if (!file1) {
      alert('Please select a PDF file to upload.');
      return;
    }
    if (resourceType === 'quiz' && manualMcqs.length === 0 && !file2) {
      const proceed = window.confirm(
        'You haven\'t added any MCQ questions or a Solution PDF.\n\nMode B (Interactive Attempt Mode) will be disabled for this quiz. Do you want to continue?'
      );
      if (!proceed) return;
    } else if (resourceType === 'quiz' && manualMcqs.length === 0) {
      const proceed = window.confirm(
        'You haven\'t added any MCQ questions yet.\n\nIf you proceed, a placeholder question will be used. Do you want to continue without adding questions?\n\nClick Cancel to go back and add questions.'
      );
      if (!proceed) return;
    }

    // Resolve subject
    let finalSubject = subject;
    if (isCreatingNewSubject) {
      const trimmed = newSubjectName.trim();
      if (!trimmed) { alert('Please enter a custom subject name.'); return; }
      finalSubject = trimmed;
      addNewSubject(trimmed);
    }

    const uploadPayload = {
      title: title.trim(),
      uploaderComment: uploaderComment.trim(),
      instructorName: instructorName.trim(),
      subject: finalSubject,
      branch,
      year,
      semester,
      academicYear,
      // Pass the actual File objects
      fileObject: file1,
      solutionFileObject: file2
    };

    if (resourceType === 'pyq') {
      uploadPayload.examType = examType;
    }

    if (resourceType === 'quiz') {
      if (manualMcqs.length > 0) {
        uploadPayload.mcqs = manualMcqs;
      }
    }

    addUpload(resourceType, uploadPayload);
    alert(`✅ "${title}" uploaded successfully under "${finalSubject}"!\nYou earned +10 Karma points.`);

    // Reset form
    setTitle(''); setUploaderComment(''); setInstructorName('');
    setFile1(null); setFile2(null); setManualMcqs([]);
    setActiveTab('home');
  };

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto text-left space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-none">Share Study Resources</h1>
        <p className="text-xs text-slate-400 mt-1">Upload study sheets, exams, or interactive MCQ quizzes to help peers.</p>
      </div>

      {/* Resource Type Toggle */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 border border-slate-800 rounded-xl">
        {['note', 'pyq', 'quiz'].map(type => (
          <button
            key={type}
            type="button"
            onClick={() => { setResourceType(type); setFile1(null); setFile2(null); setManualMcqs([]); }}
            className={`py-2.5 rounded-lg text-xs font-bold transition uppercase tracking-wider ${
              resourceType === type
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {type === 'pyq' ? 'PYQ (Exam Paper)' : type === 'note' ? 'Study Note' : 'Quiz'}
          </button>
        ))}
      </div>

      <form onSubmit={handleFormSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Title + Instructor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resource Title *</label>
            <input
              type="text"
              placeholder="e.g. DBMS Normalization Complete Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructor / Professor *</label>
            <input
              type="text"
              placeholder="e.g. Dr. R. K. Prasad"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition"
              required
            />
          </div>
        </div>

        {/* Subject, Branch, Year, Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subject Selector */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
              <button
                type="button"
                onClick={() => { setIsCreatingNewSubject(!isCreatingNewSubject); setNewSubjectName(''); }}
                className="text-[10px] text-amber-500 font-bold hover:underline"
              >
                {isCreatingNewSubject ? 'Pick Existing' : '+ New'}
              </button>
            </div>
            {isCreatingNewSubject ? (
              <input
                type="text"
                placeholder="Type new subject name..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="bg-slate-950 border border-amber-500/60 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
              />
            ) : (
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
              >
                {subjects.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            )}
          </div>

          {/* Branch */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">College Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
            >
              {branchesList.map((br, idx) => (
                <option key={idx} value={br}>{br}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          {/* Semester + Academic Year */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester & Acad. Year</label>
            <div className="flex gap-2">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="Monsoon">Monsoon</option>
                <option value="Winter">Winter</option>
              </select>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="2024-2025">2024-25</option>
                <option value="2023-2024">2023-24</option>
                <option value="2025-2026">2025-26</option>
              </select>
            </div>
          </div>
        </div>

        {/* PYQ-specific: Exam Type */}
        {resourceType === 'pyq' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="Mid-sem">Mid-Semester</option>
                <option value="End-sem">End-Semester</option>
              </select>
            </div>
          </div>
        )}

        {/* Uploader Comment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Comment / Description *</label>
          <textarea
            placeholder="e.g. Covers all normalization topics. Very useful for GATE prep."
            value={uploaderComment}
            onChange={(e) => setUploaderComment(e.target.value)}
            rows="3"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none transition"
            required
          />
        </div>

        {/* File Upload pickers */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {resourceType === 'quiz' ? 'Attach PDF Files' : 'Attach PDF File'}
          </label>
          <div className={`grid gap-4 ${resourceType === 'quiz' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Primary PDF */}
            <label className={`bg-slate-950 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition block ${
              file1 ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800 hover:border-amber-500/50'
            }`}>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile1(e.target.files[0] || null)}
              />
              {file1 ? (
                <>
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-emerald-400 truncate">{file1.name}</p>
                  <span className="text-[10px] text-slate-500">{(file1.size / 1024 / 1024).toFixed(2)} MB · Click to replace</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-400">
                    {resourceType === 'quiz' ? 'Upload Quiz Questions PDF' : 'Upload Study Sheet PDF'}
                  </p>
                  <span className="text-[10px] text-slate-500">Click to browse · Max 20MB</span>
                </>
              )}
            </label>

            {/* Solution PDF (quiz only) */}
            {resourceType === 'quiz' && (
              <label className={`bg-slate-950 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition block ${
                file2 ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800 hover:border-amber-500/50'
              }`}>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile2(e.target.files[0] || null)}
                />
                {file2 ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-emerald-400 truncate">{file2.name}</p>
                    <span className="text-[10px] text-slate-500">{(file2.size / 1024 / 1024).toFixed(2)} MB · Click to replace</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-400">Upload Solution / Answer Key PDF (Optional)</p>
                    <span className="text-[10px] text-slate-500">Click to browse · Max 20MB</span>
                  </>
                )}
              </label>
            )}
          </div>
        </div>

        {/* MCQ Editor (quiz only) */}
        {resourceType === 'quiz' && (
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">MCQ Questions Editor</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Add your MCQ questions here. These will be used for the interactive attempt mode.
                </p>
              </div>
              {manualMcqs.length > 0 && (
                <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg">
                  {manualMcqs.length} question{manualMcqs.length > 1 ? 's' : ''} added ✓
                </span>
              )}
            </div>

            {/* List of added MCQs */}
            {manualMcqs.length > 0 && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 max-h-52 overflow-y-auto">
                {manualMcqs.map((q, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        <span className="text-amber-500 mr-1">Q{idx + 1}.</span>{q.question}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {q.options.map((opt, i) => (
                          <span key={i} className={`mr-2 ${q.correct === String.fromCharCode(65+i) ? 'text-emerald-400 font-bold' : ''}`}>
                            {String.fromCharCode(65+i)}) {opt}
                          </span>
                        ))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMcq(idx)}
                      className="text-slate-500 hover:text-rose-500 transition shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New MCQ entry form */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <input
                type="text"
                placeholder="Type your MCQ question here..."
                value={mcqQuestion}
                onChange={(e) => setMcqQuestion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mcqOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0 ${
                      correctOption === String.fromCharCode(65+idx)
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}>
                      {String.fromCharCode(65+idx)}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65+idx)} — type here...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center flex-wrap gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Correct Answer:</span>
                  <div className="flex gap-1">
                    {['A', 'B', 'C', 'D'].map(letter => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setCorrectOption(letter)}
                        className={`w-7 h-7 rounded-lg font-black text-xs transition ${
                          correctOption === letter
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-amber-500/40'
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMcq}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-500 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Warning if no MCQs added */}
            {manualMcqs.length === 0 && (
              <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-300">
                  <strong>No questions added yet.</strong> The interactive attempt mode requires at least 1 MCQ question. Add questions above or upload the quiz without MCQs for PDF-only viewing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>Upload {resourceType.toUpperCase()} &amp; Earn +10 Karma</span>
        </button>
      </form>
    </div>
  );
};

export default Upload;
