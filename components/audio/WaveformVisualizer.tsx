"use client";

import { useEffect, useRef, useState } from "react";
import { Square } from "lucide-react";

interface WaveformVisualizerProps {
  stream: MediaStream;
  onStop: () => void;
  onAutoStop: () => void;
  maxSeconds?: number;
}

const DEFAULT_MAX_SECONDS = 30;
const BAR_COUNT = 28;

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Replaces the intake input bar while recording: renders a live Web Audio AnalyserNode
 * waveform canvas, an elapsed timer (`m:ss / 0:30`), auto-stops at `maxSeconds`, and
 * releases AudioContext + stream tracks on stop/unmount.
 */
export default function WaveformVisualizer({
  stream,
  onStop,
  onAutoStop,
  maxSeconds = DEFAULT_MAX_SECONDS,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onAutoStopRef = useRef(onAutoStop);
  onAutoStopRef.current = onAutoStop;

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let autoStopped = false;

    const startedAt = Date.now();
    setElapsed(0);

    const timerId = window.setInterval(() => {
      const secs = Math.min(maxSeconds, Math.floor((Date.now() - startedAt) / 1000));
      setElapsed(secs);
      if (secs >= maxSeconds && !autoStopped) {
        autoStopped = true;
        window.clearInterval(timerId);
        onAutoStopRef.current();
      }
    }, 250);

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    let timeData: Uint8Array<ArrayBuffer> | null = null;
    if (AudioCtx) {
      try {
        audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          void audioCtx.resume().catch(() => {});
        }
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        timeData = new Uint8Array(analyser.fftSize);
      } catch {
        // If Web Audio setup fails, keep the timer + fallback flat bars working cleanly.
        analyser = null;
      }
    }

    const draw = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const { width, height } = canvas;
          ctx.clearRect(0, 0, width, height);

          if (analyser && timeData) {
            analyser.getByteTimeDomainData(timeData);
          }

          const step = timeData ? Math.max(1, Math.floor(timeData.length / BAR_COUNT)) : 1;
          const slotWidth = width / BAR_COUNT;
          const barWidth = Math.max(2, slotWidth * 0.55);

          ctx.fillStyle = "#10b981";
          for (let i = 0; i < BAR_COUNT; i++) {
            let amplitude = 0.08;
            if (timeData) {
              const sample = timeData[i * step] ?? 128;
              amplitude = Math.max(0.08, Math.min(1, Math.abs(sample - 128) / 64));
            }
            const barHeight = Math.max(4, amplitude * (height - 4));
            const x = i * slotWidth + (slotWidth - barWidth) / 2;
            const y = (height - barHeight) / 2;
            ctx.beginPath();
            if (typeof ctx.roundRect === "function") {
              ctx.roundRect(x, y, barWidth, barHeight, 2);
            } else {
              ctx.rect(x, y, barWidth, barHeight);
            }
            ctx.fill();
          }
        }
      }
      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearInterval(timerId);
      try {
        source?.disconnect();
      } catch {
        // ignore
      }
      try {
        analyser?.disconnect();
      } catch {
        // ignore
      }
      if (audioCtx && audioCtx.state !== "closed") {
        void audioCtx.close().catch(() => {});
      }
      stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream, maxSeconds]);

  return (
    <div
      data-testid="waveform-bar"
      className="flex items-center gap-2.5 rounded-full border border-red-500/50 bg-civic-raised px-3 py-1.5"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>

      <canvas
        ref={canvasRef}
        width={220}
        height={32}
        data-testid="waveform-canvas"
        aria-label="Live audio waveform"
        className="h-8 min-w-0 flex-1"
      />

      <span
        data-testid="recording-timer"
        className="shrink-0 font-mono text-xs font-medium tabular-nums text-slate-200"
      >
        {formatTimer(elapsed)} / {formatTimer(maxSeconds)}
      </span>

      <button
        type="button"
        onClick={onStop}
        aria-label="Stop recording"
        aria-pressed={true}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-100"
      >
        <Square className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

