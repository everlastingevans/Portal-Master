'use client';

import { useState, useRef } from 'react';
import { Upload, File, Film, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface S3DirectUploaderProps {
  onUploadSuccess?: (attachment: any) => void;
  defaultCategory?: 'videos' | 'documents' | 'resumes';
}

export default function S3DirectUploader({
  onUploadSuccess,
  defaultCategory = 'documents',
}: S3DirectUploaderProps) {
  const [category, setCategory] = useState<'videos' | 'documents' | 'resumes'>(defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage('');
    setUploadStatus('idle');
    setUploadProgress(0);

    const type = selectedFile.type.toLowerCase();

    // Perform validation depending on the selected category
    if (category === 'videos') {
      const allowedVideos = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!allowedVideos.includes(type)) {
        setErrorMessage('Invalid file type for Videos. Please upload MP4, WebM, OGG, or QuickTime.');
        setFile(null);
        return;
      }
    } else if (category === 'resumes') {
      const allowedDocs = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedDocs.includes(type)) {
        setErrorMessage('Invalid file type for Resumes. Please upload PDF, DOC, or DOCX.');
        setFile(null);
        return;
      }
    } else {
      // standard documents
      const allowedDocs = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      if (!allowedDocs.includes(type)) {
        setErrorMessage('Invalid file type for Documents. Please upload PDF, Word, Excel, or TXT.');
        setFile(null);
        return;
      }
    }

    setFile(selectedFile);
  };

  const uploadFileDirectly = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      // Step 1: Request AWS S3 Presigned PUT URL from our Next.js API Route
      const presignResponse = await fetch('/api/storage/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          category: category,
        }),
      });

      if (!presignResponse.ok) {
        const errData = await presignResponse.json();
        throw new Error(errData.error || 'Failed to obtain S3 presigned upload URL.');
      }

      const { uploadUrl, publicUrl, s3Key, filename, contentType } = await presignResponse.json();

      // Step 2: Use XMLHttpRequest to upload file directly to S3 with real-time progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        // Monitor Upload Progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentage);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else {
            reject(new Error(`AWS S3 Upload failed with HTTP status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during direct S3 file upload.'));
        };

        xhr.send(file);
      });

      // Step 3: Log Upload metadata inside Neon PostgreSQL Database using Prisma client
      const dbLogResponse = await fetch('/api/storage/log-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key,
          url: publicUrl,
          name: filename,
          size: file.size,
          type: category,
          mimeType: contentType,
        }),
      });

      if (!dbLogResponse.ok) {
        const errData = await dbLogResponse.json();
        throw new Error(errData.error || 'Successfully uploaded to S3, but failed to log in the database.');
      }

      const dbLogResult = await dbLogResponse.json();

      setUploadStatus('success');
      setUploadedUrl(publicUrl);
      if (onUploadSuccess) {
        onUploadSuccess(dbLogResult.attachment);
      }
    } catch (error: any) {
      console.error('[UPLOAD HANDLER EXCEPTION]', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Direct upload process failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadedUrl('');
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md p-6 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Secure AWS S3 Direct Uploader
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supports large payload streaming bypassing Vercel serverless limitations
          </p>
        </div>
        <div className="bg-[#5D3FD3]/15 text-[#5D3FD3] dark:text-violet-300 font-semibold text-xs px-2.5 py-1 rounded-md">
          S3 Presigned Direct-to-Bucket
        </div>
      </div>

      {/* Category selector */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
          Repository Prefix Namespace
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['videos', 'documents', 'resumes'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              disabled={isUploading}
              onClick={() => {
                setCategory(cat);
                handleClear();
              }}
              className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all capitalize flex items-center justify-center gap-1.5 ${
                category === cat
                  ? 'bg-[#5D3FD3] text-white border-[#5D3FD3] shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              } disabled:opacity-50`}
            >
              {cat === 'videos' && <Film className="w-4 h-4" />}
              {cat === 'documents' && <File className="w-4 h-4" />}
              {cat === 'resumes' && <File className="w-4 h-4 text-rose-500" />}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop Canvas */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-[#5D3FD3] bg-[#5D3FD3]/5'
            : 'border-slate-300 dark:border-slate-700 hover:border-[#5D3FD3]/50'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {category === 'videos' ? (
          <Film className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
        ) : (
          <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-3" />
        )}

        {file ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 max-w-sm truncate mx-auto">
              {file.name}
            </p>
            <p className="text-xs text-slate-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Unknown Type'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Drag & drop files here, or <span className="text-[#5D3FD3]">browse</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {category === 'videos' && 'Allowed formats: MP4, WebM, OGG, QuickTime (unlimited size)'}
              {category === 'documents' && 'Allowed formats: PDF, Word, Excel, TXT (up to 100MB+)'}
              {category === 'resumes' && 'Allowed formats: PDF, DOC, DOCX (Highly Secure namespace)'}
            </p>
          </div>
        )}
      </div>

      {/* Progress & Status Indicators */}
      {uploadStatus === 'uploading' && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5D3FD3]" />
              Streaming directly to AWS S3...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#5D3FD3] h-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mt-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
              Direct S3 Upload Succeeded
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              The file is securely preserved inside the <span className="font-semibold">media/{category}/</span> namespace. Metadata successfully synchronized with Neon DB.
            </p>
            {uploadedUrl && (
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-800 dark:text-emerald-300 underline block mt-2 hover:opacity-80 break-all"
              >
                Access File URL
              </a>
            )}
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">Upload Failed</h4>
            <p className="text-xs text-rose-700 dark:text-rose-400">{errorMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && uploadStatus === 'idle' && (
        <div className="mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-400">{errorMessage}</p>
        </div>
      )}

      {/* Upload button action footer */}
      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        {file && (
          <button
            type="button"
            disabled={isUploading}
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          disabled={!file || isUploading}
          onClick={uploadFileDirectly}
          className="bg-[#5D3FD3] text-white hover:bg-indigo-700 px-5 py-2 rounded-lg text-sm font-bold shadow transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
        >
          {isUploading && <RefreshCw className="w-4 h-4 animate-spin" />}
          {isUploading ? 'Uploading...' : 'Initiate S3 Direct Upload'}
        </button>
      </div>
    </div>
  );
}
