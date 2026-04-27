import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useLang } from '../lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';

import { generateSegmentationDemo, generateRiskHeatmapDemo, generateSafePathDemo, getDemoMetrics } from '../lib/demoImages';
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
import SafePathNavigator from '../components/vajra/SafePathNavigator';
import NearestBase from '../components/vajra/NearestBase';

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
      // Save to history
      if (data) {
        base44.entities.AnalysisRecord.create({
          image_name: selectedImage.name,
          segmentation_image: data.segmentation_image || null,
          risk_map_image: data.risk_map_image || null,
          iou_score: data.iou_score,
          inference_time: data.inference_time,
          objects_detected: data.objects_detected,
          terrain_difficulty: data.terrain_difficulty,
          risk_high: data.risk_percentages?.high,
          risk_moderate: data.risk_percentages?.moderate,
          risk_safe: data.risk_percentages?.safe,
          alert: data.alerts || null,
        }).catch(() => {});
      }
    } catch (error) {
      setSystemStatus('online');
      // Demo fallback — derive ALL outputs from the actual uploaded image pixels
      const [segImg, riskImg, demoMetrics] = await Promise.all([
        generateSegmentationDemo(selectedImage),
        generateRiskHeatmapDemo(selectedImage),
        getDemoMetrics(selectedImage),
      ]);
      const demoResult = {
        original_image: null,
        segmentation_image: segImg,
        risk_map_image: riskImg,
        safe_path_image: generateSafePathDemo(),
        ...demoMetrics,
        alerts: demoMetrics.risk_percentages.high > 30 ? 'HIGH RISK DETECTED' : null,
        explanation: demoMetrics.explanationLines,
      };
      setResult(demoResult);
      if (demoResult.alerts) setAlert(demoResult.alerts);
      toast.info(t('demoAnalysis'));
      // Save demo result to history
      base44.entities.AnalysisRecord.create({
        image_name: selectedImage.name,
        segmentation_image: demoResult.segmentation_image || null,
        risk_map_image: demoResult.risk_map_image || null,
        iou_score: demoMetrics.iou_score,
        inference_time: demoMetrics.inference_time,
        objects_detected: demoMetrics.objects_detected,
        terrain_difficulty: demoMetrics.terrain_difficulty,
        risk_high: demoMetrics.risk_percentages?.high,
        risk_moderate: demoMetrics.risk_percentages?.moderate,
        risk_safe: demoMetrics.risk_percentages?.safe,
        alert: demoResult.alerts || null,
      }).catch(() => {});
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

  // Stable object URL for the selected image — revoked when image changes
  const selectedImageUrl = useMemo(() => {
    if (!selectedImage) return null;
    const url = URL.createObjectURL(selectedImage);
    return url;
  }, [selectedImage]);

  useEffect(() => {
    return () => { if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl); };
  }, [selectedImageUrl]);

  return (
    <div className="min-h-screen bg-background bg-grid font-inter">
      <LoadingOverlay isLoading={isLoading} />
      <TopNav systemStatus={systemStatus}>
        <Link
          to="/history"
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-primary/10 border border-transparent hover:border-primary/20"
        >
          <History className="w-3.5 h-3.5" />
          History
        </Link>
      </TopNav>
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

          {/* Always-visible NDRF base info */}
          <div className="mt-6">
            <NearestBase />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-5">
          {!hasResult ? (
            <EmptyState />
          ) : (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Image Grid */}
              {/* Original image — compact top row */}
              <ImageDisplay
                titleKey="originalImage"
                imageSrc={
                  result.original_image
                    ? `data:image/png;base64,${result.original_image}`
                    : selectedImageUrl
                }
                labelKey="inputLabel"
                delay={0.1}
              />
              {/* Segmentation + Heatmap — large side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ImageDisplay
                  titleKey="segmentationOutput"
                  imageSrc={
                    result.segmentation_image
                      ? `data:image/png;base64,${result.segmentation_image}`
                      : null
                  }
                  labelKey="aiModelLabel"
                  delay={0.2}
                  large
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
                  large
                />
              </div>

              {/* IoU Gauge — primary metric */}
              <IoUGauge iouScore={result.iou_score} />

              {/* Dynamic Safe Path Navigator */}
              <SafePathNavigator
                terrainImageSrc={
                  result.original_image
                    ? `data:image/png;base64,${result.original_image}`
                    : selectedImageUrl
                }
              />

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