import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Star, Download, Play, Bookmark, Flame, Check, HelpCircle, FileText, Sparkles } from 'lucide-react';

const Home = ({ onNavigateDetail }) => {
  const { notes, pyqs, quizzes, bookmarks, toggleBookmark, currentUser, subjects, branchesList } = useContext(AppContext);
  const [activeSubTab, setActiveSubTab] = useState('notes'); // notes, pyqs, quizzes
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic filter dropdown states
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterExamType, setFilterExamType] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [filterAcademicYear, setFilterAcademicYear] = useState('All');

  // Helpers to check bookmark state
  const isBookmarked = (type, id) => {
    return bookmarks.some(b => b.type === type && String(b.refId) === String(id));
  };

  // Combine items for the Trending Top Section
  const getTrendingItems = () => {
    const allNotes = notes.map(n => ({ ...n, type: 'note', score: n.weeklyDownloads || n.downloadCount || 0 }));
    const allPyqs = pyqs.map(p => ({ ...p, type: 'pyq', score: p.weeklyDownloads || p.downloadCount || 0 }));
    const allQuizzes = quizzes.map(q => ({ ...q, type: 'quiz', score: q.weeklyAttempts || q.attemptCount || 0 }));
    
    return [...allNotes, ...allPyqs, ...allQuizzes]
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  };
  const trendingItems = getTrendingItems();

  // Filter lists based on selected configurations
  const getFilteredItems = () => {
    if (activeSubTab === 'notes') {
      return notes.filter(note => {
        const matchSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            note.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchBranch = filterBranch === 'All' || note.branch === filterBranch;
        const matchYear = filterYear === 'All' || note.year === filterYear;
        const matchSubject = filterSubject === 'All' || note.subject === filterSubject;
        return matchSearch && matchBranch && matchYear && matchSubject;
      });
    } else if (activeSubTab === 'pyqs') {
      return pyqs.filter(pyq => {
        const matchSearch = pyq.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            pyq.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSubject = filterSubject === 'All' || pyq.subject === filterSubject;
        const matchExam = filterExamType === 'All' || pyq.examType === filterExamType;
        const matchSem = filterSemester === 'All' || pyq.semester === filterSemester;
        const matchAcadYear = filterAcademicYear === 'All' || pyq.academicYear === filterAcademicYear;
        const matchYear = filterYear === 'All' || pyq.year === filterYear;
        return matchSearch && matchSubject && matchExam && matchSem && matchAcadYear && matchYear;
      });
    } else if (activeSubTab === 'quizzes') {
      return quizzes.filter(quiz => {
        const matchSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            quiz.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSubject = filterSubject === 'All' || quiz.subject === filterSubject;
        const matchSem = filterSemester === 'All' || quiz.semester === filterSemester;
        const matchAcadYear = filterAcademicYear === 'All' || quiz.academicYear === filterAcademicYear;
        const matchYear = filterYear === 'All' || quiz.year === filterYear;
        return matchSearch && matchSubject && matchSem && matchAcadYear && matchYear;
      });
    }
    return [];
  };

  const filteredList = getFilteredItems();

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Trending Banner Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">Trending This Week</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingItems.map(item => {
            const itemId = String(item._id || item.id);
            return (
            <div
              key={itemId}
              onClick={() => onNavigateDetail(item.type, itemId)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/50 hover:bg-slate-900/80 cursor-pointer shadow-md transition-all duration-300 relative overflow-hidden group"
            >
              {/* Hot badge overlay */}
              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg shadow flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 fill-slate-950" />
                <span>HOT</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-widest block mb-1">
                  {item.type.toUpperCase()} • {item.subject}
                </span>
                <h3 className="font-semibold text-slate-200 text-sm leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
              </div>

              <div className="flex justify-between items-center mt-4 border-t border-slate-800/60 pt-3">
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                  By {item.uploaderName || 'Instructor'}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Download className="w-3 h-3 text-slate-500" />
                  {item.downloadCount || item.attemptCount || 0}
                </span>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Tabs Selector */}
      <div className="flex justify-center border-b border-slate-800 pb-px">
        <div className="flex gap-2">
          {['notes', 'pyqs', 'quizzes'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveSubTab(tab);
                setSearchQuery('');
                setFilterBranch('All');
                setFilterYear('All');
                setFilterSubject('All');
                setFilterExamType('All');
                setFilterSemester('All');
                setFilterAcademicYear('All');
              }}
              className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider relative transition-all duration-200 ${
                activeSubTab === tab ? 'text-amber-500' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'pyqs' ? 'PYQs (Exams)' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeSubTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search Bar and Filter Controls Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg text-left">
        {/* Dynamic Filters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          {/* Main search text field */}
          <div className="sm:col-span-2 md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Keywords</label>
            <input
              type="text"
              placeholder={`Search within ${activeSubTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-slate-200 transition"
            />
          </div>

          {/* Subject Dropdown Selector (Common to all tabs) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="All">All Subjects</option>
              {subjects.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Year Dropdown Selector (Common to all tabs) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
            >
              <option value="All">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          {/* Academic Semester Selector (For PYQs and Quizzes) */}
          {(activeSubTab === 'pyqs' || activeSubTab === 'quizzes') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semester</label>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="All">All Semesters</option>
                <option value="Monsoon">Monsoon</option>
                <option value="Winter">Winter</option>
              </select>
            </div>
          )}

          {/* Notes specific filters: Branch */}
          {activeSubTab === 'notes' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch</label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="All">All Branches</option>
                {branchesList.map((br, idx) => (
                  <option key={idx} value={br}>{br}</option>
                ))}
              </select>
            </div>
          )}

          {/* PYQs specific filters: Exam Type & Academic Year */}
          {activeSubTab === 'pyqs' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Type</label>
                <select
                  value={filterExamType}
                  onChange={(e) => setFilterExamType(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="All">All Exams</option>
                  <option value="Mid-sem">Mid-Sem</option>
                  <option value="End-sem">End-Sem</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Year</label>
                <select
                  value={filterAcademicYear}
                  onChange={(e) => setFilterAcademicYear(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="All">All Years</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
              </div>
            </>
          )}

          {/* Quizzes specific filters: Academic Year */}
          {activeSubTab === 'quizzes' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Year</label>
              <select
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="All">All Years</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4. Active Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {filteredList.length === 0 ? (
          <div className="col-span-full py-16 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-500 space-y-2">
            <p className="text-lg font-semibold text-slate-400">No resources found</p>
            <p className="text-xs">Try adjusting your filters or query text keywords.</p>
          </div>
        ) : (
          filteredList.map(item => {
            const itemId = String(item._id || item.id);
            const followed = currentUser?.followedSubjects?.includes(item.subject);
            const itemType = activeSubTab === 'quizzes' ? 'quiz' : activeSubTab.slice(0, -1);
            const starred = isBookmarked(itemType, itemId);
            const isItemTrending = trendingItems.some(ti => ti.id === itemId && ti.type === itemType);
            return (
              <div
                key={itemId}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between overflow-hidden shadow-md group transition duration-300"
              >
                {/* Card Header metadata */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-extrabold text-amber-500 tracking-wider">
                          {item.subject}
                        </span>
                        {followed && (
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md px-1.5 py-0.5">
                            Followed
                          </span>
                        )}
                        {isItemTrending && (
                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 fill-amber-400/20 text-amber-400" />
                            Trending
                          </span>
                        )}
                      </div>
                      <h3
                        onClick={() => onNavigateDetail(itemType, itemId)}
                        className="font-bold text-slate-100 hover:text-amber-400 text-base leading-snug tracking-tight mt-1 cursor-pointer line-clamp-2"
                      >
                        {item.title}
                      </h3>
                    </div>

                    {/* Bookmark Toggle Icon Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(itemType, itemId);
                      }}
                      className={`p-2 rounded-xl border transition ${
                        starred
                          ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 italic mb-4">
                    "{item.uploaderComment || 'No comment provided by uploader.'}"
                  </p>

                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                    <p className="flex justify-between">
                      <span className="font-semibold">Instructor:</span>
                      <span className="text-slate-300 font-medium">{item.instructorName}</span>
                    </p>
                    <p className="flex justify-between">
                      {activeSubTab === 'notes' ? (
                        <>
                          <span className="font-semibold">Branch & Year:</span>
                          <span className="text-slate-300 font-medium">{item.branch} • {item.year}</span>
                        </>
                      ) : activeSubTab === 'pyqs' ? (
                        <>
                          <span className="font-semibold">Exam, Sem & Year:</span>
                          <span className="text-slate-300 font-medium">{item.examType} ({item.semester}) • {item.year || 'N/A'}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">Questions & Year:</span>
                          <span className="text-slate-300 font-medium">{(item.mcqs || []).length} MCQs • {item.year || 'N/A'}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="bg-slate-950 border-t border-slate-800/60 px-5 py-3 flex justify-between items-center text-xs">
                  {/* Rating / Metadata Column */}
                  <div>
                    {activeSubTab === 'quizzes' ? (
                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                        <Play className="w-3.5 h-3.5 fill-slate-400 text-slate-400" />
                        {item.attemptCount || 0} attempts
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 flex items-center gap-1 font-semibold">
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          {item.downloadCount || 0}
                        </span>
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="text-amber-500 flex items-center gap-0.5 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          {item.ratingAverage || 'New'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Primary Trigger Button */}
                  <button
                    onClick={() => onNavigateDetail(itemType, itemId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 text-slate-200 hover:text-amber-400 text-xs font-bold transition duration-200"
                  >
                    <span>View Detail</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Home;
