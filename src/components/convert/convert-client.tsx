'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileUp, ArrowRight, Coins, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { calculateTokenCost, ALLOWED_CONVERSIONS } from '@/lib/conversion-utils';

const CONVERSION_OPTIONS: Record<string, { label: string; options: { mime: string; label: string }[] }> = {
  'image/png': {
    label: 'PNG Image',
    options: [
      { mime: 'image/jpeg', label: 'JPG' },
      { mime: 'image/webp', label: 'WebP' },
    ],
  },
  'image/jpeg': {
    label: 'JPG Image',
    options: [
      { mime: 'image/png', label: 'PNG' },
      { mime: 'image/webp', label: 'WebP' },
    ],
  },
  'image/webp': {
    label: 'WebP Image',
    options: [
      { mime: 'image/png', label: 'PNG' },
      { mime: 'image/jpeg', label: 'JPG' },
    ],
  },
  'application/pdf': {
    label: 'PDF Document',
    options: [{ mime: 'text/plain', label: 'TXT' }],
  },
  'text/plain': {
    label: 'Text File',
    options: [{ mime: 'application/pdf', label: 'PDF' }],
  },
};

interface ConvertClientProps {
  balance: number;
}

export function ConvertClient({ balance: initialBalance }: ConvertClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [outputMime, setOutputMime] = useState('');
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState('');
  const [downloadToken, setDownloadToken] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const inputMime = file?.type ?? '';
  const conversionOptions = CONVERSION_OPTIONS[inputMime] ?? null;

  const estimatedCost = file && outputMime
    ? calculateTokenCost(file.size, inputMime, outputMime)
    : null;

  function handleFileChange(f: File | null) {
    if (!f) return;
    const allowed = Object.keys(CONVERSION_OPTIONS);
    if (!allowed.includes(f.type)) {
      toast({ title: 'Unsupported file type', description: `Allowed: PNG, JPG, WebP, PDF, TXT`, variant: 'destructive' });
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum 50MB allowed.', variant: 'destructive' });
      return;
    }
    setFile(f);
    setOutputMime('');
    setJobId(null);
    setJobStatus('');
    setDownloadToken('');
    setError('');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileChange(droppedFile);
  }

  function pollJobStatus(id: string) {
    pollingRef.current = setInterval(async () => {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const status = data.job.status;
      setJobStatus(status);
      if (status === 'DONE') {
        setDownloadToken(data.job.downloadToken);
        clearInterval(pollingRef.current!);
        toast({ title: 'Conversion complete!', description: 'Your file is ready to download.' });
      } else if (status === 'FAILED' || status === 'CANCELED') {
        setError(data.job.error ?? 'Job failed');
        clearInterval(pollingRef.current!);
        toast({ title: 'Conversion failed', description: data.job.error, variant: 'destructive' });
      }
    }, 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !outputMime) return;

    setUploading(true);
    setError('');
    setJobId(null);
    setJobStatus('');

    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({ outputMime });
    if (resizeWidth) params.set('resizeWidth', resizeWidth);
    if (resizeHeight) params.set('resizeHeight', resizeHeight);

    const res = await fetch(`/api/convert?${params}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error);
      toast({ title: 'Upload failed', description: data.error, variant: 'destructive' });
    } else {
      setJobId(data.jobId);
      setJobStatus('QUEUED');
      toast({ title: 'Job queued!', description: `Cost: ${data.costTokens} tokens` });
      pollJobStatus(data.jobId);
    }
  }

  const isImage = inputMime.startsWith('image/');

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Convert a file</h1>
        <p className="text-muted-foreground mt-1">
          Balance: <span className="text-primary font-medium">{initialBalance} tokens</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <div
          className={`glass rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragOver ? 'border-primary/70 bg-primary/5' : 'hover:border-primary/30'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileUp className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · {conversionOptions?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Drop file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WebP, PDF, TXT · Max 50MB</p>
            </>
          )}
        </div>

        {/* Output format */}
        {file && conversionOptions && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Output format</label>
              <div className="flex gap-2">
                {conversionOptions.options.map((opt) => (
                  <button
                    key={opt.mime}
                    type="button"
                    onClick={() => setOutputMime(opt.mime)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      outputMime === opt.mime
                        ? 'bg-primary/15 border-primary/50 text-primary'
                        : 'border-border text-muted-foreground hover:border-border/70 hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize options for images */}
            {isImage && (
              <div>
                <label className="block text-sm font-medium mb-2">Resize (optional)</label>
                <div className="flex gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Width (px)</label>
                    <input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => setResizeWidth(e.target.value)}
                      className="w-28 block bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Auto"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Height (px)</label>
                    <input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => setResizeHeight(e.target.value)}
                      className="w-28 block bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Auto"
                      min={1}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Aspect ratio is preserved.</p>
              </div>
            )}

            {/* Token cost */}
            {estimatedCost !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-primary" />
                <span>Estimated cost: <strong>{estimatedCost} tokens</strong></span>
                {initialBalance < estimatedCost && (
                  <span className="text-red-400 text-xs">(insufficient balance)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || !outputMime || uploading || (estimatedCost !== null && initialBalance < estimatedCost)}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading…</>
          ) : (
            <>Convert file <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      {/* Job status */}
      {jobId && (
        <div className={`glass rounded-2xl p-6 flex items-center gap-4 ${
          jobStatus === 'DONE' ? 'border-emerald-500/30' :
          jobStatus === 'FAILED' ? 'border-red-500/30' : 'border-blue-500/30'
        }`}>
          {jobStatus === 'DONE' ? (
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : jobStatus === 'FAILED' ? (
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
          ) : (
            <RefreshCw className="w-6 h-6 text-blue-400 shrink-0 animate-spin" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              {jobStatus === 'DONE' ? 'Conversion complete!' :
               jobStatus === 'FAILED' ? 'Conversion failed' :
               `Processing… (${jobStatus})`}
            </p>
            {error && <p className="text-sm text-red-400 mt-0.5">{error}</p>}
          </div>
          {jobStatus === 'DONE' && downloadToken && (
            <a
              href={`/api/download/${downloadToken}`}
              className="flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Download
            </a>
          )}
        </div>
      )}
    </div>
  );
}
