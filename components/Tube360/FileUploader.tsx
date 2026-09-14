/**
 * TUBE360 FileUploader — drag & drop / pick files, upload each straight to
 * Vercel Blob with a progress bar, remove or retry per file.
 *
 * Only successfully uploaded files are reported to the parent (onChange) and
 * persisted by the context, so "Back" and page reloads keep them.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { COLORS } from '../Trac360/styles';
import { checkFile, uploadTube360File } from '../../lib/tube360/api';
import { formatBytes } from '../../utils/tube360/validation';
import type { Tube360Options, Tube360UploadedFile } from '../../types/tube360';

type ItemStatus = 'uploading' | 'done' | 'error';

interface UploadItem {
  key: string;
  name: string;
  size: number;
  status: ItemStatus;
  progress: number;
  error?: string;
  /** Kept only for retry of a failed upload. */
  file?: File;
  uploaded?: Tube360UploadedFile;
}

interface FileUploaderProps {
  options: Tube360Options;
  files: Tube360UploadedFile[];
  onChange: (files: Tube360UploadedFile[]) => void;
  /** Tells the page whether any upload is still running (to block Continue). */
  onBusyChange: (busy: boolean) => void;
}

let keySeq = 0;
const nextKey = () => `f${Date.now()}-${keySeq++}`;

export default function FileUploader({ options, files, onChange, onBusyChange }: FileUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>(() =>
    files.map((f) => ({ key: nextKey(), name: f.name, size: f.size, status: 'done' as ItemStatus, progress: 100, uploaded: f }))
  );
  const [banner, setBanner] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Report done files + busy state upward whenever items change.
  useEffect(() => {
    onChange(items.filter((i) => i.status === 'done' && i.uploaded).map((i) => i.uploaded as Tube360UploadedFile));
    onBusyChange(items.some((i) => i.status === 'uploading'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const patchItem = (key: string, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const startUpload = useCallback(
    (key: string, file: File) => {
      patchItem(key, { status: 'uploading', progress: 0, error: undefined, file });
      uploadTube360File(file, options, (pct) => patchItem(key, { progress: pct }))
        .then((uploaded) => patchItem(key, { status: 'done', progress: 100, uploaded, file: undefined }))
        .catch((err: Error) => patchItem(key, { status: 'error', error: err.message || 'Upload failed' }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options]
  );

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBanner('');
    const incoming = Array.from(list);
    const activeCount = items.filter((i) => i.status !== 'error').length;
    const room = options.uploads.maxFiles - activeCount;
    if (room <= 0) {
      setBanner(`You can upload up to ${options.uploads.maxFiles} files.`);
      return;
    }
    if (incoming.length > room) {
      setBanner(`You can upload up to ${options.uploads.maxFiles} files - only the first ${room} were added.`);
    }
    incoming.slice(0, room).forEach((file) => {
      const key = nextKey();
      const problem = checkFile(file, options);
      if (problem) {
        setItems((prev) => [...prev, { key, name: file.name, size: file.size, status: 'error', progress: 0, error: problem }]);
        return;
      }
      setItems((prev) => [...prev, { key, name: file.name, size: file.size, status: 'uploading', progress: 0, file }]);
      startUpload(key, file);
    });
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const accept = options.uploads.fileTypes.map((t) => `.${t.ext}`).join(',');
  const maxMb = Math.round(options.uploads.maxFileSizeBytes / (1024 * 1024));

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className="w-full rounded-3xl px-6 py-10 text-center cursor-pointer transition-all"
        style={{
          background: dragOver ? 'rgba(250, 204, 21, 0.12)' : 'rgba(255, 255, 255, 0.7)',
          border: `2px dashed ${dragOver ? COLORS.yellow.primary : 'rgba(250, 204, 21, 0.6)'}`,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3" aria-hidden="true">
          <path d="M12 16V4M12 4l-5 5M12 4l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" stroke={COLORS.grey.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="font-semibold" style={{ color: COLORS.grey.dark }}>
          Drag &amp; drop your files here, or <span style={{ color: '#a16207', textDecoration: 'underline' }}>browse</span>
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.grey.medium }}>
          Up to {options.uploads.maxFiles} files, {maxMb} MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {banner && (
        <p role="alert" className="text-sm text-center" style={{ color: COLORS.error }}>
          {banner}
        </p>
      )}

      {/* File list */}
      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.key}
              className="rounded-2xl px-4 py-3"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                border: `1px solid ${item.status === 'error' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(200, 200, 200, 0.4)'}`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.grey.dark }} title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: item.status === 'error' ? COLORS.error : COLORS.grey.medium }}>
                    {formatBytes(item.size)} &middot;{' '}
                    {item.status === 'uploading' && `Uploading ${item.progress}%`}
                    {item.status === 'done' && <span style={{ color: COLORS.success }}>Uploaded &#10003;</span>}
                    {item.status === 'error' && (item.error || 'Upload failed')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === 'error' && item.file && (
                    <button
                      type="button"
                      onClick={() => startUpload(item.key, item.file as File)}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ background: COLORS.yellow.primary, color: '#000' }}
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={item.status === 'uploading'}
                    onClick={() => removeItem(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1.5 rounded-lg border transition-colors"
                    style={{
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      background: 'rgba(254, 226, 226, 0.8)',
                      color: '#dc2626',
                      opacity: item.status === 'uploading' ? 0.4 : 1,
                      cursor: item.status === 'uploading' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {item.status === 'uploading' && (
                <div className="w-full h-2 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${item.progress}%`,
                      background: 'linear-gradient(90deg, rgba(250, 204, 21, 0.9) 0%, rgba(255, 215, 0, 0.95) 50%, rgba(250, 204, 21, 1) 100%)',
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
