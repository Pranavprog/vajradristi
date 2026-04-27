import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLang } from '../lib/LanguageContext';

import TopNav from '../components/vajra/TopNav';
import AlertBanner from '../components/vajra/AlertBanner';
import UploadPanel from '../components/vajra/UploadPanel';
import ImageDisplay from '../components/vajra/ImageDisplay';
import SafePathPanel from '../components/vajra/SafePathPanel';
import RiskSummary from '../components/vajra/RiskSummary';
import TerrainScore from '../components/vajra/TerrainScore';
import PerformanceMetrics from '../components/vajra/PerformanceMetrics';
import ExplainableAI from '../components/vajra/ExplainableAI';
import IoUGauge from '../components/vajra/IoUGauge';
import DownloadButtons from '../components/vajra/DownloadButtons';
import LoadingOverlay from '../components/vajra/LoadingOverlay';
import EmptyState from '../components/vajra/EmptyState';

const API_BASE_URL = ''; // Set your API base URL here

export default function Dashboard() {
  const { t } = useLang();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [systemStatus, setSystemStatus] = useState('online');

  const handleImageSelect = useCallback((file) => {
    setSelectedImage(file);
    setResult(null);
    setAlert(null);
  }, []);

  const handlePredict = useCallback(async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setSystemStatus('analyzing');
    setAlert(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setResult(data);
      setSystemStatus('online');

      if (data.alerts) {
        setAlert(data.alerts);
      }

      toast.success(t('analysisComplete'));
    } catch (error) {
      setSystemStatus('online');
      // Demo fallback - show sample data for presentation
      const demoResult = {
        original_image: null,
        segmentation_image: null,
        risk_map_image: null,
        safe_path_image: null,
        iou_score: 0.87,
        inference_time: '45 ms',
        objects_detected: 12,
        risk_percentages: { high: 25, moderate: 40, safe: 35 },
        terrain_difficulty: 7.8,
        alerts: 'HIGH RISK DETECTED',
        explanation: [
          'Large rock detected in primary path',
          'Dense obstacle region ahead',
          'Close proximity to steep terrain edge',
          'Uneven surface gradient detected',
        ],
      };
      setResult(demoResult);
      setAlert(demoResult.alerts);
      toast.info(t('demoAnalysis'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage]);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
    setResult(null);
    setAlert(null);
    setSystemStatus('online');
  }, []);

  const hasResult = result !== null;

  return (
    <div className="min-h-screen bg-background bg-grid font-inter">
      <LoadingOverlay isLoading={isLoading} />
      <TopNav systemStatus={systemStatus} />
      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* LEFT PANEL */}
        <aside className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-border/50 p-5 overflow-y-auto flex-shrink-0 bg-card/30">
          <UploadPanel
            onImageSelect={handleImageSelect}
            onPredict={handlePredict}
            onReset={handleReset}
            selectedImage={selectedImage}
            isLoading={isLoading}
          />

          {hasResult && (
            <div className="mt-6 space-y-6">
              <RiskSummary riskPercentages={result.risk_percentages} />
              <TerrainScore score={result.terrain_difficulty} />
              <DownloadButtons
                segmentation={result.segmentation_image}
                riskMap={result.risk_map_image}
                safePath={result.safe_path_image}
              />
            </div>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-5">
          {!hasResult ? (
            <EmptyState />
          ) : (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Image Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <ImageDisplay
                  titleKey="originalImage"
                  imageSrc={
                    result.original_image
                      ? `data:image/png;base64,${result.original_image}`
                      : selectedImage
                      ? URL.createObjectURL(selectedImage)
                      : null
                  }
                  labelKey="inputLabel"
                  delay={0.1}
                />
                <ImageDisplay
                  titleKey="segmentationOutput"
                  imageSrc={
                    result.segmentation_image
                      ? `data:image/png;base64,${result.segmentation_image}`
                      : null
                  }
                  labelKey="aiModelLabel"
                  delay={0.2}
                />
                <ImageDisplay
                  titleKey="riskHeatmap"
                  imageSrc={
                    result.risk_map_image
                      ? `data:image/png;base64,${result.risk_map_image}`
                      : null
                  }
                  labelKey="analysisLabel"
                  delay={0.3}
                />
              </div>

              {/* IoU Gauge — primary metric */}
              <IoUGauge iouScore={result.iou_score} />

              {/* Safe Path + Metrics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SafePathPanel safePathImage={result.safe_path_image} />
                <div className="space-y-4">
                  <PerformanceMetrics
                    inferenceTime={result.inference_time}
                    objectsDetected={result.objects_detected}
                  />
                  <ExplainableAI explanations={result.explanation} />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}