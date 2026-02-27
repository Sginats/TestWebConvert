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
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Convert Files</h1>
          <p className="text-muted-foreground">
            Fast, secure, and professional processing.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl shadow-inner group">
          <Coins className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
          <div className="text-right">
             <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Balance</div>
             <div className="text-xl font-black leading-none">{initialBalance} <span className="text-sm font-normal text-muted-foreground">tokens</span></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drop zone */}
        <div
          className={`relative overflow-hidden glass rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-500 group ${
            dragOver ? 'border-primary shadow-[0_0_30px_rgba(139,92,246,0.1)] bg-primary/5 scale-[0.99]' : 'hover:border-white/20'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          
          {file ? (
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-inner">
                 <FileUp className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{file.name}</p>
                <p className="text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB · {conversionOptions?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="bg-white/5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive px-4 py-2 rounded-xl transition-all text-sm font-medium border border-white/5"
              >
                Change File
              </button>
            </div>
          ) : (
            <div className="relative z-10 py-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xl font-bold mb-2">Drop your file here</p>
              <p className="text-muted-foreground">or click to browse from your device</p>
              <div className="flex items-center justify-center gap-4 mt-8 opacity-40">
                <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded">PNG</span>
                <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded">JPG</span>
                <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded">WEBP</span>
                <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded">PDF</span>
                <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded">TXT</span>
              </div>
            </div>
          )}
        </div>

        {/* Output format */}
        {file && conversionOptions && (
          <div className="glass rounded-[2rem] p-8 space-y-8 animate-fade-in">
            <div>
              <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Select Output Format</label>
              <div className="flex flex-wrap gap-3">
                {conversionOptions.options.map((opt) => (
                  <button
                    key={opt.mime}
                    type="button"
                    onClick={() => setOutputMime(opt.mime)}
                    className={`px-8 py-4 rounded-2xl text-base font-bold transition-all border-2 ${
                      outputMime === opt.mime
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                        : 'bg-white/5 border-white/5 text-muted-foreground hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resize options for images */}
            {isImage && (
              <div className="pt-8 border-t border-white/5">
                <label className="block text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Resize Options (Optional)</label>
                <div className="flex flex-wrap gap-6">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Width (px)</label>
                    <input
                      type="number"
                      value={resizeWidth}
                      onChange={(e) => setResizeWidth(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                      placeholder="Original"
                      min={1}
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Height (px)</label>
                    <input
                      type="number"
                      value={resizeHeight}
                      onChange={(e) => setResizeHeight(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                      placeholder="Original"
                      min={1}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 font-medium italic">Aspect ratio is always preserved to prevent distortion.</p>
              </div>
            )}

            {/* Token cost */}
            {estimatedCost !== null && (
              <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                     <Coins className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <div className="text-xs font-bold text-muted-foreground uppercase">Estimated Cost</div>
                     <div className="text-xl font-black">{estimatedCost} Tokens</div>
                   </div>
                </div>
                {initialBalance < estimatedCost && (
                  <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-xl text-sm font-bold border border-destructive/20 animate-pulse">
                    Insufficient Balance
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || !outputMime || uploading || (estimatedCost !== null && initialBalance < estimatedCost)}
          className="w-full bg-primary text-primary-foreground py-6 rounded-2xl font-black text-xl hover:opacity-90 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3 shadow-2xl shadow-primary/20"
        >
          {uploading ? (
            <><RefreshCw className="w-6 h-6 animate-spin" /> Processing…</>
          ) : (
            <>Initialize Conversion <ArrowRight className="w-6 h-6" /></>
          )}
        </button>
      </form>

      {/* Job status */}
      {jobId && (
        <div className={`glass rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 animate-fade-in ${
          jobStatus === 'DONE' ? 'border-emerald-500/50 bg-emerald-500/5' :
          jobStatus === 'FAILED' ? 'border-red-500/50 bg-red-500/5' : 'border-primary/50 bg-primary/5'
        }`}>
          <div className="flex-1 flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              jobStatus === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
              jobStatus === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
            }`}>
              {jobStatus === 'DONE' ? (
                <CheckCircle className="w-8 h-8" />
              ) : jobStatus === 'FAILED' ? (
                <AlertCircle className="w-8 h-8" />
              ) : (
                <RefreshCw className="w-8 h-8 animate-spin" />
              )}
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">
                {jobStatus === 'DONE' ? 'Conversion complete!' :
                 jobStatus === 'FAILED' ? 'Process failed' :
                 `Converting…`}
              </p>
              <p className="text-muted-foreground font-medium">
                {jobStatus === 'DONE' ? 'Your file is ready for download' :
                 jobStatus === 'FAILED' ? (error || 'An unexpected error occurred') :
                 `Current state: ${jobStatus.toLowerCase()}`}
              </p>
            </div>
          </div>
          {jobStatus === 'DONE' && downloadToken && (
            <a
              href={`/api/download/${downloadToken}`}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-emerald-500 text-white px-10 py-5 rounded-2xl text-lg font-black hover:opacity-90 transition-all hover:scale-105 shadow-xl shadow-emerald-500/20"
            >
              Download File
            </a>
          )}
        </div>
      )}
    </div>
  );
}
