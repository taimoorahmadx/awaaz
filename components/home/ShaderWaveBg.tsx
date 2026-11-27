"use client";

import { useEffect, useRef } from "react";

interface ShaderWaveBgProps {
  /** Boosts wave speed and emerald glow when recording or AI is thinking. */
  active?: boolean;
  /** Softens the background once the conversation thread starts so text stays crisp. */
  dim?: boolean;
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Sculpted 3D noise-fold surface with directional + Fresnel lighting and film grain,
// inspired by ShaderGradient's dark grainy mesh waves, tuned to Awaaz's civic-bg & emerald palette.
const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2 uResolution;
uniform float uEnergy;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Domain-warped height field for silky cloth/dune folds
float waveHeight(vec2 p, float t) {
  vec2 q = vec2(
    snoise(vec3(p * 0.95, t * 0.16)),
    snoise(vec3(p * 0.95 + vec2(5.2, 1.3), t * 0.16))
  );
  float h1 = snoise(vec3(p * 1.15 + q * 0.65, t * 0.22));
  float h2 = snoise(vec3(p * 2.1 - q * 0.35 + vec2(1.7, 9.2), t * 0.28));
  return h1 * 0.72 + h2 * 0.28;
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 1.65;

  float t = uTime;
  float eps = 0.015;
  float h  = waveHeight(p, t);
  float hx = waveHeight(p + vec2(eps, 0.0), t);
  float hy = waveHeight(p + vec2(0.0, eps), t);

  vec3 normal = normalize(vec3((h - hx) / eps, (h - hy) / eps, 1.35));

  vec3 lightDir1 = normalize(vec3(-0.45, 0.55, 0.70));
  vec3 lightDir2 = normalize(vec3(0.65, -0.35, 0.55));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  float diff1 = max(dot(normal, lightDir1), 0.0);
  float diff2 = max(dot(normal, lightDir2), 0.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);

  vec3 baseBg      = vec3(0.027, 0.043, 0.071); // #070b12
  vec3 deepIndigo  = vec3(0.045, 0.095, 0.200);
  vec3 emerald     = vec3(0.063, 0.725, 0.506); // #10b981
  vec3 cyan        = vec3(0.080, 0.780, 0.860);

  float ridge = smoothstep(-0.35, 0.75, h);
  vec3 col = baseBg;
  col = mix(col, deepIndigo, pow(diff2, 1.35) * 0.75);
  col = mix(col, emerald * 0.78, pow(diff1, 2.0) * ridge * (0.72 + 0.28 * uEnergy));
  col += cyan * fresnel * ridge * (0.34 + 0.22 * uEnergy);

  float dist = length(vUv - 0.5);
  float vignette = 1.0 - smoothstep(0.28, 0.78, dist);
  col = mix(baseBg, col, vignette);

  float grain = (hash12(gl_FragCoord.xy + fract(t * 17.0) * 100.0) - 0.5) * 0.065;
  col = clamp(col + grain * (0.45 + 0.55 * vignette), 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function ShaderWaveBg({ active = false, dim = false }: ShaderWaveBgProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uEnergy = gl.getUniformLocation(program, "uEnergy");

    const resize = () => {
      // Cap at 1x DPR for smooth mobile/laptop GPU performance without losing wave quality
      const dpr = Math.min(window.devicePixelRatio || 1, 1.0);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let rafId = 0;
    let lastTs = performance.now();
    let simTime = 12.0;
    let smoothEnergy = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;

      const targetEnergy = activeRef.current ? 1.0 : 0.0;
      smoothEnergy += (targetEnergy - smoothEnergy) * 0.08;
      simTime += dt * (1.0 + smoothEnergy * 1.15);

      gl.uniform1f(uTime, simTime);
      gl.uniform1f(uEnergy, smoothEnergy);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-500 ${
        dim ? "opacity-35" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.16)_0%,rgba(7,11,18,0)_70%)]" />
      <canvas ref={canvasRef} className="relative block h-full w-full" />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-civic-bg to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-civic-bg to-transparent" />
    </div>
  );
}
