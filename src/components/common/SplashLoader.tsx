import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// ── Géométrie du B (proportions Bebas Neue) ───────────────────────────────────
function createBShape(): THREE.Shape {
  const H  = 2.0;   // hauteur totale
  const S  = 0.36;  // largeur de la hampe verticale
  const M  = 1.08;  // jonction upper/lower bump (54% de H)
  const BW = 1.28;  // largeur max des bosses

  const shape = new THREE.Shape();

  // Contour extérieur (sens horaire vu de face)
  shape.moveTo(0, 0);
  shape.lineTo(0, H);
  shape.lineTo(BW * 0.62, H);
  shape.quadraticCurveTo(BW * 0.98, H,       BW * 0.98, H - 0.26);
  shape.quadraticCurveTo(BW * 0.98, M + 0.08, BW * 0.76, M + 0.02);
  shape.quadraticCurveTo(BW * 1.06, M - 0.02, BW * 1.06, M - 0.28);
  shape.quadraticCurveTo(BW * 1.06, 0,        BW * 0.68, 0);
  shape.lineTo(0, 0);

  // Trou supérieur (contre-forme du bosse haute, sens antihoraire)
  const top = new THREE.Path();
  top.moveTo(S, H - 0.1);
  top.lineTo(S, M + 0.1);
  top.lineTo(BW * 0.6, M + 0.1);
  top.quadraticCurveTo(BW * 0.86, M + 0.1,  BW * 0.86, H - 0.3);
  top.quadraticCurveTo(BW * 0.86, H - 0.1,  BW * 0.56, H - 0.1);
  top.closePath();

  // Trou inférieur (contre-forme du bosse basse, sens antihoraire)
  const bot = new THREE.Path();
  bot.moveTo(S, 0.1);
  bot.lineTo(BW * 0.62, 0.1);
  bot.quadraticCurveTo(BW * 0.92, 0.1,  BW * 0.92, M - 0.32);
  bot.quadraticCurveTo(BW * 0.92, M - 0.1, BW * 0.6, M - 0.1);
  bot.lineTo(S, M - 0.1);
  bot.closePath();

  shape.holes.push(top, bot);
  return shape;
}

// ── Vertex shader ─────────────────────────────────────────────────────────────
const vert = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNorm;
  void main() {
    vPos  = position;
    vNorm = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ── Fragment shader — fluide neon animé ───────────────────────────────────────
const frag = /* glsl */ `
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNorm;

  // Gradient noise 3D (value noise)
  vec3 hash3(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p.zxy, p.yxz + 19.19);
    return fract(vec3(p.x * p.y, p.y * p.z, p.z * p.x) * 2.0) * 2.0 - 1.0;
  }
  float gnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dot(hash3(i),              f),
              dot(hash3(i+vec3(1,0,0)),  f-vec3(1,0,0)), u.x),
          mix(dot(hash3(i+vec3(0,1,0)),  f-vec3(0,1,0)),
              dot(hash3(i+vec3(1,1,0)),  f-vec3(1,1,0)), u.x), u.y),
      mix(mix(dot(hash3(i+vec3(0,0,1)),  f-vec3(0,0,1)),
              dot(hash3(i+vec3(1,0,1)),  f-vec3(1,0,1)), u.x),
          mix(dot(hash3(i+vec3(0,1,1)),  f-vec3(0,1,1)),
              dot(hash3(i+vec3(1,1,1)),  f-vec3(1,1,1)), u.x), u.y), u.z);
  }
  float fbm(vec3 p) {
    return gnoise(p)        * 0.500
         + gnoise(p * 2.1)  * 0.250
         + gnoise(p * 4.3)  * 0.125
         + gnoise(p * 8.7)  * 0.062;
  }

  void main() {
    float t = uTime * 0.38;

    // Deux couches de turbulence décalées dans le temps
    float base  = fbm(vec3(vPos.xy * 1.6,  t));
    float twist = fbm(vec3(vPos.xy * 2.8 + vec2(3.7, 1.9), t * 1.25));

    // Flux montant (Y) + perturbation horizontale
    float flow = fract(vPos.y * 0.55 - t * 0.45 + base * 0.45 + twist * 0.18);

    // Palette violet → rose → cyan (cycle continu)
    vec3 c0 = vec3(0.49, 0.12, 0.87);  // violet
    vec3 c1 = vec3(0.88, 0.25, 0.98);  // rose
    vec3 c2 = vec3(0.00, 0.90, 1.00);  // cyan

    vec3 col;
    float seg = flow * 3.0;
    if      (seg < 1.0) col = mix(c0, c1, seg);
    else if (seg < 2.0) col = mix(c1, c2, seg - 1.0);
    else                col = mix(c2, c0, seg - 2.0);

    // Variation de luminosité liée au bruit
    col *= 0.75 + 0.45 * (base * 0.5 + 0.5);

    // ── Éclairage physique simplifié ──────────────────────────────────────────
    vec3 L = normalize(vec3(1.2, 2.0, 3.0));
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 N = vNorm;

    float diff = max(dot(N, L), 0.0);
    vec3  H_   = normalize(L + V);
    float spec = pow(max(dot(N, H_), 0.0), 48.0);

    col = col * (0.22 + diff * 0.78) + spec * 0.55 * vec3(0.9, 0.75, 1.0);

    // ── Fresnel — halo néon sur les arêtes ────────────────────────────────────
    float fr = pow(1.0 - abs(dot(N, V)), 2.8);
    col += fr * (c0 * 0.6 + c2 * 0.4) * 1.4;

    // ── Lueur intérieure sur la face avant ───────────────────────────────────
    float inner = smoothstep(0.2, 0.0, abs(dot(N, V) - 1.0));
    col += inner * col * 0.25;

    gl_FragColor = vec4(clamp(col, 0.0, 2.0), 1.0);
  }
`;

// ── Mesh 3D ───────────────────────────────────────────────────────────────────
function BLetter() {
  const meshRef = useRef<THREE.Mesh>(null!);

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(createBShape(), {
      depth:          0.42,
      bevelEnabled:   true,
      bevelThickness: 0.06,
      bevelSize:      0.04,
      bevelSegments:  6,
      steps:          2,
    });
    geo.center();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader:   vert,
        fragmentShader: frag,
        uniforms: { uTime: { value: 0 } },
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    meshRef.current.rotation.y = Math.sin(t * 0.28) * 0.55;
    meshRef.current.rotation.x = Math.sin(t * 0.18) * 0.12;
    (material.uniforms.uTime as THREE.IUniform<number>).value = t;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// ── Composant public ──────────────────────────────────────────────────────────
interface Props {
  message?: string;
  /** Sans fond plein écran — pour les zones intérieures avec navbar */
  inline?: boolean;
}

export default function SplashLoader({ message = 'Chargement…', inline = false }: Props) {
  const canvasSize = inline ? 180 : 300;

  return (
    <div
      style={{
        ...(inline
          ? { padding: '60px 0' }
          : { minHeight: '100vh', background: '#09060F' }),
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '28px',
      }}
    >
      {/* Canvas Three.js */}
      <div style={{ width: canvasSize, height: canvasSize }}>
        <Canvas
          camera={{ position: [0, 0, 3.8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.15} />
          <pointLight position={[3, 4, 5]} intensity={1.2} color="#9B4FDE" />
          <pointLight position={[-3, -2, 3]} intensity={0.6} color="#00E5FF" />
          <BLetter />
        </Canvas>
      </div>

      {/* Points animés + message */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '9px' }}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.3, 0.7] }}
              transition={{ duration: 1.3, delay: i * 0.22, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'linear-gradient(135deg,#9B4FDE,#00E5FF)',
              }}
            />
          ))}
        </div>
        {message && (
          <p style={{
            margin: 0,
            color: 'rgba(255,255,255,0.28)',
            fontFamily: 'Sora, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
