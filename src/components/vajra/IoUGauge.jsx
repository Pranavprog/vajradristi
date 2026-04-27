import React from 'react';
import { motion } from 'framer-motion';
import { Gauge, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

function getIoUGrade(score) {
  if (score >= 0.90) return { gradeKey: 'gradeExcellent', color: 'text-vajra-green', bgColor: 'bg-vajra-green', borderColor: 'border-vajra-green', glow: 'glow-green', Icon: CheckCircle2, bar: 'from-vajra-green to-emerald-400' };
  if (score >= 0.75) return { gradeKey: 'gradeGood',      color: 'text-primary',      bgColor: 'bg-primary',      borderColor: 'border-primary',      glow: 'glow-cyan',  Icon: TrendingUp,   bar: 'from-primary to-cyan-300' };
  if (score >= 0.60) return { gradeKey: 'gradeFair',      color: 'text-vajra-amber',  bgColor: 'bg-vajra-amber',  borderColor: 'border-vajra-amber',  glow: 'glow-amber', Icon: Minus,        bar: 'from-vajra-amber to-yellow-300' };
  if (score >= 0.50) return { gradeKey: 'gradePoor',      color: 'text-orange-400',   bgColor: 'bg-orange-400',   borderColor: 'border-orange-400',   glow: '',           Icon: TrendingDown, bar: 'from-orange-400 to-orange-300' };
  return               { gradeKey: 'gradeUnacceptable', color: 'text-vajra-red',    bgColor: 'bg-vajra-red',    borderColor: 'border-vajra-red',    glow: 'glow-red',   Icon: XCircle,      bar: 'from-vajra-red to-red-400' };
}

function getIoUFeedback(score, lang) {
  const feedbacks = {
    en: [
      { min: 0.90, text: 'Model prediction is highly accurate. Results are reliable for autonomous navigation.' },
      { min: 0.75, text: 'Model prediction is good. Safe to use with minor manual verification.' },
      { min: 0.60, text: 'Moderate accuracy detected. Cross-check segmentation before mission use.' },
      { min: 0.50, text: 'Low accuracy. Retrain the model or capture a clearer image.' },
      { min: 0,    text: 'Unacceptable accuracy. Do NOT use for navigation. Model retraining required.' },
    ],
    hi: [
      { min: 0.90, text: 'मॉडल पूर्वानुमान अत्यधिक सटीक है। स्वायत्त नेविगेशन के लिए परिणाम विश्वसनीय हैं।' },
      { min: 0.75, text: 'मॉडल पूर्वानुमान अच्छा है। मामूली मैनुअल सत्यापन के साथ उपयोग सुरक्षित है।' },
      { min: 0.60, text: 'मध्यम सटीकता। मिशन में उपयोग से पहले विभाजन की जांच करें।' },
      { min: 0.50, text: 'कम सटीकता। मॉडल को पुनः प्रशिक्षित करें या स्पष्ट छवि लें।' },
      { min: 0,    text: 'अस्वीकार्य सटीकता। नेविगेशन के लिए उपयोग न करें। मॉडल पुनः प्रशिक्षण आवश्यक।' },
    ],
    kn: [
      { min: 0.90, text: 'ಮಾದರಿ ಅಂದಾಜು ಹೆಚ್ಚು ನಿಖರವಾಗಿದೆ. ಸ್ವಾಯತ್ತ ನ್ಯಾವಿಗೇಷನ್‌ಗೆ ಫಲಿತಾಂಶಗಳು ವಿಶ್ವಾಸಾರ್ಹ.' },
      { min: 0.75, text: 'ಮಾದರಿ ಅಂದಾಜು ಉತ್ತಮ. ಸ್ವಲ್ಪ ಕೈಯಿಂದ ಪರಿಶೀಲಿಸಿ ಬಳಸಬಹುದು.' },
      { min: 0.60, text: 'ಮಧ್ಯಮ ನಿಖರತೆ. ಮಿಷನ್‌ಗೆ ಮೊದಲು ವಿಭಜನೆ ಪರಿಶೀಲಿಸಿ.' },
      { min: 0.50, text: 'ಕಡಿಮೆ ನಿಖರತೆ. ಮಾದರಿ ಮರು-ತರಬೇತಿ ಅಥವಾ ಸ್ಪಷ್ಟ ಚಿತ್ರ ತೆಗೆಯಿರಿ.' },
      { min: 0,    text: 'ಅಸ್ವೀಕಾರ್ಯ ನಿಖರತೆ. ನ್ಯಾವಿಗೇಷನ್‌ಗೆ ಬಳಸಬೇಡಿ. ಮಾದರಿ ಮರು-ತರಬೇತಿ ಅಗತ್ಯ.' },
    ],
    te: [
      { min: 0.90, text: 'మోడల్ అంచనా అత్యంత ఖచ్చితమైనది. స్వయంప్రతిపత్తి నావిగేషన్‌కు ఫలితాలు విశ్వసనీయమైనవి.' },
      { min: 0.75, text: 'మోడల్ అంచనా మంచిది. చిన్న మాన్యువల్ ధృవీకరణతో సురక్షితంగా వాడవచ్చు.' },
      { min: 0.60, text: 'మధ్యస్థ ఖచ్చితత్వం. మిషన్‌కు ముందు సెగ్మెంటేషన్ తనిఖీ చేయండి.' },
      { min: 0.50, text: 'తక్కువ ఖచ్చితత్వం. మోడల్‌ను మళ్ళీ శిక్షణ ఇవ్వండి లేదా స్పష్టమైన చిత్రం తీయండి.' },
      { min: 0,    text: 'అస్వీకార్య ఖచ్చితత్వం. నావిగేషన్‌కు వాడవద్దు. మోడల్ రీట్రెయినింగ్ అవసరం.' },
    ],
    ta: [
      { min: 0.90, text: 'மாதிரி கணிப்பு மிகவும் துல்லியமானது. தன்னியக்க வழிசெலுத்தலுக்கு முடிவுகள் நம்பகமானவை.' },
      { min: 0.75, text: 'மாதிரி கணிப்பு நல்லது. சிறிய கையேடு சரிபார்ப்புடன் பாதுகாப்பாக பயன்படுத்தலாம்.' },
      { min: 0.60, text: 'மிதமான துல்லியம். பணிக்கு முன் பிரிவினையை சரிபார்க்கவும்.' },
      { min: 0.50, text: 'குறைந்த துல்லியம். மாதிரியை மீண்டும் பயிற்சி செய்யுங்கள் அல்லது தெளிவான படம் எடுங்கள்.' },
      { min: 0,    text: 'ஏற்றுக்கொள்ள முடியாத துல்லியம். வழிசெலுத்தலுக்கு பயன்படுத்தாதீர்கள். மாதிரி மீண்டும் பயிற்சி தேவை.' },
    ],
    ja: [
      { min: 0.90, text: 'モデルの予測は非常に高精度です。自律走行ナビゲーションの結果として信頼できます。' },
      { min: 0.75, text: 'モデル予測は良好です。軽微な手動確認の上で安全に使用できます。' },
      { min: 0.60, text: '中程度の精度が検出されました。ミッション使用前にセグメンテーションを確認してください。' },
      { min: 0.50, text: '精度が低いです。モデルの再学習または鮮明な画像の取得を行ってください。' },
      { min: 0,    text: '許容できない精度です。ナビゲーションに使用しないでください。モデルの再学習が必要です。' },
    ],
  };
  const list = feedbacks[lang] || feedbacks.en;
  return list.find(f => score >= f.min)?.text ?? list[list.length - 1].text;
}

const THRESHOLDS = [
  { label: '≥0.90', descKey: 'gradeExcellent', color: 'bg-vajra-green' },
  { label: '≥0.75', descKey: 'gradeGood',      color: 'bg-primary' },
  { label: '≥0.60', descKey: 'gradeFair',      color: 'bg-vajra-amber' },
  { label: '≥0.50', descKey: 'gradePoor',      color: 'bg-orange-400' },
  { label: '<0.50',  descKey: 'gradeUnacceptable', color: 'bg-vajra-red' },
];

export default function IoUGauge({ iouScore }) {
  const { t, lang } = useLang();
  if (iouScore === undefined || iouScore === null) return null;

  const grade = getIoUGrade(iouScore);
  const feedback = getIoUFeedback(iouScore, lang);
  const pct = Math.min(iouScore * 100, 100);

  // SVG arc gauge
  const radius = 54;
  const cx = 70, cy = 70;
  const startAngle = 210;
  const endAngle = 330; // total 300 degrees sweep
  const sweep = 300;
  const filled = (pct / 100) * sweep;

  function polarToCart(angle) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arcPath(from, to) {
    const s = polarToCart(from);
    const e = polarToCart(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const { Icon, gradeKey } = grade;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`rounded-xl border ${grade.borderColor}/30 bg-card/60 p-5 ${grade.glow} space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t('iouScore')}
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${grade.borderColor}/40 ${grade.bgColor}/10`}>
          <Icon className={`w-3.5 h-3.5 ${grade.color}`} />
          <span className={`text-xs font-bold font-mono ${grade.color}`}>{t(gradeKey)}</span>
        </div>
      </div>

      {/* Gauge SVG + Score */}
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="140" height="100" viewBox="0 0 140 100">
            {/* Track */}
            <path
              d={arcPath(startAngle, startAngle + sweep)}
              fill="none"
              stroke="hsl(222 30% 16%)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <motion.path
              d={arcPath(startAngle, startAngle + filled)}
              fill="none"
              stroke={
                iouScore >= 0.90 ? 'hsl(142 72% 50%)' :
                iouScore >= 0.75 ? 'hsl(187 92% 55%)' :
                iouScore >= 0.60 ? 'hsl(45 93% 58%)' :
                iouScore >= 0.50 ? '#fb923c' :
                'hsl(0 84% 60%)'
              }
              strokeWidth="10"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }}
            />
            {/* Center score */}
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" fontSize="20" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
              {(iouScore * 100).toFixed(0)}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="hsl(215 20% 55%)">
              / 100
            </text>
          </svg>
          <p className="text-center text-[10px] font-mono text-muted-foreground -mt-1">
            IoU = {iouScore.toFixed(3)}
          </p>
        </div>

        {/* Linear bar + thresholds */}
        <div className="flex-1 space-y-3">
          {/* Linear bar */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
              <span>0.00</span>
              <span>0.50</span>
              <span>1.00</span>
            </div>
            <div className="h-3 rounded-full bg-secondary/50 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${grade.bar}`}
              />
              {/* Threshold markers */}
              {[50, 60, 75, 90].map(v => (
                <div
                  key={v}
                  className="absolute top-0 bottom-0 w-px bg-background/60"
                  style={{ left: `${v}%` }}
                />
              ))}
            </div>
          </div>

          {/* Threshold legend */}
          <div className="grid grid-cols-1 gap-1">
            {THRESHOLDS.map(({ label, descKey, color }) => (
              <div key={descKey} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
                <span className="text-[10px] text-foreground/70">{t(descKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className={`rounded-lg border ${grade.borderColor}/20 ${grade.bgColor}/5 p-3 flex gap-2`}>
        <Info className={`w-3.5 h-3.5 ${grade.color} flex-shrink-0 mt-0.5`} />
        <p className={`text-xs leading-relaxed ${grade.color}`}>{feedback}</p>
      </div>
    </motion.div>
  );
}