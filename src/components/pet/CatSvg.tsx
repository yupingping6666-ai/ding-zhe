import type { PetExpression } from '@/types'

interface CatSvgProps {
  expression: PetExpression
  className?: string
}

/**
 * 3D卡通猫咪 - 严格按照设计稿实现
 * 设计稿特点：
 * - 大头小身体的Q版比例
 * - 圆润可爱的造型
 * - 橙色配色 (#FFB366 主色, #FFE0B2 浅色腹部)
 * - 大眼睛、小鼻子、微笑嘴巴
 * - 14种表情和姿势状态
 */
export default function CatSvg({ expression, className }: CatSvgProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 身体渐变 - 橙色 */}
        <radialGradient id="bodyGrad" cx="45%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#FFC080" />
          <stop offset="60%" stopColor="#FFB366" />
          <stop offset="100%" stopColor="#FFA050" />
        </radialGradient>
        
        {/* 腹部渐变 - 浅米色 */}
        <radialGradient id="bellyGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#FFF0E0" />
          <stop offset="100%" stopColor="#FFE0B2" />
        </radialGradient>
        
        {/* 耳朵内部 */}
        <radialGradient id="earInnerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE8D0" />
          <stop offset="100%" stopColor="#FFD0A0" />
        </radialGradient>
        
        {/* 柔和阴影 */}
        <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#00000008" />
        </filter>
        
        {/* 发光效果 */}
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 根据表情渲染不同的身体姿势 */}
      {renderBody(expression)}
      {renderHead(expression)}
      {renderFace(expression)}
      {renderEffects(expression)}
    </svg>
  )
}

// 渲染身体部分
function renderBody(expression: PetExpression): React.ReactNode {
  switch (expression) {
    case 'lying':
      // 躺姿 - 横向身体
      return (
        <g filter="url(#softShadow)">
          {/* 身体 - 横向椭圆 */}
          <ellipse cx="100" cy="138" rx="58" ry="22" fill="url(#bodyGrad)" />
          <ellipse cx="100" cy="142" rx="38" ry="14" fill="url(#bellyGrad)" />
          
          {/* 尾巴 - 放松卷曲 */}
          <path
            d="M152 135 Q172 122 168 105 Q166 95 173 90"
            stroke="#FFB366"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="173" cy="88" r="5.5" fill="#FF8C42" />
          
          {/* 前爪 - 向前伸展 */}
          <ellipse cx="68" cy="152" rx="10" ry="6" fill="#FFB366" />
          <ellipse cx="132" cy="152" rx="10" ry="6" fill="#FFB366" />
        </g>
      )
    
    case 'playing':
      // 玩耍姿势 - 活泼
      return (
        <g filter="url(#softShadow)">
          {/* 尾巴 - 摇摆 */}
          <g className="animate-tail-wag" style={{ transformOrigin: '148px 128px' }}>
            <path
              d="M148 128 Q168 108 163 85 Q161 75 168 70"
              stroke="#FFB366"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="168" cy="68" r="5.5" fill="#FF8C42" />
          </g>
          
          {/* 身体 */}
          <ellipse cx="100" cy="135" rx="40" ry="28" fill="url(#bodyGrad)" />
          <ellipse cx="100" cy="140" rx="26" ry="18" fill="url(#bellyGrad)" />
          
          {/* 前爪 - 举起 */}
          <g className="animate-float">
            <ellipse cx="65" cy="112" rx="8" ry="10" fill="#FFB366" />
            <ellipse cx="135" cy="108" rx="8" ry="10" fill="#FFB366" />
          </g>
        </g>
      )
    
    case 'sitting':
      // 坐姿 - 端正
      return (
        <g filter="url(#softShadow)">
          {/* 尾巴 - 卷在身边 */}
          <path
            d="M138 142 Q155 138 152 122 Q150 112 158 107"
            stroke="#FFB366"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="158" cy="105" r="5.5" fill="#FF8C42" />
          
          {/* 身体 - 坐直 */}
          <ellipse cx="100" cy="142" rx="36" ry="30" fill="url(#bodyGrad)" />
          <ellipse cx="100" cy="148" rx="23" ry="18" fill="url(#bellyGrad)" />
          
          {/* 前爪 - 放在前面 */}
          <ellipse cx="84" cy="165" rx="9" ry="7" fill="#FFB366" />
          <ellipse cx="116" cy="165" rx="9" ry="7" fill="#FFB366" />
        </g>
      )
    
    case 'standing':
      // 站姿 - 四腿站立
      return (
        <g filter="url(#softShadow)">
          {/* 尾巴 - 竖起 */}
          <path
            d="M142 120 Q158 105 155 85 Q153 75 160 70"
            stroke="#FFB366"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="160" cy="68" r="5.5" fill="#FF8C42" />
          
          {/* 身体 */}
          <ellipse cx="100" cy="132" rx="34" ry="32" fill="url(#bodyGrad)" />
          <ellipse cx="100" cy="138" rx="22" ry="20" fill="url(#bellyGrad)" />
          
          {/* 四条腿 */}
          <ellipse cx="76" cy="160" rx="7" ry="10" fill="#FFB366" />
          <ellipse cx="90" cy="160" rx="7" ry="10" fill="#FFB366" />
          <ellipse cx="110" cy="160" rx="7" ry="10" fill="#FFB366" />
          <ellipse cx="124" cy="160" rx="7" ry="10" fill="#FFB366" />
        </g>
      )
    
    default:
      // 默认姿势 - 大头小身体
      return (
        <g filter="url(#softShadow)">
          {/* 尾巴 */}
          <g className={expression === 'happy' ? 'animate-tail-wag' : 'animate-tail-sway'} style={{ transformOrigin: '148px 132px' }}>
            <path
              d="M148 132 Q168 112 163 88 Q161 78 168 73"
              stroke="#FFB366"
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="168" cy="71" r="5.5" fill="#FF8C42" />
          </g>
          
          {/* 身体 */}
          <ellipse cx="100" cy="138" rx="40" ry="26" fill="url(#bodyGrad)" />
          <ellipse cx="100" cy="143" rx="26" ry="16" fill="url(#bellyGrad)" />
          
          {/* 肚子条纹 */}
          <path d="M88 138 Q100 146 112 138" stroke="#FFB366" strokeWidth="1.5" fill="none" opacity="0.4" />
          <path d="M90 144 Q100 150 110 144" stroke="#FFB366" strokeWidth="1.5" fill="none" opacity="0.3" />
          
          {/* 前爪 */}
          <ellipse cx="80" cy="158" rx="8" ry="6" fill="#FFB366" />
          <ellipse cx="120" cy="158" rx="8" ry="6" fill="#FFB366" />
        </g>
      )
  }
}

// 渲染头部
function renderHead(expression: PetExpression): React.ReactNode {
  return (
    <g filter="url(#softShadow)">
      {/* 耳朵 */}
      {/* 左耳 */}
      <path d="M56 78 L43 36 L76 63" fill="url(#bodyGrad)" />
      <path d="M59 73 L49 43 L73 64" fill="url(#earInnerGrad)" />
      <path d="M61 70 L53 49 L70 64" fill="#FFE8D0" opacity="0.5" />
      
      {/* 右耳 */}
      <path d="M144 78 L157 36 L124 63" fill="url(#bodyGrad)" />
      <path d="M141 73 L151 43 L127 64" fill="url(#earInnerGrad)" />
      <path d="M139 70 L147 49 L130 64" fill="#FFE8D0" opacity="0.5" />

      {/* 头部 - 大圆脸 */}
      <circle cx="100" cy="88" r="52" fill="url(#bodyGrad)" />
      
      {/* 脸颊红晕 */}
      <circle cx="62" cy="93" r="9" fill="#FF8C42" opacity="0.25" />
      <circle cx="138" cy="93" r="9" fill="#FF8C42" opacity="0.25" />

      {/* 额头花纹 - M形 */}
      <path d="M82 62 L87 73 L82 83" stroke="#FF8C42" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M100 58 L100 73 L100 83" stroke="#FF8C42" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M118 62 L113 73 L118 83" stroke="#FF8C42" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
    </g>
  )
}

// 渲染面部表情（眼睛、鼻子、嘴巴、胡须）
function renderFace(expression: PetExpression): React.ReactNode {
  return (
    <g>
      {/* 眼睛 */}
      {renderEyes(expression)}
      
      {/* 鼻子 - 小三角 */}
      <path d="M97 98 L103 98 L100 102Z" fill="#FF8A80" />
      <ellipse cx="100" cy="100" rx="2" ry="1.5" fill="#FFB3B3" opacity="0.5" />
      
      {/* 嘴巴 */}
      {renderMouth(expression)}
      
      {/* 胡须 */}
      <g stroke="#FFFFFF" strokeWidth="1.2" opacity="0.5" strokeLinecap="round">
        <line x1="48" y1="90" x2="72" y2="95" />
        <line x1="46" y1="96" x2="70" y2="98" />
        <line x1="48" y1="102" x2="72" y2="101" />
        <line x1="152" y1="90" x2="128" y2="95" />
        <line x1="154" y1="96" x2="130" y2="98" />
        <line x1="152" y1="102" x2="128" y2="101" />
      </g>
    </g>
  )
}

// 渲染眼睛 - 按照设计稿的14种表情
function renderEyes(expression: PetExpression): React.ReactNode {
  const eyeColor = expression === 'empty' ? '#999' : '#4A3728'
  
  switch (expression) {
    case 'happy':
      // 开心 - 弯弯的笑眼
      return (
        <>
          <path d="M76 86 Q83 78 90 86" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M110 86 Q117 78 124 86" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )
    
    case 'sleeping':
      // 困倦 - 闭合的眼睛
      return (
        <>
          <path d="M74 88 Q83 92 92 88" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M108 88 Q117 92 126 88" stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )
    
    case 'love':
      // 爱心眼
      return (
        <>
          <path d="M79 84 L83 90 L87 84 Q83 80 79 84Z" fill="#FF4081" />
          <path d="M113 84 L117 90 L121 84 Q117 80 113 84Z" fill="#FF4081" />
        </>
      )
    
    case 'curious':
      // 好奇 - 一大一小眼睛
      return (
        <>
          <ellipse cx="83" cy="86" rx="6" ry="7" fill={eyeColor} />
          <ellipse cx="117" cy="86" rx="5" ry="5" fill={eyeColor} />
          <circle cx="81" cy="84" r="2" fill="white" />
          <circle cx="115" cy="84" r="1.5" fill="white" />
        </>
      )
    
    case 'angry':
      // 生气 - 皱眉
      return (
        <>
          <ellipse cx="83" cy="88" rx="5" ry="5" fill={eyeColor} />
          <ellipse cx="117" cy="88" rx="5" ry="5" fill={eyeColor} />
          <path d="M73 78 L93 83" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M127 78 L107 83" stroke={eyeColor} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )
    
    case 'playing':
      // 玩耍 - 闪亮大眼
      return (
        <>
          <ellipse cx="83" cy="86" rx="6" ry="7" fill={eyeColor} />
          <ellipse cx="117" cy="86" rx="6" ry="7" fill={eyeColor} />
          <circle cx="81" cy="84" r="2.5" fill="white" />
          <circle cx="115" cy="84" r="2.5" fill="white" />
          <circle cx="85" cy="88" r="1" fill="white" />
          <circle cx="119" cy="88" r="1" fill="white" />
        </>
      )
    
    case 'error':
      // 错误 - X眼睛
      return (
        <g stroke="#FF5252" strokeWidth="2.5" strokeLinecap="round">
          <line x1="78" y1="83" x2="88" y2="89" />
          <line x1="88" y1="83" x2="78" y2="89" />
          <line x1="112" y1="83" x2="122" y2="89" />
          <line x1="122" y1="83" x2="112" y2="89" />
        </g>
      )
    
    case 'thinking':
      // 思考 - 看向一侧
      return (
        <>
          <ellipse cx="85" cy="86" rx="5" ry="6" fill={eyeColor} />
          <ellipse cx="115" cy="86" rx="5" ry="6" fill={eyeColor} />
          <circle cx="83" cy="84" r="2" fill="white" />
          <circle cx="113" cy="84" r="2" fill="white" />
          <circle cx="87" cy="88" r="1" fill="white" opacity="0.5" />
          <circle cx="117" cy="88" r="1" fill="white" opacity="0.5" />
        </>
      )
    
    case 'notification':
      // 通知 - 惊讶大眼
      return (
        <>
          <ellipse cx="83" cy="86" rx="7" ry="8" fill={eyeColor} />
          <ellipse cx="117" cy="86" rx="7" ry="8" fill={eyeColor} />
          <circle cx="81" cy="83" r="3" fill="white" />
          <circle cx="115" cy="83" r="3" fill="white" />
        </>
      )
    
    case 'empty':
      // 空状态 - 无神小眼
      return (
        <>
          <ellipse cx="83" cy="88" rx="4" ry="3" fill="#999" />
          <ellipse cx="117" cy="88" rx="4" ry="3" fill="#999" />
        </>
      )
    
    case 'achievement':
      // 成就 - 星星眼
      return (
        <>
          <ellipse cx="83" cy="86" rx="6" ry="7" fill={eyeColor} />
          <ellipse cx="117" cy="86" rx="6" ry="7" fill={eyeColor} />
          <circle cx="81" cy="84" r="2.5" fill="white" />
          <circle cx="115" cy="84" r="2.5" fill="white" />
          <circle cx="85" cy="88" r="1" fill="white" />
          <circle cx="119" cy="88" r="1" fill="white" />
        </>
      )
    
    default:
      // idle, eating, sitting, lying, standing - 默认圆眼
      return (
        <>
          <ellipse cx="83" cy="86" rx="6" ry="7" fill={eyeColor} />
          <ellipse cx="117" cy="86" rx="6" ry="7" fill={eyeColor} />
          <circle cx="81" cy="84" r="2.5" fill="white" />
          <circle cx="115" cy="84" r="2.5" fill="white" />
          <circle cx="85" cy="88" r="1" fill="white" opacity="0.6" />
          <circle cx="119" cy="88" r="1" fill="white" opacity="0.6" />
        </>
      )
  }
}

// 渲染嘴巴 - 按照设计稿的14种表情
function renderMouth(expression: PetExpression): React.ReactNode {
  const mouthColor = expression === 'empty' ? '#999' : expression === 'error' ? '#FF5252' : expression === 'love' ? '#FF4081' : '#4A3728'
  
  switch (expression) {
    case 'happy':
      return <path d="M92 104 Q100 112 108 104" stroke={mouthColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'sleeping':
      return <path d="M95 106 Q100 108 105 106" stroke={mouthColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    case 'love':
      return <path d="M92 104 Q100 112 108 104" stroke={mouthColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'angry':
      return <path d="M93 107 Q100 102 107 107" stroke={mouthColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'curious':
      return (
        <>
          <path d="M95 105 Q100 109 105 105" stroke={mouthColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="110" r="2" fill={mouthColor} opacity="0.3" />
        </>
      )
    case 'eating':
      return <ellipse cx="100" cy="106" rx="5" ry="4" fill={mouthColor} />
    case 'thinking':
      return <path d="M96 106 Q100 108 104 106" stroke={mouthColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    case 'error':
      return <path d="M93 107 Q100 102 107 107" stroke={mouthColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'notification':
      return <ellipse cx="100" cy="106" rx="4" ry="5" fill={mouthColor} />
    case 'empty':
      return <path d="M96 106 Q100 104 104 106" stroke={mouthColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    case 'playing':
      return <path d="M92 104 Q100 112 108 104" stroke={mouthColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'achievement':
      return <path d="M92 104 Q100 112 108 104" stroke={mouthColor} strokeWidth="2" fill="none" strokeLinecap="round" />
    default:
      // idle, sitting, lying, standing
      return <path d="M94 105 Q100 110 106 105" stroke={mouthColor} strokeWidth="2" fill="none" strokeLinecap="round" />
  }
}

// 渲染特效
function renderEffects(expression: PetExpression): React.ReactNode {
  switch (expression) {
    case 'love':
      return (
        <g filter="url(#glow)">
          <text x="38" y="56" fontSize="18" fill="#FF4081" className="animate-float">❤️</text>
          <text x="150" y="46" fontSize="14" fill="#FF4081" className="animate-float" style={{ animationDelay: '0.5s' }}>❤️</text>
          <text x="162" y="76" fontSize="12" fill="#FF4081" className="animate-float" style={{ animationDelay: '1s' }}>✨</text>
        </g>
      )
    
    case 'achievement':
      return (
        <g filter="url(#glow)">
          <text x="28" y="48" fontSize="16" fill="#FFD700" className="animate-float">⭐</text>
          <text x="155" y="40" fontSize="14" fill="#FFD700" className="animate-float" style={{ animationDelay: '0.3s' }}>🏆</text>
          <text x="168" y="70" fontSize="12" fill="#FFD700" className="animate-float" style={{ animationDelay: '0.6s' }}>✨</text>
        </g>
      )
    
    case 'notification':
      return (
        <g>
          <circle cx="158" cy="50" r="12" fill="#FF5252" />
          <text x="152" y="55" fontSize="14" fill="white" fontWeight="bold">!</text>
        </g>
      )
    
    case 'sleeping':
      return (
        <g>
          <text x="148" y="50" fontSize="14" fill="#999" className="animate-float">z</text>
          <text x="158" y="40" fontSize="12" fill="#bbb" className="animate-float" style={{ animationDelay: '0.5s' }}>z</text>
          <text x="165" y="33" fontSize="10" fill="#ddd" className="animate-float" style={{ animationDelay: '1s' }}>z</text>
        </g>
      )
    
    case 'empty':
      return (
        <g opacity="0.4">
          {/* 小脚印装饰代替 PNG 引用 */}
          <circle cx="28" cy="158" r="4" fill="#FFB366" />
          <circle cx="22" cy="152" r="2.5" fill="#FFB366" />
          <circle cx="34" cy="152" r="2.5" fill="#FFB366" />
          <circle cx="163" cy="162" r="4" fill="#FFB366" />
          <circle cx="157" cy="156" r="2.5" fill="#FFB366" />
          <circle cx="169" cy="156" r="2.5" fill="#FFB366" />
        </g>
      )
    
    case 'playing':
      return (
        <g>
          <text x="35" y="52" fontSize="16" fill="#FFD700" className="animate-float">✨</text>
          <text x="155" y="48" fontSize="14" fill="#FFD700" className="animate-float" style={{ animationDelay: '0.3s' }}>⭐</text>
        </g>
      )
    
    default:
      return null
  }
}

