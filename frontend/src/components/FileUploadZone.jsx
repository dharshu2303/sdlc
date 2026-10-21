import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, FileCheck, X } from 'lucide-react';

export default function FileUploadZone({ onFileSelected, acceptedFormats = '.pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.txt,.md' }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (file) => {
    if (!file) return;
    const bytes = file.size || 0;
    let sizeStr = '';
    if (bytes >= 1024 * 1024) {
      sizeStr = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      sizeStr = (bytes / 1024).toFixed(1) + ' KB';
    } else {
      sizeStr = `${bytes} B`;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    const filePayload = {
      name: file.name,
      size: sizeStr,
      type: ext,
      rawFile: file
    };

    // Convert to base64 payload for store transmission
    const reader = new FileReader();
    reader.onload = (e) => {
      filePayload.data = e.target.result;
      setSelectedFile(filePayload);
      if (onFileSelected) onFileSelected(filePayload);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3 text-xs">
      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
          }`}
        >
          <input
            type="file"
            accept={acceptedFormats}
            id="file-upload-input"
            className="hidden"
            onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
          />
          <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
            <UploadCloud className="w-8 h-8 text-brand-400 mx-auto" />
            <div className="font-bold text-white text-xs">
              Drag & Drop your document file here, or <span className="text-brand-400 underline">browse</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Supports PDF (.pdf), Word (.docx), Excel (.xlsx), Text (.txt), Images (.png, .jpg)
            </p>
          </label>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/40 flex items-center justify-center font-bold uppercase text-xs">
              {selectedFile.type}
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-2">
                <span>{selectedFile.name}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                File Size: <strong>{selectedFile.size}</strong> &bull; Ready for upload
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (onFileSelected) onFileSelected(null);
            }}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
