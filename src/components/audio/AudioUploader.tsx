import { useState, useRef, useCallback } from 'react';
import { Upload, Link, Mic, X, CheckCircle } from 'lucide-react';
import { cn, detectAudioDuration, isValidAudioUrl, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AudioUploaderProps {
  onFileSelect: (file: File | null, duration: number) => void;
  onUrlSet: (url: string, duration: number) => void;
  className?: string;
}

export function AudioUploader({ onFileSelect, onUrlSet, className }: AudioUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac'];

  const handleFile = useCallback(
    async (selectedFile: File) => {
      if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
        return;
      }
      const dur = await detectAudioDuration(selectedFile);
      setFile(selectedFile);
      setDuration(dur);
      onFileSelect(selectedFile, dur);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleUrlSubmit = useCallback(() => {
    if (!isValidAudioUrl(url)) {
      setUrlError('URL inválida. Use uma URL http ou https.');
      return;
    }
    setUrlError('');
    onUrlSet(url, 0);
  }, [url, onUrlSet]);

  const clearFile = useCallback(() => {
    setFile(null);
    setDuration(0);
    onFileSelect(null, 0);
    if (fileRef.current) fileRef.current.value = '';
  }, [onFileSelect]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-border">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
            mode === 'upload'
              ? 'bg-[#25D366] text-white'
              : 'bg-card text-muted-foreground hover:text-foreground'
          )}
        >
          <Upload size={16} />
          Upload de arquivo
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
            mode === 'url'
              ? 'bg-[#25D366] text-white'
              : 'bg-card text-muted-foreground hover:text-foreground'
          )}
        >
          <Link size={16} />
          URL externa
        </button>
      </div>

      {mode === 'upload' ? (
        <div>
          {file ? (
            <div className="flex items-center gap-3 p-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg">
              <CheckCircle size={20} className="text-[#25D366] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {duration > 0 && ` · ${formatDuration(duration)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Remover arquivo"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all',
                isDragging
                  ? 'border-[#25D366] bg-[#25D366]/10'
                  : 'border-border hover:border-[#25D366]/50 hover:bg-muted/50'
              )}
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                <Mic size={24} className="text-[#25D366]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Arraste seu áudio ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  MP3, WAV, OGG, M4A, AAC (máx. 50MB)
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            label="URL do áudio"
            placeholder="https://exemplo.com/audio.mp3"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={urlError}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleUrlSubmit} className="w-full">
            Usar esta URL
          </Button>
        </div>
      )}
    </div>
  );
}
