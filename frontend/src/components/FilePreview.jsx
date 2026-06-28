import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, FileX, FileText, Eye, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Setup pdf.js worker for React-PDF
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FilePreview = ({ title, filename, fileUrl, onDownload }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  
  const hasFile = fileUrl && fileUrl !== '#';

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleDownload = () => {
    if (onDownload) onDownload();
    if (hasFile) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInTab = () => {
    if (hasFile) window.open(fileUrl, '_blank');
  };

  const getProxyUrl = (url) => {
    if (!url) return url;
    // Cloudinary PDF block bypass: proxy through our backend
    if (url.includes('cloudinary.com')) {
      return `http://localhost:5000/api/materials/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Header bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[180px] sm:max-w-sm">
            {filename || 'document.pdf'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasFile && (
            <>
              <button
                onClick={() => setPreviewOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  previewOpen
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{previewOpen ? 'Close Preview' : 'Preview PDF'}</span>
              </button>
              <button
                onClick={handleOpenInTab}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Body */}
      {!hasFile ? (
        /* No PDF uploaded yet */
        <div className="flex flex-col items-center justify-center gap-4 py-14 px-6 text-center bg-slate-950">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <FileX className="w-7 h-7 text-slate-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-300">No PDF Available</p>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Upload a real PDF when submitting a resource to enable inline preview and download.
            </p>
          </div>
        </div>
      ) : !previewOpen ? (
        /* Collapsed — show click-to-preview prompt */
        <button
          onClick={() => setPreviewOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-3 py-14 px-6 bg-slate-950 hover:bg-slate-900 transition group cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-900 group-hover:bg-slate-800 border border-slate-800 group-hover:border-amber-500/30 flex items-center justify-center transition">
            <Eye className="w-7 h-7 text-slate-500 group-hover:text-amber-500 transition" />
          </div>
          <div className="space-y-0.5 text-center">
            <p className="text-sm font-bold text-slate-300 group-hover:text-slate-100 transition">Click to Preview PDF</p>
            <p className="text-xs text-slate-500">Loads the document inline securely</p>
          </div>
        </button>
      ) : (
        /* React-PDF Canvas Renderer */
        <div className="w-full flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
          {/* PDF Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="min-w-[60px] text-center">
                  Page {pageNumber} of {numPages || '--'}
                </span>
                <button
                  disabled={pageNumber >= numPages}
                  onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1">
                <button
                  onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
            <a 
              href={fileUrl} 
              target="_blank" 
              className="text-xs text-amber-500 hover:text-amber-400 font-bold"
            >
              Raw Link
            </a>
          </div>

          {/* PDF Canvas Container */}
          <div className="w-full h-[640px] overflow-auto flex justify-center bg-slate-950 p-4 custom-scrollbar">
            <Document
              file={getProxyUrl(fileUrl)}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center justify-center gap-3 h-full">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  <span className="text-xs text-slate-400">Rendering document...</span>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <FileX className="w-8 h-8 text-slate-500" />
                  <p className="text-sm font-bold text-slate-300">Failed to load PDF</p>
                  <button onClick={handleDownload} className="mt-2 text-xs font-bold text-amber-500 hover:text-amber-400">
                    Download File Instead
                  </button>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-xl"
              />
            </Document>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
