
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ScoreChart } from './components/ScoreChart';
import { analyzeResume } from './services/geminiService';
import { extractTextFromPdf } from './services/pdfService';
import { ResumeAnalysis, AnalysisHistoryItem } from './types';

const MAX_FILE_SIZE_MB = 5;
const SUPPORTED_MIME_TYPES = {
  PDF: ['application/pdf'],
  IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
  TEXT: ['text/plain']
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('resume_analysis_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (newAnalysis: ResumeAnalysis) => {
    const historyItem: AnalysisHistoryItem = {
      id: newAnalysis.id,
      name: newAnalysis.personalInfo.name || 'Untitled',
      overallScore: newAnalysis.score.overall,
      timestamp: newAnalysis.timestamp,
    };
    const updatedHistory = [historyItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('resume_analysis_history', JSON.stringify(updatedHistory));
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError('Please paste your resume text first.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeResume(inputText);
      setAnalysis(result);
      saveToHistory(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);

    // 1. Validate File Size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      setError(`File is too large (${fileSizeInMB.toFixed(1)}MB). Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setIsProcessingFile(true);

    try {
      // 2. Validate MIME Type and Process accordingly
      if (SUPPORTED_MIME_TYPES.PDF.includes(file.type)) {
        const text = await extractTextFromPdf(file);
        if (!text || text.trim().length < 50) {
          throw new Error('We could not extract enough text from this PDF. It might be empty, password-protected, or a scanned image. Please try an image upload or copy-pasting text.');
        }
        setInputText(text);
      } else if (SUPPORTED_MIME_TYPES.IMAGE.includes(file.type)) {
        const reader = new FileReader();
        reader.onerror = () => { throw new Error('Failed to read image file.'); };
        reader.onload = async (event) => {
          const base64Data = event.target?.result?.toString().split(',')[1];
          if (base64Data) {
            setIsAnalyzing(true);
            try {
              const result = await analyzeResume({ data: base64Data, mimeType: file.type });
              setAnalysis(result);
              saveToHistory(result);
            } catch (err: any) {
              setError('Failed to analyze the resume image. Ensure the image is clear and contains readable text.');
            } finally {
              setIsAnalyzing(false);
            }
          }
        };
        reader.readAsDataURL(file);
      } else if (SUPPORTED_MIME_TYPES.TEXT.includes(file.type)) {
        const reader = new FileReader();
        reader.onerror = () => { throw new Error('Failed to read text file.'); };
        reader.onload = (event) => {
          const text = event.target?.result?.toString() || '';
          if (text.trim().length < 50) {
            setError('The uploaded text file seems too short to be a complete resume.');
          }
          setInputText(text);
        };
        reader.readAsText(file);
      } else {
        const extension = file.name.split('.').pop()?.toUpperCase();
        throw new Error(`Unsupported file type: ${extension || 'Unknown'}. Please upload a PDF, Image (JPG, PNG, WebP), or Text file.`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while processing your file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <section className="lg:col-span-5 space-y-6">
          <div 
            className={`bg-white rounded-xl shadow-sm border p-6 transition-all duration-300 relative ${
              isDragging ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' : 'border-slate-200'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 z-10 bg-indigo-600/5 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce mb-4">
                  <i className="fas fa-file-arrow-up text-2xl"></i>
                </div>
                <p className="text-indigo-600 font-bold text-lg">Drop your resume here</p>
                <p className="text-indigo-500 text-sm">PDF, JPG, PNG, or TXT</p>
              </div>
            )}

            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fas fa-edit text-indigo-500"></i>
                Input Resume
              </span>
              {isProcessingFile && (
                <span className="text-xs text-indigo-500 font-medium animate-pulse">
                  <i className="fas fa-circle-notch fa-spin mr-1"></i>
                  Processing File...
                </span>
              )}
            </h2>
            
            <div className="relative group">
              <textarea
                className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm font-mono leading-relaxed"
                placeholder="Paste your resume text here, upload a PDF, or an image..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessingFile}
              />
              {!inputText && !isProcessingFile && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                  <i className="fas fa-paste text-4xl mb-2 text-slate-400"></i>
                  <p className="text-xs font-medium text-slate-500">Paste Text or Drag File</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile || isAnalyzing}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <i className="fas fa-file-upload text-indigo-500"></i>
                Upload File
              </button>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                accept=".txt,.pdf,.jpg,.jpeg,.png,.webp" 
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isProcessingFile || !inputText.trim()}
                className={`flex-[2] px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAnalyzing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt"></i>
                    Analyze Now
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-red-600 text-xs flex items-start gap-1">
                  <i className="fas fa-exclamation-circle mt-0.5"></i> 
                  <span>{error}</span>
                </p>
              </div>
            )}
            <p className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold">
              Supported formats: PDF, PNG, JPG, WebP, TXT (Max 5MB)
            </p>
          </div>

          {/* History Sidebar */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Recent Analyses
              </h2>
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-transparent hover:border-indigo-100 transition-all cursor-pointer group">
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-indigo-600">{item.name}</h4>
                      <p className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-white rounded-full text-xs font-bold border border-slate-100 shadow-sm text-indigo-600">
                      {item.overallScore}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Results Section */}
        <section className="lg:col-span-7 space-y-8">
          {!analysis && !isAnalyzing && (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-chart-line text-2xl text-slate-300"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-700">Analysis Pending</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Paste your resume text or upload a file on the left to see your AI-powered feedback.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center animate-pulse">
              <div className="flex justify-center gap-2 mb-6">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-3 h-3 bg-violet-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-300"></div>
              </div>
              <h3 className="text-lg font-bold text-slate-800">Gemini is reading your resume...</h3>
              <p className="text-slate-500 text-sm mt-2">Checking impact, formatting, and key skills.</p>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {/* Score Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        className="text-slate-100"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={440}
                        strokeDashoffset={440 - (440 * analysis.score.overall) / 100}
                        className="text-indigo-600 transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black text-slate-800">{analysis.score.overall}%</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-bold text-slate-800">
                      {analysis.score.overall >= 80 ? 'Excellent!' : analysis.score.overall >= 60 ? 'Good Start' : 'Needs Work'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Based on recruiter standards</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Metric Breakdown</h3>
                  <ScoreChart scores={analysis.score} />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <i className="fas fa-quote-left text-indigo-400"></i>
                  Executive Summary
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {analysis.summary}
                </p>
              </div>

              {/* Improvements */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <i className="fas fa-tools text-orange-400"></i>
                  Key Improvements
                </h3>
                <div className="space-y-4">
                  {analysis.improvements.map((imp, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 group hover:shadow-md transition-all">
                      <div className={`w-2 self-stretch rounded-full ${imp.priority === 'High' ? 'bg-red-400' : imp.priority === 'Medium' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800">{imp.category}</h4>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            imp.priority === 'High' ? 'bg-red-50 text-red-600' : 
                            imp.priority === 'Medium' ? 'bg-orange-50 text-orange-600' : 
                            'bg-green-50 text-green-600'
                          }`}>
                            {imp.priority} Priority
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-snug">{imp.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracted Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <i className="fas fa-brain text-purple-400"></i>
                    Skills Extracted
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.sections.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <i className="fas fa-graduation-cap text-blue-400"></i>
                    Upskilling Path
                  </h3>
                  <ul className="space-y-2">
                    {analysis.upskilling.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <i className="fas fa-check-circle text-green-500 text-xs"></i>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Experience Details */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <i className="fas fa-briefcase text-slate-400"></i>
                  Extracted Experience
                </h3>
                <div className="space-y-6">
                  {analysis.sections.experience.map((exp, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-slate-100">
                      <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1"></div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-800">{exp.role}</h4>
                        <span className="text-xs text-slate-400 font-medium">{exp.duration}</span>
                      </div>
                      <p className="text-sm font-semibold text-indigo-600 mb-2">{exp.company}</p>
                      <ul className="space-y-1">
                        {exp.description.map((desc, dIdx) => (
                          <li key={dIdx} className="text-sm text-slate-500 leading-relaxed flex gap-2">
                            <span className="text-indigo-300">•</span>
                            {desc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Persistent CTA or info bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 shadow-2xl z-20 md:hidden px-4">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
        >
          <i className="fas fa-arrow-up"></i>
          Back to Analyzer
        </button>
      </div>
    </div>
  );
};

export default App;
