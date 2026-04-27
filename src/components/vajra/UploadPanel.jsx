import React, { useCallback, useRef, useState } from 'react';
import { Upload, Play, RotateCcw, ImageIcon, Loader2, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';

export default function UploadPanel({ onImageSelect, onPredict, onReset, selectedImage, isLoading }) {
  const { t } = useLang();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onImageSelect(file);
  }, [onImageSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onImageSelect(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Crosshair className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          {t('imageInput')}
        </h2>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed transition-all duration-300 overflow-hidden
          ${isDragging
            ? 'border-primary bg-primary/5 glow-cyan'
            : selectedImage
            ? 'border-border bg-secondary/30'
            : 'border-border/50 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/30'}
        `}
      >
        {selectedImage ? (
          <div className="relative aspect-video">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected terrain"
              className="w-full h-full object-cover rounded-md"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-xs font-mono text-foreground/80 truncate">{selectedImage.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {(selectedImage.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ) : (
          <div className="py-10 px-4 flex flex-col items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/80">{t('dropZoneTitle')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dropZoneSubtitle')}</p>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">{t('dropZoneFormat')}</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="w-full border-border/50 hover:border-primary/50 hover:bg-primary/5 text-sm"
          size="sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          {t('uploadImage')}
        </Button>

        <Button
          onClick={onPredict}
          disabled={!selectedImage || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('analyzingBtn')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {t('runPrediction')}
            </>
          )}
        </Button>

        <Button
          onClick={onReset}
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground text-sm"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {t('reset')}
        </Button>
      </div>
    </div>
  );
}