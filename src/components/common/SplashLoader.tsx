import { motion } from 'framer-motion';

const CSS = `
  @keyframes fluid-flow {
    0%   { background-position: 50% 0%; }
    100% { background-position: 50% 200%; }
  }
  @keyframes fluid-glow {
    0%, 100% {
      filter:
        drop-shadow(0 0 14px rgba(155, 79, 222, 0.95))
        drop-shadow(0 0 36px rgba(155, 79, 222, 0.40));
    }
    38% {
      filter:
        drop-shadow(0 0 20px rgba(224, 64, 251, 1.00))
        drop-shadow(0 0 52px rgba(255, 100, 180, 0.55));
    }
    72% {
      filter:
        drop-shadow(0 0 20px rgba(0, 229, 255, 0.95))
        drop-shadow(0 0 52px rgba(0, 180, 220, 0.45));
    }
  }
  @keyframes ambient-breathe {
    0%, 100% { opacity: 0.55; transform: scale(1);    }
    50%       { opacity: 0.90; transform: scale(1.18); }
  }
  .splash-b-front {
    font-family: 'Bebas Neue', 'Arial Black', Arial, sans-serif;
    font-size: clamp(150px, 28vw, 280px);
    line-height: 0.88;
    display: block;
    background: linear-gradient(
      180deg,
      #7B2FBE  0%,
      #9B4FDE 12%,
      #E040FB 30%,
      #FF6EB4 48%,
      #00E5FF 66%,
      #4DC8FF 78%,
      #9B4FDE 90%,
      #7B2FBE 100%
    );
    background-size: 100% 300%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: fluid-flow 2.6s linear infinite, fluid-glow 2.6s ease-in-out infinite;
    position: relative;
    z-index: 1;
    user-select: none;
    pointer-events: none;
  }
  .splash-b-back {
    font-family: 'Bebas Neue', 'Arial Black', Arial, sans-serif;
    font-size: clamp(150px, 28vw, 280px);
    line-height: 0.88;
    display: block;
    color: #12002A;
    text-shadow:
      -1px -1px 0 #16032E,
      -2px -2px 0 #1A0432,
      -3px -3px 0 #1E0638,
      -4px -4px 0 #22083E,
      -5px -5px 0 #260A44,
      -6px -6px 0 #2A0C4A,
      -7px -7px 0 #2E0E50,
      -8px -8px 0 #321058;
    position: absolute;
    top: 9px;
    left: 9px;
    z-index: 0;
    user-select: none;
    pointer-events: none;
  }
`;

interface Props {
  message?: string;
}

export default function SplashLoader({ message = 'Chargement…' }: Props) {
  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          minHeight: '100vh',
          background: '#09060F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '36px',
        }}
      >
        {/* B 3D */}
        <div style={{ position: 'relative' }}>
          {/* Halo ambiant derrière le B */}
          <div
            style={{
              position: 'absolute',
              inset: '-50px -30px',
              background:
                'radial-gradient(ellipse at center, rgba(155,79,222,0.18) 0%, rgba(224,64,251,0.10) 40%, transparent 70%)',
              animation: 'ambient-breathe 2.6s ease-in-out infinite',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
          {/* Extrusion (fond) */}
          <span className="splash-b-back" aria-hidden="true">B</span>
          {/* Face avant animée */}
          <span className="splash-b-front">B</span>
        </div>

        {/* Dots + message */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1.25, 0.75] }}
                transition={{ duration: 1.3, delay: i * 0.22, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #9B4FDE, #00E5FF)',
                }}
              />
            ))}
          </div>

          {message && (
            <p
              style={{
                color: 'rgba(255,255,255,0.28)',
                fontFamily: 'Sora, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
