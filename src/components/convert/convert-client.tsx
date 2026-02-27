'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Upload, FileUp, ArrowRight, Coins, X, CheckCircle, 
  AlertCircle, RefreshCw, Download, FileText, ImageIcon,
  History, Info, Trash2, Repeat, Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { calculateTokenCost, ALLOWED_CONVERSIONS, getMimeLabel } from '@/lib/conversion-utils';
import { Progress } from '@/components/ui/progress';

interface Job {
  id: string;
  inputMime: string;
  outputMime: string;
  status: string;
  costTokens: number;
  downloadToken?: string;
  error?: string | null;
  createdAt: string | Date;
}

interface ConvertClientProps {
  balance: number;
  recentJobs: Job[];
}

export function ConvertClient({ balance: initialBalance, recentJobs: initialRecentJobs }: ConvertClientProps) {
  const { data: session, update: updateSession } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileTextPreview, setFileTextPreview] = useState<string | null>(null);
  const [outputMime, setOutputMime] = useState('');
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState('');
  const [downloadToken, setDownloadToken] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [recentJobs, setRecentJobs] = useState<Job[]>(initialRecentJobs);
  const [balance, setBalance] = useState(initialBalance);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const inputMime = file?.type ?? '';
  const availableOutputOptions = file ? ALLOWED_CONVERSIONS[inputMime] || [] : [];

  const estimatedCost = file && outputMime
    ? calculateTokenCost(file.size, inputMime, outputMime)
    : null;

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [filePreview]);

  const fetchRecentJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs'); 
      if (res.ok) {
        const data = await res.json();
        setRecentJobs(data.jobs.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    }
  }, []);

  const updateBalance = useCallback(async () => {
    await updateSession();
  }, [updateSession]);

  useEffect(() => {
    if (session?.user) {
      setBalance((session.user as any).balance);
    }
  }, [session]);

  function handleFileChange(f: File | null) {
    if (!f) return;
    
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setFileTextPreview(null);

    const allowed = Object.keys(ALLOWED_CONVERSIONS);
    if (!allowed.includes(f.type)) {
      toast({ 
        title: 'Unsupported file type', 
        description: `Allowed: PNG, JPG, WebP, PDF, TXT`, 
        variant: 'destructive' 
      });
      return;
    }
    
    if (f.size > 50 * 1024 * 1024) {
      toast({ 
        title: 'File too large', 
        description: 'Maximum 50MB allowed.', 
        variant: 'destructive' 
      });
      return;
    }

    setFile(f);
    setOutputMime('');
    setJobId(null);
    setJobStatus('');
    setDownloadToken('');
    setError('');

    if (f.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(f));
    } else if (f.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileTextPreview(text.slice(0, 200) + (text.length > 200 ? '...' : ''));
      };
      reader.readAsText(f.slice(0, 1000));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileChange(droppedFile);
  }

  function pollJobStatus(id: string) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    
    abortControllerRef.current = new AbortController();
    const startTime = Date.now();
    const timeout = 10 * 60 * 1000;

    pollingRef.current = setInterval(async () => {
      if (Date.now() - startTime > timeout) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setError('Conversion timed out. Please check your dashboard.');
        setJobStatus('FAILED');
        toast({ title: 'Timed out', description: 'Conversion is taking too long.', variant: 'destructive' });
        return;
      }

      try {
        const res = await fetch(`/api/jobs/${id}`, {
          signal: abortControllerRef.current?.signal
        });
        
        if (!res.ok) {
          const text = await res.text();
          if (text.startsWith('<!DOCTYPE html>')) {
            throw new Error('Server returned HTML instead of JSON');
          }
          return;
        }

        const data = await res.json();
        const status = data.job.status;
        setJobStatus(status);

        if (status === 'DONE') {
          setDownloadToken(data.job.downloadToken);
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({ title: 'Conversion complete!', description: 'Your file is ready to download.' });
          updateBalance();
          fetchRecentJobs();
        } else if (status === 'FAILED' || status === 'CANCELED') {
          setError(data.job.error || 'Job failed');
          if (pollingRef.current) clearInterval(pollingRef.current);
          toast({ title: 'Conversion failed', description: data.job.error, variant: 'destructive' });
          updateBalance();
          fetchRecentJobs();
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Polling error', err);
        // If it's a persistent error, maybe stop polling
        if (err.message.includes('JSON')) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setError('Communication error with server.');
        }
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

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({ outputMime });
    if (resizeWidth) params.set('resizeWidth', resizeWidth);
    if (resizeHeight) params.set('resizeHeight', resizeHeight);

    try {
      const requestId = crypto.randomUUID();
      const res = await fetch(`/api/convert?${params}`, {
        method: 'POST',
        body: formData,
        headers: {
          'x-request-id': requestId,
        },
        signal: abortControllerRef.current.signal
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(text.startsWith('<!DOCTYPE html>') ? 'Server Error (HTML)' : 'Invalid server response');
      }

      const data = await res.json();
      setUploading(false);

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' });
      } else {
        setJobId(data.jobId);
        setJobStatus(data.status || 'QUEUED');
        if (data.status === 'DONE') {
          setDownloadToken(data.downloadToken);
          toast({ title: 'Success!', description: 'File converted instantly.' });
          updateBalance();
          fetchRecentJobs();
        } else {
          toast({ title: 'Job queued!', description: `Cost: ${data.costTokens} tokens` });
          pollJobStatus(data.jobId);
        }
        setBalance(prev => prev - data.costTokens);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setUploading(false);
      setError(err.message || 'Connection error');
      toast({ title: 'Error', description: err.message || 'Failed to reach server.', variant: 'destructive' });
    }
  }

  const resetForm = () => {
    setFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    setFileTextPreview(null);
    setOutputMime('');
    setJobId(null);
    setJobStatus('');
    setDownloadToken('');
    setError('');
    setResizeWidth('');
    setResizeHeight('');
  };

  const isImage = inputMime.startsWith('image/');
  const isPdf = inputMime === 'application/pdf';

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">Forge Engine</h1>
          <p className="text-muted-foreground font-medium">
            Next-gen file conversion with precision and speed.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl shadow-inner group">
          <Coins className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform" />
          <div className="text-right">
             <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Available</div>
             <div className="text-xl font-black leading-none">{balance} <span className="text-sm font-normal text-muted-foreground">TKN</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div
              className={`relative overflow-hidden glass rounded-[2rem] p-12 text-center cursor-pointer transition-all duration-500 group ${
                dragOver ? 'border-primary shadow-[0_0_40px_rgba(139,92,246,0.2)] bg-primary/5 scale-[0.98]' : 'hover:border-white/20'
              } ${file ? 'border-primary/40' : 'border-dashed border-white/10'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current?.click()}
            >
              <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              
              {file ? (
                <div className="relative z-10 flex flex-col items-center gap-6">
                  {filePreview ? (
                    <div className="relative group/preview">
                      <img src={filePreview} alt="Preview" className="w-32 h-32 object-cover rounded-2xl shadow-2xl border-2 border-primary/20" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : isPdf ? (
                    <div className="w-32 h-32 bg-red-500/10 rounded-2xl flex items-center justify-center border-2 border-red-500/20 shadow-2xl">
                      <FileText className="w-16 h-16 text-red-400" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-primary/10 rounded-2xl flex items-center justify-center border-2 border-primary/20 shadow-2xl">
                      <FileUp className="w-16 h-16 text-primary" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-2xl font-black tracking-tight max-w-md truncate mx-auto">{file.name}</p>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · {getMimeLabel(file.type)}
                    </p>
                  </div>

                  {fileTextPreview && (
                    <div className="bg-white/5 p-4 rounded-xl text-left w-full max-w-md border border-white/10">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Content Preview</p>
                       <p className="text-xs font-mono text-muted-foreground line-clamp-3 leading-relaxed">{fileTextPreview}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      className="bg-white/5 hover:bg-white/10 text-foreground px-6 py-2.5 rounded-xl transition-all text-sm font-bold border border-white/5"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFilePreview(null); }}
                      className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-6 py-2.5 rounded-xl transition-all text-sm font-bold border border-destructive/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 py-10">
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500 shadow-inner">
                    <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-2xl font-black mb-2 uppercase tracking-tight">Strike the anvil</p>
                  <p className="text-muted-foreground font-medium">Drop your file here or click to browse</p>
                  <div className="flex items-center justify-center gap-4 mt-10 opacity-30">
                    {['PNG', 'JPG', 'WEBP', 'PDF', 'TXT'].map(ext => (
                      <span key={ext} className="text-xs font-black px-3 py-1 bg-white/10 rounded-lg">{ext}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {file && (
              <div className="glass rounded-[2rem] p-8 space-y-8 animate-fade-in border border-white/5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" /> Select Target Format
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {availableOutputOptions.length > 0 ? availableOutputOptions.map((mime) => (
                      <button
                        key={mime}
                        type="button"
                        onClick={() => setOutputMime(mime)}
                        className={`px-10 py-5 rounded-2xl text-base font-black transition-all border-2 relative overflow-hidden ${
                          outputMime === mime
                            ? 'bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {getMimeLabel(mime)}
                        {outputMime === mime && (
                          <div className="absolute top-1 right-1">
                             <CheckCircle className="w-4 h-4 text-primary-foreground/50" />
                          </div>
                        )}
                      </button>
                    )) : (
                      <p className="text-sm text-destructive font-bold italic">No conversions available for this type.</p>
                    )}
                  </div>
                </div>

                {isImage && (
                  <div className="pt-8 border-t border-white/5">
                    <label className="block text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Resize Parameters (Optional)</label>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Width (px)</label>
                        <input
                          type="number"
                          value={resizeWidth}
                          onChange={(e) => setResizeWidth(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black"
                          placeholder="Original"
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Height (px)</label>
                        <input
                          type="number"
                          value={resizeHeight}
                          onChange={(e) => setResizeHeight(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-black"
                          placeholder="Original"
                          min={1}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-tighter opacity-50 flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> Aspect ratio is preserved automatically
                    </p>
                  </div>
                )}

                {estimatedCost !== null && (
                  <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                         <Coins className="w-6 h-6 text-primary" />
                       </div>
                       <div>
                         <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Fee</div>
                         <div className="text-3xl font-black">{estimatedCost} <span className="text-sm text-muted-foreground">Tokens</span></div>
                       </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                       <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Cost Breakdown</div>
                       <div className="text-xs space-y-1 text-right font-medium italic">
                          <p>Base Fee: 2 TKN</p>
                          <p>Size Fee: {Math.ceil(file.size / (1024 * 1024 * 5))} TKN</p>
                          <p>Multiplier: x{isImage ? 1 : 2} ({isImage ? 'Image' : 'Document'})</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {jobId ? (
              <div className={`glass rounded-[2rem] p-8 space-y-6 border-2 transition-all duration-500 ${
                jobStatus === 'DONE' ? 'border-emerald-500/50 bg-emerald-500/5' :
                jobStatus === 'FAILED' ? 'border-red-500/50 bg-red-500/5' : 'border-primary/50 bg-primary/5'
              }`}>
                <div className="flex items-center gap-6">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ${
                     jobStatus === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
                     jobStatus === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                   }`}>
                     {jobStatus === 'DONE' ? <CheckCircle className="w-8 h-8" /> : 
                      jobStatus === 'FAILED' ? <AlertCircle className="w-8 h-8" /> : 
                      <RefreshCw className="w-8 h-8 animate-spin" />}
                   </div>
                   <div className="flex-1">
                      <p className="text-2xl font-black uppercase tracking-tight">
                        {jobStatus === 'DONE' ? 'Masterpiece Ready' : 
                         jobStatus === 'FAILED' ? 'Forge Failure' : 
                         'Processing...'}
                      </p>
                      <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.2em] mt-1">
                        {jobStatus === 'DONE' ? 'Download your processed file below' : 
                         jobStatus === 'FAILED' ? (error || 'Unexpected error') : 
                         `Stage: ${jobStatus.toLowerCase()}`}
                      </p>
                   </div>
                </div>

                {jobStatus !== 'DONE' && jobStatus !== 'FAILED' && (
                  <div className="space-y-2">
                    <Progress value={jobStatus === 'PROCESSING' ? 75 : 25} className="h-2" />
                    <p className="text-[10px] text-center text-muted-foreground font-black uppercase animate-pulse">Waiting for worker...</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  {jobStatus === 'DONE' && downloadToken && (
                    <a
                      href={`/api/download/${downloadToken}`}
                      className="flex-1 flex items-center justify-center gap-3 bg-emerald-500 text-white py-5 rounded-2xl text-lg font-black hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20"
                    >
                      <Download className="w-6 h-6" /> Download Now
                    </a>
                  )}
                  {jobStatus === 'FAILED' && (
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      className="flex-1 flex items-center justify-center gap-3 bg-red-500 text-white py-5 rounded-2xl text-lg font-black hover:scale-[1.02] transition-all shadow-xl shadow-red-500/20"
                    >
                      <Repeat className="w-6 h-6" /> Retry Conversion
                    </button>
                  )}
                  {(jobStatus === 'DONE' || jobStatus === 'FAILED') && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 flex items-center justify-center gap-3 bg-white/5 text-foreground py-5 rounded-2xl text-lg font-black hover:bg-white/10 transition-all border border-white/5"
                    >
                      <Trash2 className="w-6 h-6" /> New Conversion
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!file || !outputMime || uploading || (estimatedCost !== null && balance < estimatedCost)}
                className="w-full bg-primary text-primary-foreground py-7 rounded-[2rem] font-black text-2xl uppercase tracking-widest hover:opacity-90 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(139,92,246,0.3)] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {uploading ? (
                  <><RefreshCw className="w-7 h-7 animate-spin" /> Ignite the Forge...</>
                ) : (
                  <>Begin Conversion <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" /></>
                )}
              </button>
            )}
            
            {estimatedCost !== null && balance < estimatedCost && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-center border border-destructive/20 animate-pulse flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-black uppercase tracking-widest text-sm">Insufficient Tokens. Please top up your wallet.</span>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-8">
          <div className="glass rounded-[2rem] p-8 border border-white/5">
            <h2 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3">
              <History className="w-5 h-5 text-primary" /> Recent
            </h2>
            
            <div className="space-y-4">
              {recentJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground font-medium italic py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  Empty history.
                </p>
              ) : (
                recentJobs.map((job) => (
                  <div key={job.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/20 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                         job.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
                         job.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                       }`}>
                         {job.status}
                       </span>
                       <span className="text-[10px] text-muted-foreground font-bold">
                         {new Date(job.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-xs font-black truncate max-w-[120px]">
                         {getMimeLabel(job.inputMime)} <ArrowRight className="inline w-2 h-2 mx-1 opacity-50" /> {getMimeLabel(job.outputMime)}
                       </p>
                       {job.status === 'DONE' && job.downloadToken && (
                         <a href={`/api/download/${job.downloadToken}`} className="text-primary hover:text-white transition-colors">
                           <Download className="w-4 h-4" />
                         </a>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {recentJobs.length > 0 && (
              <button 
                onClick={fetchRecentJobs}
                className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5"
              >
                Refresh
              </button>
            )}
          </div>

          <div className="glass rounded-[2rem] p-8 border border-white/5 bg-primary/5">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Pro Tip
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Conversions are faster during off-peak hours. Large files (&gt;20MB) may take up to 2 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
