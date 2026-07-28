'use client';

import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as THREE from 'three/webgpu';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import type { Mesh } from 'three';

import {
  abs,
  add,
  blendScreen,
  float,
  mix,
  mod,
  mx_cell_noise_float,
  oneMinus,
  pass,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

/* Texturas locais (public/) — nada de CDN de terceiros.
   O mapa de profundidade foi gerado junto com o skyline, então a
   varredura percorre de fato os planos da cena, do fundo à frente. */
const TEXTUREMAP = { src: '/hero-skyline.png' };
const DEPTHMAP = { src: '/hero-depth.png' };

const WIDTH = 800;
const HEIGHT = 800;

/* Vermelho-tijolo da marca, em intensidade de emissão (>1 alimenta o bloom) */
const BRAND_GLOW = [9.5, 1.5, 1.1] as const;
const SCAN_TINT = [1, 0.2, 0.15] as const;

extend(THREE as any);

const PostProcessing = ({
  strength = 1,
  threshold = 1,
  fullScreenEffect = true,
}: {
  strength?: number;
  threshold?: number;
  fullScreenEffect?: boolean;
}) => {
  const { gl, scene, camera } = useThree();
  const progressRef = useRef({ value: 0 });

  const render = useMemo(() => {
    const postProcessing = new THREE.PostProcessing(gl as any);
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode('output');
    const bloomPass = bloom(scenePassColor, strength, 0.5, threshold);

    const uScanProgress = uniform(0);
    progressRef.current = uScanProgress;

    const scanPos = float(uScanProgress);
    const uvY = uv().y;
    const scanWidth = float(0.05);
    const scanLine = smoothstep(0, scanWidth, abs(uvY.sub(scanPos)));
    const overlay = vec3(...SCAN_TINT).mul(oneMinus(scanLine)).mul(0.26);

    const withScanEffect = mix(
      scenePassColor,
      add(scenePassColor, overlay),
      fullScreenEffect ? smoothstep(0.9, 1.0, oneMinus(scanLine)) : 1.0
    );

    postProcessing.outputNode = withScanEffect.add(bloomPass);

    return postProcessing;
  }, [camera, gl, scene, strength, threshold, fullScreenEffect]);

  useFrame(({ clock }) => {
    progressRef.current.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
    render.renderAsync();
  }, 1);

  return null;
};

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);

  const meshRef = useRef<Mesh>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (rawMap && depthMap) setVisible(true);
  }, [rawMap, depthMap]);

  const { material, uniforms } = useMemo(() => {
    const uPointer = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);

    const strength = 0.01;

    const tDepthMap = texture(depthMap);
    const tMap = texture(rawMap, uv().add(tDepthMap.r.mul(uPointer).mul(strength)));

    const aspect = float(WIDTH).div(HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(120.0);
    const tiledUv = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUv.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const flow = oneMinus(smoothstep(0, 0.02, abs(tDepthMap.sub(uProgress))));
    const mask = dot.mul(flow).mul(vec3(...BRAND_GLOW));

    const material = new THREE.MeshBasicNodeMaterial({
      colorNode: blendScreen(tMap, mask),
      transparent: true,
      opacity: 0,
    });

    return { material, uniforms: { uPointer, uProgress } };
  }, [rawMap, depthMap]);

  /* useAspect encaixa a imagem *dentro* do viewport (contain), o que deixa
     tarjas pretas nas sobras. O hero precisa preencher a tela inteira, então
     calculamos o "cover" na mão a partir do viewport. */
  const { viewport } = useThree();
  const scale = useMemo<[number, number, number]>(() => {
    const imgAspect = WIDTH / HEIGHT;
    const vpAspect = viewport.width / viewport.height;
    return vpAspect > imgAspect
      ? [viewport.width, viewport.width / imgAspect, 1]
      : [viewport.height * imgAspect, viewport.height, 1];
  }, [viewport.width, viewport.height]);

  useFrame(({ clock, pointer }) => {
    uniforms.uProgress.value = Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
    uniforms.uPointer.value = pointer;

    const mat = meshRef.current?.material as { opacity?: number } | undefined;
    if (mat && 'opacity' in mat) {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity ?? 0, visible ? 1 : 0, 0.07);
    }
  });

  return (
    <mesh ref={meshRef} scale={scale} material={material}>
      <planeGeometry />
    </mesh>
  );
};

/* Se WebGPU e WebGL2 falharem (navegador antigo, GPU bloqueada), o site
   não pode ficar em branco — cai para um plano de fundo estático. */
class CanvasBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const StaticBackdrop = () => (
  <div
    aria-hidden
    className="absolute inset-0 bg-[#100D0B]"
    style={{
      backgroundImage: `radial-gradient(80% 55% at 72% 30%, rgba(158,43,37,.28), transparent 70%), url(${TEXTUREMAP.src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center 70%',
    }}
  />
);

export type HeroFuturisticProps = {
  /** Cada palavra entra em sequência, com leve atraso aleatório. */
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  cta?: { label: string; href: string };
  scrollLabel?: string;
  onScrollClick?: () => void;
};

export const HeroFuturistic = ({
  title = 'Sua agenda no controle',
  subtitle = 'A agenda inteligente que lembra de cada cliente por você.',
  eyebrow,
  cta,
  scrollLabel = 'Role para explorar',
  onScrollClick,
}: HeroFuturisticProps) => {
  const titleWords = useMemo(() => title.split(' '), [title]);
  const [visibleWords, setVisibleWords] = useState(0);
  const [subtitleVisible, setSubtitleVisible] = useState(false);
  const [delays, setDelays] = useState<number[]>([]);
  const [subtitleDelay, setSubtitleDelay] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDelays(titleWords.map(() => Math.random() * 0.07));
    setSubtitleDelay(Math.random() * 0.1);
  }, [titleWords]);

  useEffect(() => {
    if (visibleWords < titleWords.length) {
      const t = setTimeout(() => setVisibleWords((n) => n + 1), 330);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSubtitleVisible(true), 500);
    return () => clearTimeout(t);
  }, [visibleWords, titleWords.length]);

  return (
    <div className="relative h-svh w-full overflow-hidden bg-[#100D0B]">
      <div className="absolute inset-0 z-0">
        <CanvasBoundary fallback={<StaticBackdrop />}>
          {mounted ? (
            <Canvas
              flat
              gl={async (props) => {
                // Os shaders são TSL, então o mesmo material roda nos dois
                // backends. WebGL2 é o escolhido de propósito: WebGPU ainda
                // perde o dispositivo em vários aparelhos e o hero é a
                // primeira coisa que o visitante vê — não pode piscar.
                const renderer = new THREE.WebGPURenderer({
                  ...(props as any),
                  forceWebGL: true,
                });
                await renderer.init();
                return renderer;
              }}
            >
              <PostProcessing fullScreenEffect />
              <Scene />
            </Canvas>
          ) : (
            <StaticBackdrop />
          )}
        </CanvasBoundary>
      </div>

      {/* Legibilidade: os pontos da varredura são brilhantes e passam por trás
          do texto, então escurecemos o miolo além das bordas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(72% 56% at 50% 45%, rgba(16,13,11,.84), rgba(16,13,11,.58) 38%, rgba(16,13,11,.24) 68%, transparent 92%), linear-gradient(to bottom, rgba(16,13,11,.7), transparent 30%, transparent 60%, rgba(16,13,11,.9))',
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        {eyebrow ? (
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.32em] text-[#E0857A] sm:text-xs">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="font-display text-4xl font-semibold uppercase leading-[1.05] text-[#FBF7EF] [text-shadow:0_2px_24px_rgba(16,13,11,.85)] sm:text-5xl xl:text-6xl 2xl:text-7xl">
          <span className="flex flex-wrap justify-center gap-x-3 gap-y-1 lg:gap-x-5">
            {titleWords.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className={index < visibleWords ? 'hero-word-in' : ''}
                style={{
                  animationDelay: `${index * 0.13 + (delays[index] || 0)}s`,
                  opacity: index < visibleWords ? undefined : 0,
                }}
              >
                {word}
              </span>
            ))}
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-sm text-[#DED5C8] [text-shadow:0_1px_16px_rgba(16,13,11,.95)] sm:text-base xl:text-lg">
          <span
            className={subtitleVisible ? 'hero-sub-in' : ''}
            style={{
              animationDelay: `${titleWords.length * 0.13 + 0.2 + subtitleDelay}s`,
              opacity: subtitleVisible ? undefined : 0,
            }}
          >
            {subtitle}
          </span>
        </p>

        {cta ? (
          <a
            href={cta.href}
            className="hero-cta pointer-events-auto mt-9 inline-flex items-center gap-2 rounded-full bg-[#9E2B25] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#7C201B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0857A] sm:text-base"
            style={{ animationDelay: '1.9s' }}
          >
            {cta.label}
          </a>
        ) : null}
      </div>

      {/* O contêiner centraliza; a animação fica no botão — assim o
          `transform` do keyframe não briga com o de centralização. */}
      <div className="absolute inset-x-0 bottom-7 z-30 flex justify-center">
        <button
          type="button"
          onClick={onScrollClick}
          className="hero-cta inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C9BFB2] transition-colors hover:text-white sm:text-xs"
          style={{ animationDelay: '2.2s' }}
        >
          {scrollLabel}
          <span className="hero-arrow">
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path d="M11 5V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 12L11 17L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default HeroFuturistic;
