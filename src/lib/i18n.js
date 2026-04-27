export const languages = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
];

export const translations = {
  en: {
    appTagline: 'Intelligent Terrain Vision',
    systemOnline: 'System Online',
    analyzing: 'Analyzing...',
    idle: 'Idle',
    connected: 'Connected',

    // Upload Panel
    imageInput: 'Image Input',
    dropZoneTitle: 'Drop terrain image here',
    dropZoneSubtitle: 'or click to browse',
    dropZoneFormat: 'PNG, JPG up to 10MB',
    uploadImage: 'Upload Image',
    runPrediction: 'Run Prediction',
    reset: 'Reset',
    analyzingBtn: 'Analyzing...',

    // Panels
    riskDistribution: 'Risk Distribution',
    highRisk: 'High Risk',
    moderate: 'Moderate',
    safeZone: 'Safe Zone',

    terrainDifficulty: 'Terrain Difficulty',
    lowDifficulty: 'Low Difficulty',
    moderateDifficulty: 'Moderate Difficulty',
    highDifficulty: 'High Difficulty',

    recommendedSafePath: 'Recommended Safe Path',
    optimalRoute: 'Optimal Route',

    performance: 'Performance',
    iouScore: 'IoU Score',
    inferenceTime: 'Inference Time',
    objectsDetected: 'Objects Detected',

    explainableAI: 'Explainable AI — Why This Decision?',

    downloads: 'Downloads',
    downloadSegmentation: 'Segmentation',
    downloadRiskMap: 'Risk Map',
    downloadSafePath: 'Safe Path',

    // Image labels
    originalImage: 'Original Image',
    segmentationOutput: 'Segmentation Output',
    riskHeatmap: 'Risk Heatmap',
    inputLabel: 'Input',
    aiModelLabel: 'AI Model',
    analysisLabel: 'Analysis',

    awaitingData: 'Awaiting data',

    // Empty state
    readyToAnalyze: 'Ready to Analyze',
    emptyStateDesc: 'Upload a terrain image and run the prediction model to see segmentation, risk analysis, and safe path recommendations.',
    uploadToBegin: 'Upload an image to begin',

    // Loading
    analyzingTerrain: 'Analyzing Terrain...',
    processingModel: 'Processing segmentation model',

    // Toast
    analysisComplete: 'Terrain analysis complete',
    demoAnalysis: 'Showing demo analysis (API unavailable)',

    // Alert dismiss
    dismiss: 'Dismiss',
  },

  hi: {
    appTagline: 'बुद्धिमान भूभाग दृष्टि',
    systemOnline: 'सिस्टम ऑनलाइन',
    analyzing: 'विश्लेषण हो रहा है...',
    idle: 'निष्क्रिय',
    connected: 'जुड़ा हुआ',

    imageInput: 'छवि इनपुट',
    dropZoneTitle: 'यहाँ भूभाग छवि छोड़ें',
    dropZoneSubtitle: 'या ब्राउज़ करने के लिए क्लिक करें',
    dropZoneFormat: 'PNG, JPG अधिकतम 10MB',
    uploadImage: 'छवि अपलोड करें',
    runPrediction: 'पूर्वानुमान चलाएं',
    reset: 'रीसेट',
    analyzingBtn: 'विश्लेषण हो रहा है...',

    riskDistribution: 'जोखिम वितरण',
    highRisk: 'उच्च जोखिम',
    moderate: 'मध्यम',
    safeZone: 'सुरक्षित क्षेत्र',

    terrainDifficulty: 'भूभाग कठिनाई',
    lowDifficulty: 'कम कठिनाई',
    moderateDifficulty: 'मध्यम कठिनाई',
    highDifficulty: 'उच्च कठिनाई',

    recommendedSafePath: 'अनुशंसित सुरक्षित मार्ग',
    optimalRoute: 'इष्टतम मार्ग',

    performance: 'प्रदर्शन',
    iouScore: 'IoU स्कोर',
    inferenceTime: 'अनुमान समय',
    objectsDetected: 'वस्तुएं पहचानी गईं',

    explainableAI: 'व्याख्यात्मक AI — यह निर्णय क्यों?',

    downloads: 'डाउनलोड',
    downloadSegmentation: 'विभाजन',
    downloadRiskMap: 'जोखिम मानचित्र',
    downloadSafePath: 'सुरक्षित मार्ग',

    originalImage: 'मूल छवि',
    segmentationOutput: 'विभाजन आउटपुट',
    riskHeatmap: 'जोखिम हीटमैप',
    inputLabel: 'इनपुट',
    aiModelLabel: 'AI मॉडल',
    analysisLabel: 'विश्लेषण',

    awaitingData: 'डेटा की प्रतीक्षा',

    readyToAnalyze: 'विश्लेषण के लिए तैयार',
    emptyStateDesc: 'विभाजन, जोखिम विश्लेषण और सुरक्षित मार्ग सिफारिशें देखने के लिए एक भूभाग छवि अपलोड करें।',
    uploadToBegin: 'शुरू करने के लिए एक छवि अपलोड करें',

    analyzingTerrain: 'भूभाग का विश्लेषण हो रहा है...',
    processingModel: 'विभाजन मॉडल प्रोसेसिंग',

    analysisComplete: 'भूभाग विश्लेषण पूर्ण',
    demoAnalysis: 'डेमो विश्लेषण दिखाया जा रहा है (API अनुपलब्ध)',
    dismiss: 'खारिज करें',
  },

  kn: {
    appTagline: 'ಬುದ್ಧಿವಂತ ಭೂಭಾಗ ದೃಷ್ಟಿ',
    systemOnline: 'ಸಿಸ್ಟಮ್ ಆನ್‌ಲೈನ್',
    analyzing: 'ವಿಶ್ಲೇಷಣೆ ನಡೆಯುತ್ತಿದೆ...',
    idle: 'ನಿಷ್ಕ್ರಿಯ',
    connected: 'ಸಂಪರ್ಕಿತ',

    imageInput: 'ಚಿತ್ರ ಇನ್‌ಪುಟ್',
    dropZoneTitle: 'ಇಲ್ಲಿ ಭೂಭಾಗ ಚಿತ್ರವನ್ನು ಬಿಡಿ',
    dropZoneSubtitle: 'ಅಥವಾ ಬ್ರೌಸ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
    dropZoneFormat: 'PNG, JPG ಗರಿಷ್ಠ 10MB',
    uploadImage: 'ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    runPrediction: 'ಮುನ್ನೋಟ ಚಲಾಯಿಸಿ',
    reset: 'ಮರುಹೊಂದಿಸಿ',
    analyzingBtn: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',

    riskDistribution: 'ಅಪಾಯ ವಿತರಣೆ',
    highRisk: 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
    moderate: 'ಮಧ್ಯಮ',
    safeZone: 'ಸುರಕ್ಷಿತ ಪ್ರದೇಶ',

    terrainDifficulty: 'ಭೂಭಾಗ ಕಷ್ಟ',
    lowDifficulty: 'ಕಡಿಮೆ ಕಷ್ಟ',
    moderateDifficulty: 'ಮಧ್ಯಮ ಕಷ್ಟ',
    highDifficulty: 'ಹೆಚ್ಚಿನ ಕಷ್ಟ',

    recommendedSafePath: 'ಶಿಫಾರಸು ಮಾಡಿದ ಸುರಕ್ಷಿತ ಮಾರ್ಗ',
    optimalRoute: 'ಸೂಕ್ತ ಮಾರ್ಗ',

    performance: 'ಕಾರ್ಯಕ್ಷಮತೆ',
    iouScore: 'IoU ಸ್ಕೋರ್',
    inferenceTime: 'ಅನುಮಾನ ಸಮಯ',
    objectsDetected: 'ಪತ್ತೆಯಾದ ವಸ್ತುಗಳು',

    explainableAI: 'ವಿವರಣೀಯ AI — ಈ ನಿರ್ಧಾರ ಏಕೆ?',

    downloads: 'ಡೌನ್‌ಲೋಡ್‌ಗಳು',
    downloadSegmentation: 'ವಿಭಜನೆ',
    downloadRiskMap: 'ಅಪಾಯ ನಕ್ಷೆ',
    downloadSafePath: 'ಸುರಕ್ಷಿತ ಮಾರ್ಗ',

    originalImage: 'ಮೂಲ ಚಿತ್ರ',
    segmentationOutput: 'ವಿಭಜನೆ ಔಟ್‌ಪುಟ್',
    riskHeatmap: 'ಅಪಾಯ ಹೀಟ್‌ಮ್ಯಾಪ್',
    inputLabel: 'ಇನ್‌ಪುಟ್',
    aiModelLabel: 'AI ಮಾದರಿ',
    analysisLabel: 'ವಿಶ್ಲೇಷಣೆ',

    awaitingData: 'ಡೇಟಾ ನಿರೀಕ್ಷಿಸಲಾಗುತ್ತಿದೆ',

    readyToAnalyze: 'ವಿಶ್ಲೇಷಣೆಗೆ ಸಿದ್ಧ',
    emptyStateDesc: 'ವಿಭಜನೆ, ಅಪಾಯ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಸುರಕ್ಷಿತ ಮಾರ್ಗ ಶಿಫಾರಸುಗಳನ್ನು ನೋಡಲು ಭೂಭಾಗ ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.',
    uploadToBegin: 'ಪ್ರಾರಂಭಿಸಲು ಚಿತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',

    analyzingTerrain: 'ಭೂಭಾಗ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    processingModel: 'ವಿಭಜನೆ ಮಾದರಿ ಪ್ರಕ್ರಿಯೆ',

    analysisComplete: 'ಭೂಭಾಗ ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣ',
    demoAnalysis: 'ಡೆಮೊ ವಿಶ್ಲೇಷಣೆ ತೋರಿಸಲಾಗುತ್ತಿದೆ (API ಲಭ್ಯವಿಲ್ಲ)',
    dismiss: 'ವಜಾ ಮಾಡಿ',
  },

  te: {
    appTagline: 'తెలివైన భూభాగ దృష్టి',
    systemOnline: 'సిస్టమ్ ఆన్‌లైన్',
    analyzing: 'విశ్లేషిస్తోంది...',
    idle: 'నిష్క్రియ',
    connected: 'కనెక్ట్ అయింది',

    imageInput: 'చిత్రం ఇన్‌పుట్',
    dropZoneTitle: 'ఇక్కడ భూభాగ చిత్రాన్ని వదలండి',
    dropZoneSubtitle: 'లేదా బ్రౌజ్ చేయడానికి క్లిక్ చేయండి',
    dropZoneFormat: 'PNG, JPG గరిష్ట 10MB',
    uploadImage: 'చిత్రం అప్‌లోడ్ చేయండి',
    runPrediction: 'అంచనా అమలు చేయండి',
    reset: 'రీసెట్',
    analyzingBtn: 'విశ్లేషిస్తోంది...',

    riskDistribution: 'ప్రమాద పంపిణీ',
    highRisk: 'అధిక ప్రమాదం',
    moderate: 'మధ్యస్థం',
    safeZone: 'సురక్షిత ప్రాంతం',

    terrainDifficulty: 'భూభాగ కష్టం',
    lowDifficulty: 'తక్కువ కష్టం',
    moderateDifficulty: 'మధ్యస్థ కష్టం',
    highDifficulty: 'అధిక కష్టం',

    recommendedSafePath: 'సిఫారసు చేయబడిన సురక్షిత మార్గం',
    optimalRoute: 'అనుకూల మార్గం',

    performance: 'పనితీరు',
    iouScore: 'IoU స్కోర్',
    inferenceTime: 'అనుమాన సమయం',
    objectsDetected: 'గుర్తించిన వస్తువులు',

    explainableAI: 'వివరణీయ AI — ఈ నిర్ణయం ఎందుకు?',

    downloads: 'డౌన్‌లోడ్‌లు',
    downloadSegmentation: 'విభజన',
    downloadRiskMap: 'ప్రమాద మ్యాప్',
    downloadSafePath: 'సురక్షిత మార్గం',

    originalImage: 'అసలు చిత్రం',
    segmentationOutput: 'విభజన అవుట్‌పుట్',
    riskHeatmap: 'ప్రమాద హీట్‌మ్యాప్',
    inputLabel: 'ఇన్‌పుట్',
    aiModelLabel: 'AI మోడల్',
    analysisLabel: 'విశ్లేషణ',

    awaitingData: 'డేటా కోసం వేచి ఉంది',

    readyToAnalyze: 'విశ్లేషణకు సిద్ధం',
    emptyStateDesc: 'విభజన, ప్రమాద విశ్లేషణ మరియు సురక్షిత మార్గ సిఫారసులను చూడటానికి భూభాగ చిత్రాన్ని అప్‌లోడ్ చేయండి.',
    uploadToBegin: 'ప్రారంభించడానికి చిత్రం అప్‌లోడ్ చేయండి',

    analyzingTerrain: 'భూభాగాన్ని విశ్లేషిస్తోంది...',
    processingModel: 'విభజన మోడల్ ప్రాసెసింగ్',

    analysisComplete: 'భూభాగ విశ్లేషణ పూర్తయింది',
    demoAnalysis: 'డెమో విశ్లేషణ చూపిస్తోంది (API అందుబాటులో లేదు)',
    dismiss: 'తొలగించు',
  },

  ta: {
    appTagline: 'அறிவார்ந்த நிலப்பரப்பு பார்வை',
    systemOnline: 'கணினி ஆன்லைனில்',
    analyzing: 'பகுப்பாய்வு நடக்கிறது...',
    idle: 'செயலற்றது',
    connected: 'இணைக்கப்பட்டது',

    imageInput: 'படம் உள்ளீடு',
    dropZoneTitle: 'நிலப்பரப்பு படத்தை இங்கே இடுங்கள்',
    dropZoneSubtitle: 'அல்லது உலாவ கிளிக் செய்யுங்கள்',
    dropZoneFormat: 'PNG, JPG அதிகபட்சம் 10MB',
    uploadImage: 'படம் பதிவேற்று',
    runPrediction: 'கணிப்பு இயக்கு',
    reset: 'மீட்டமை',
    analyzingBtn: 'பகுப்பாய்வு நடக்கிறது...',

    riskDistribution: 'அபாய விநியோகம்',
    highRisk: 'அதிக அபாயம்',
    moderate: 'மிதமான',
    safeZone: 'பாதுகாப்பான மண்டலம்',

    terrainDifficulty: 'நிலப்பரப்பு சிரமம்',
    lowDifficulty: 'குறைந்த சிரமம்',
    moderateDifficulty: 'மிதமான சிரமம்',
    highDifficulty: 'அதிக சிரமம்',

    recommendedSafePath: 'பரிந்துரைக்கப்பட்ட பாதுகாப்பான பாதை',
    optimalRoute: 'சிறந்த பாதை',

    performance: 'செயல்திறன்',
    iouScore: 'IoU மதிப்பெண்',
    inferenceTime: 'அனுமான நேரம்',
    objectsDetected: 'கண்டறிந்த பொருட்கள்',

    explainableAI: 'விளக்கமளிக்கும் AI — இந்த முடிவு ஏன்?',

    downloads: 'பதிவிறக்கங்கள்',
    downloadSegmentation: 'பிரிவினை',
    downloadRiskMap: 'அபாய வரைபடம்',
    downloadSafePath: 'பாதுகாப்பான பாதை',

    originalImage: 'அசல் படம்',
    segmentationOutput: 'பிரிவினை வெளியீடு',
    riskHeatmap: 'அபாய வெப்ப வரைபடம்',
    inputLabel: 'உள்ளீடு',
    aiModelLabel: 'AI மாதிரி',
    analysisLabel: 'பகுப்பாய்வு',

    awaitingData: 'தரவுக்காக காத்திருக்கிறது',

    readyToAnalyze: 'பகுப்பாய்வுக்கு தயார்',
    emptyStateDesc: 'பிரிவினை, அபாய பகுப்பாய்வு மற்றும் பாதுகாப்பான பாதை பரிந்துரைகளைக் காண நிலப்பரப்பு படத்தை பதிவேற்றுங்கள்.',
    uploadToBegin: 'தொடங்க ஒரு படத்தை பதிவேற்றுங்கள்',

    analyzingTerrain: 'நிலப்பரப்பு பகுப்பாய்வு செய்கிறது...',
    processingModel: 'பிரிவினை மாதிரி செயலாக்கம்',

    analysisComplete: 'நிலப்பரப்பு பகுப்பாய்வு முடிந்தது',
    demoAnalysis: 'டெமோ பகுப்பாய்வு காட்டப்படுகிறது (API கிடைக்கவில்லை)',
    dismiss: 'நிராகரி',
  },

  ja: {
    appTagline: 'インテリジェント地形ビジョン',
    systemOnline: 'システムオンライン',
    analyzing: '分析中...',
    idle: 'アイドル',
    connected: '接続済み',

    imageInput: '画像入力',
    dropZoneTitle: 'ここに地形画像をドロップ',
    dropZoneSubtitle: 'またはクリックして参照',
    dropZoneFormat: 'PNG、JPG 最大10MB',
    uploadImage: '画像をアップロード',
    runPrediction: '予測を実行',
    reset: 'リセット',
    analyzingBtn: '分析中...',

    riskDistribution: 'リスク分布',
    highRisk: '高リスク',
    moderate: '中程度',
    safeZone: '安全ゾーン',

    terrainDifficulty: '地形難易度',
    lowDifficulty: '低難易度',
    moderateDifficulty: '中難易度',
    highDifficulty: '高難易度',

    recommendedSafePath: '推奨安全経路',
    optimalRoute: '最適ルート',

    performance: 'パフォーマンス',
    iouScore: 'IoUスコア',
    inferenceTime: '推論時間',
    objectsDetected: '検出物体数',

    explainableAI: '説明可能AI — なぜこの判断？',

    downloads: 'ダウンロード',
    downloadSegmentation: 'セグメンテーション',
    downloadRiskMap: 'リスクマップ',
    downloadSafePath: '安全経路',

    originalImage: '元の画像',
    segmentationOutput: 'セグメンテーション出力',
    riskHeatmap: 'リスクヒートマップ',
    inputLabel: '入力',
    aiModelLabel: 'AIモデル',
    analysisLabel: '分析',

    awaitingData: 'データ待機中',

    readyToAnalyze: '分析準備完了',
    emptyStateDesc: 'セグメンテーション、リスク分析、安全経路の推奨を見るために地形画像をアップロードしてください。',
    uploadToBegin: '画像をアップロードして開始',

    analyzingTerrain: '地形を分析中...',
    processingModel: 'セグメンテーションモデル処理中',

    analysisComplete: '地形分析完了',
    demoAnalysis: 'デモ分析を表示中（API利用不可）',
    dismiss: '閉じる',
  },
};

export function t(lang, key) {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}