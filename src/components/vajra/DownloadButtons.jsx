import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/lib/LanguageContext';

function downloadBase64(base64, filename) {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64}`;
  link.download = filename;
  link.click();
}

export default function DownloadButtons({ segmentation, riskMap, safePath }) {
  const { t } = useLang();
  const hasData = segmentation || riskMap || safePath;
  if (!hasData) return null;

  const items = [
    { labelKey: 'downloadSegmentation', data: segmentation, file: 'segmentation.png' },
    { labelKey: 'downloadRiskMap', data: riskMap, file: 'risk_map.png' },
    { labelKey: 'downloadSafePath', data: safePath, file: 'safe_path.png' },
  ].filter(i => i.data);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('downloads')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map(({ labelKey, data, file }) => (
          <Button
            key={labelKey}
            variant="outline"
            size="sm"
            onClick={() => downloadBase64(data, file)}
            className="border-border/50 hover:border-primary/50 hover:bg-primary/5 text-xs"
          >
            <Download className="w-3 h-3 mr-1.5" />
            {t(labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}