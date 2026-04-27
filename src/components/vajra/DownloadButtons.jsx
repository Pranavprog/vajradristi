import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

function downloadBase64(base64, filename) {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  link.click();
}

export default function DownloadButtons({ segmentation, riskMap, safePath }) {
  const hasData = segmentation || riskMap || safePath;
  if (!hasData) return null;

  const items = [
    { label: 'Segmentation', data: segmentation, file: 'segmentation.png' },
    { label: 'Risk Map', data: riskMap, file: 'risk_map.png' },
    { label: 'Safe Path', data: safePath, file: 'safe_path.png' },
  ].filter(i => i.data);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Downloads
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map(({ label, data, file }) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            onClick={() => downloadBase64(data, file)}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/5 text-xs"
          >
            <Download className="w-3 h-3 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}