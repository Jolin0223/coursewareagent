import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, Code, X } from 'lucide-react';
import type { GenerationProgress } from '../../types';

interface ProgressPanelProps {
  progress: GenerationProgress;
  onStop?: () => void;
}

const CONFIRM_TEXT = '需求已明确，您需要一款面向三年级学生的英语身体部位听力互动游戏，通过听音辨位和触屏操作匹配英文指令，实现趣味动作反馈与奖励机制，提升词汇理解与学习兴趣。接下来我将根据您的需求开始开发。';

const GENERATED_IMAGES = [
  { label: '主界面背景', src: '/images/background.png' },
  { label: '动物身体图片', src: '/images/animal.png' },
  { label: '进度星星', src: '/images/star.png' },
  { label: '小喇叭', src: '/images/speaker.png' },
];

const MOCK_CODE_LINES = [
  '<!DOCTYPE html>',
  '<html lang="zh-CN">',
  '<head>',
  '  <meta charset="UTF-8">',
  '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '  <title>英语身体部位听力游戏</title>',
  '  <style>',
  '    * { margin: 0; padding: 0; box-sizing: border-box; }',
  '    body { font-family: "Comic Sans MS", cursive; background: #E8F4FD; }',
  '    .game-container { max-width: 960px; margin: 0 auto; position: relative; }',
  '    .score-board { position: absolute; top: 20px; left: 20px; }',
  '    .score-board .star { color: #FFD700; font-size: 24px; }',
  '    .replay-btn { position: absolute; top: 20px; right: 20px; }',
  '    .character { width: 400px; margin: 60px auto; cursor: pointer; }',
  '    .body-part { transition: transform 0.3s; cursor: pointer; }',
  '    .body-part:hover { transform: scale(1.05); }',
  '    .body-part.correct { animation: bounce 0.5s ease; }',
  '    .body-part.wrong { animation: shake 0.5s ease; }',
  '    .feedback { font-size: 48px; font-weight: bold; text-align: center; }',
  '    .feedback.success { color: #00C9A7; }',
  '    .feedback.error { color: #FF6B6B; }',
  '    @keyframes bounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.2); } }',
  '    @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }',
  '    .combo-animation { position: fixed; inset: 0; z-index: 100; }',
  '  </style>',
  '</head>',
  '<body>',
  '  <div class="game-container">',
  '    <div class="score-board"><span class="star">⭐</span> <span id="score">0</span></div>',
  '    <button class="replay-btn" onclick="replayAudio()">🔊 重播</button>',
  '    <div class="character" id="character"></div>',
  '    <div class="feedback" id="feedback"></div>',
  '  </div>',
  '  <script>',
  '    const bodyParts = {',
  '      head: { x: 200, y: 50, w: 100, h: 80 },',
  '      nose: { x: 220, y: 90, w: 40, h: 30 },',
  '      arm: { x: 80, y: 180, w: 60, h: 120 },',
  '      belly: { x: 160, y: 200, w: 100, h: 80 },',
  '      leg: { x: 150, y: 320, w: 60, h: 140 },',
  '      foot: { x: 140, y: 440, w: 70, h: 40 },',
  '    };',
  '    let score = 0, combo = 0;',
  '    let currentPart = null;',
  '    function playAudio(part) {',
  '      const utterance = new SpeechSynthesisUtterance(`Touch your ${part}`);',
  '      utterance.lang = "en-US";',
  '      speechSynthesis.speak(utterance);',
  '    }',
  '    function checkAnswer(clickedPart) {',
  '      if (clickedPart === currentPart) {',
  '        score += 10; combo++;',
  '        document.getElementById("score").textContent = score;',
  '        showFeedback("Excellent!", true);',
  '        if (combo >= 3) triggerComboAnimation();',
  '      } else {',
  '        combo = 0;',
  '        showFeedback("Try again!", false);',
  '        highlightCorrect(currentPart);',
  '      }',
  '    }',
  '  </script>',
  '</body>',
  '</html>',
];

const REVIEW_LINES = [
  '在 startGame 函数中，playCurrentInstruction 被包裹在 setTimeout 中异步调用，导致 speechSynthesis.speak 丢失了用户交互上下文。在Safari等严格限制自动播放的浏览器中，这会导致语音播报被拦截而无法发声，应在用户点击事件中直接触发首次播报或初始化语音对象。',
];

const FIX_CODE_LINES = [
  "document.addEventListener('DOMContentLoaded', () => {",
  '  // 1. Initialize Global Variables',
  '  window.Global = window.Global || {};',
  '  window.Global.startTime = new Date().getTime();',
  '  window.Global.rightNum = 0;',
  '  window.Global.answerNum = 0;',
  '  window.Global.questionCurArr1 = [];',
  '',
  '  // Game State',
  '  let currentQuestionIndex = 0;',
  '  let comboCount = 0;',
  '  let isAnimating = false;',
  '',
  '  // 2. Fix: Direct speech init on user interaction',
  '  let speechInited = false;',
  '  document.addEventListener("click", () => {',
  '    if (!speechInited) {',
  '      const u = new SpeechSynthesisUtterance("");',
  '      speechSynthesis.speak(u);',
  '      speechInited = true;',
  '    }',
  '  }, { once: true });',
  '',
  '  function playInstruction(part) {',
  '    const utterance = new SpeechSynthesisUtterance(`Touch your ${part}`);',
  '    utterance.lang = "en-US";',
  '    speechSynthesis.speak(utterance);',
  '  }',
  '});',
];

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'completed') return <CheckCircle2 size={16} color="#00C9A7" />;
  if (status === 'in-progress') return <Loader2 size={16} color="#00C9A7" style={{ animation: 'spin 1s linear infinite' }} />;
  return null;
};

const StreamingText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 25, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    const timer = setInterval(() => {
      idxRef.current += 2;
      if (idxRef.current >= text.length) {
        setDisplayed(text);
        clearInterval(timer);
        onCompleteRef.current?.();
      } else {
        setDisplayed(text.slice(0, idxRef.current));
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ display: 'inline-block', width: 2, height: 16, background: '#00C9A7', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'text-bottom' }} />
      )}
    </span>
  );
};

const CodeStream: React.FC<{ lines: string[]; progress: number; isActive: boolean }> = ({ lines, progress, isActive }) => {
  const codeRef = useRef<HTMLDivElement>(null);
  const visibleCount = isActive ? Math.floor((progress / 100) * lines.length) : (progress === 100 ? lines.length : 0);

  useEffect(() => {
    if (codeRef.current) codeRef.current.scrollTop = codeRef.current.scrollHeight;
  }, [visibleCount]);

  if (visibleCount === 0) return null;

  return (
    <div ref={codeRef} style={{ background: '#1E293B', padding: '12px 16px', maxHeight: 200, overflowY: 'auto', fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: 12, lineHeight: 1.8 }}>
      {lines.slice(0, visibleCount).map((line, i) => (
        <div key={i} style={{ color: line.startsWith('//') || line.startsWith('🔍') || line.startsWith('✅') || line.startsWith('⚠️') || line.startsWith('📋') ? '#94A3B8' : line.startsWith('<') || line.includes('/>') ? '#7DD3FC' : line.includes('function') || line.includes('const') || line.includes('let') ? '#C4B5FD' : '#E2E8F0' }}>
          <span style={{ color: '#475569', marginRight: 12, userSelect: 'none' }}>{String(i + 1).padStart(2, ' ')}</span>
          {line}
        </div>
      ))}
      {isActive && progress < 100 && (
        <span style={{ display: 'inline-block', width: 8, height: 14, background: '#00C9A7', animation: 'blink 0.8s infinite' }} />
      )}
    </div>
  );
};

const ImageLightbox: React.FC<{ src: string; label: string; onClose: () => void }> = ({ src, label, onClose }) => (
  <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
    <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <X size={20} />
    </button>
    <div onClick={e => e.stopPropagation()} style={{ maxWidth: '80vw', maxHeight: '80vh' }}>
      <img src={src} alt={label} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} />
      <div style={{ textAlign: 'center', color: '#fff', marginTop: 12, fontSize: 14 }}>{label}</div>
    </div>
  </div>
);

const ImageGenerationPanel: React.FC<{ stage: any; isExpanded: boolean; onToggle: () => void }> = ({ stage, isExpanded, onToggle }) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const getVisibleCount = () => {
    if (stage.status === 'completed') return GENERATED_IMAGES.length;
    if (stage.status === 'in-progress') {
      if (stage.progress >= 90) return 4;
      if (stage.progress >= 65) return 3;
      if (stage.progress >= 40) return 2;
      if (stage.progress >= 15) return 1;
    }
    return 0;
  };
  const visibleCount = getVisibleCount();

  return (
    <div style={panelStyles.card}>
      <div style={panelStyles.header} onClick={onToggle}>
        <div style={panelStyles.headerLeft}>
          <ImageIcon size={18} color="#00C9A7" />
          <span style={panelStyles.headerTitle}>图片生成</span>
          <StatusIcon status={stage.status} />
        </div>
        <div style={panelStyles.headerRight}>
          {stage.status !== 'pending' && <span style={panelStyles.percentage}>{stage.progress}%</span>}
          {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: '12px 16px' }}>
          {stage.status !== 'pending' && (
            <div style={panelStyles.progressBar}>
              <div style={{ ...panelStyles.progressFill, width: `${stage.progress}%`, background: stage.status === 'completed' ? '#00C9A7' : 'linear-gradient(90deg, #00C9A7, #00A8E8)' }} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 12 }}>
            {GENERATED_IMAGES.map((img, i) => (
              <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', cursor: i < visibleCount ? 'pointer' : 'default', position: 'relative', aspectRatio: '4/3', background: '#F1F5F9' }} onClick={() => i < visibleCount && setLightboxIdx(i)}>
                {i < visibleCount ? (
                  <img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.5s ease' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px', background: 'linear-gradient(transparent, rgba(0,0,0,0.5))', color: '#fff', fontSize: 11 }}>{img.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {lightboxIdx !== null && (
        <ImageLightbox src={GENERATED_IMAGES[lightboxIdx].src} label={GENERATED_IMAGES[lightboxIdx].label} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  );
};

const CODE_INTRO_TEXT = '我来为你生成一个精美的小学英语身体部位听力互动游戏，包含听音辨位、触屏操作和趣味动作反馈三个渐进关卡！';
const CODE_ASSETS_TEXT = '首先让我生成所需的图片素材：好的！现在为您生成一个完整的小学英语身体部位听力互动游戏，包含单词与图片配对、词义配对和听音配对三个渐进关卡系统，完美适配PC端和移动端。';

const CodeGenerationPanel: React.FC<{ stages: any[]; isExpanded: boolean; onToggle: () => void }> = ({ stages, isExpanded, onToggle }) => {
  const codeStage = stages[0];
  const reviewStage = stages[1];
  const fixStage = stages[2];
  const overallStatus = fixStage?.status === 'completed' ? 'completed' : codeStage?.status === 'pending' ? 'pending' : 'in-progress';
  const overallProgress = Math.round(((codeStage?.progress || 0) + (reviewStage?.progress || 0) + (fixStage?.progress || 0)) / 3);
  const [introTextDone, setIntroTextDone] = useState(false);

  return (
    <div style={panelStyles.card}>
      <div style={panelStyles.header} onClick={onToggle}>
        <div style={panelStyles.headerLeft}>
          <Code size={18} color="#00C9A7" />
          <span style={panelStyles.headerTitle}>课件生成</span>
          <StatusIcon status={overallStatus} />
        </div>
        <div style={panelStyles.headerRight}>
          {overallStatus !== 'pending' && <span style={panelStyles.percentage}>{overallProgress}%</span>}
          {isExpanded ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
        </div>
      </div>
      {isExpanded && (
        <div style={{ padding: '16px 20px' }}>
          {codeStage && codeStage.status !== 'pending' && (
            <>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 12 }}>
                <StreamingText text={CODE_INTRO_TEXT} speed={20} onComplete={() => {}} />
              </div>
              <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, marginBottom: 14 }}>
                <StreamingText text={CODE_ASSETS_TEXT} speed={20} onComplete={() => setIntroTextDone(true)} />
              </div>
            </>
          )}

          {introTextDone && codeStage && codeStage.status !== 'pending' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <StatusIcon status={codeStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码生成</span>
                {codeStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在为您生成课件代码...</span>}
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', background: '#334155' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>index.html</span>
                  <button style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    📋 复制
                  </button>
                </div>
                <CodeStream lines={MOCK_CODE_LINES} progress={codeStage.progress} isActive={codeStage.status === 'in-progress'} />
              </div>
            </div>
          )}

          {introTextDone && reviewStage && reviewStage.status !== 'pending' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <StatusIcon status={reviewStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码审查</span>
                {reviewStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在审查代码质量...</span>}
              </div>
              <div style={{ background: '#F8FAFE', borderRadius: 10, padding: '12px 16px', border: '1px solid #E2E8F0' }}>
                <StreamingText text={REVIEW_LINES[0]} speed={30} onComplete={() => {}} />
              </div>
            </div>
          )}

          {introTextDone && fixStage && fixStage.status !== 'pending' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <StatusIcon status={fixStage.status} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>代码修复</span>
                {fixStage.status === 'in-progress' && <span style={{ fontSize: 12, color: '#94A3B8' }}>正在修复发现的问题...</span>}
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', background: '#334155' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>js/main.js</span>
                  <button style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    📋 复制
                  </button>
                </div>
                <CodeStream lines={FIX_CODE_LINES} progress={fixStage.progress} isActive={fixStage.status === 'in-progress'} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProgressPanel: React.FC<ProgressPanelProps> = ({ progress }) => {
  const [textDone, setTextDone] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(true);
  const [codeExpanded, setCodeExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const imageStage = progress.stages[0];
  const codeStages = progress.stages.slice(1);

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, padding: '14px 18px', background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <StreamingText text={CONFIRM_TEXT} speed={25} onComplete={() => setTextDone(true)} />
      </div>

      {textDone && imageStage && (
        <ImageGenerationPanel stage={imageStage} isExpanded={imageExpanded} onToggle={() => setImageExpanded(v => !v)} />
      )}

      {textDone && codeStages.length > 0 && codeStages[0].status !== 'pending' && (
        <CodeGenerationPanel stages={codeStages} isExpanded={codeExpanded} onToggle={() => setCodeExpanded(v => !v)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

const panelStyles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1E293B',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  percentage: {
    fontSize: 13,
    color: '#00C9A7',
    fontWeight: 600,
  },
  progressBar: {
    height: 4,
    background: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.4s ease',
  },
};

export default ProgressPanel;
