import React from "react";

interface BrightnessChartProps {
  current?: number | null;
  previous?: number | null;
  width?: number;
  height?: number;
}

export default function BrightnessChart({ current, previous, width = 240, height = 72 }: BrightnessChartProps) {
  const cur = current ?? 0;
  const prev = previous ?? 0;
  const hasPrev = previous !== null && previous !== undefined;

  const maxVal = Math.max(cur, prev, 1);

  const pad = 12;
  const barWidth = 36;
  const gap = 16;

  const curH = Math.round((cur / maxVal) * (height - pad * 2));
  const prevH = Math.round((prev / maxVal) * (height - pad * 2));

  const baseY = height - pad;

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} className="block">
        {/* background grid line */}
        <line x1={0} y1={pad} x2={width} y2={pad} stroke="#eee" strokeWidth={1} />
        <line x1={0} y1={baseY} x2={width} y2={baseY} stroke="#f5f5f5" strokeWidth={1} />

        {/* previous bar */}
        <rect
          x={pad}
          y={baseY - prevH}
          width={barWidth}
          height={hasPrev ? prevH : 4}
          rx={6}
          fill={hasPrev ? "#94a3b8" : "#e6e6e6"}
          opacity={hasPrev ? 1 : 0.6}
        />

        {/* current bar */}
        <rect
          x={pad + barWidth + gap}
          y={baseY - curH}
          width={barWidth}
          height={curH}
          rx={6}
          fill={cur >= prev ? "#16a34a" : "#f59e0b"}
        />

        {/* values */}
        {hasPrev && (
          <text x={pad + barWidth / 2} y={baseY - prevH - 6} fontSize={10} textAnchor="middle" fill="#475569">
            {prev.toFixed(1)}
          </text>
        )}
        <text x={pad + barWidth + gap + barWidth / 2} y={baseY - curH - 6} fontSize={10} textAnchor="middle" fill="#063a12">
          {cur.toFixed(1)}
        </text>

        {/* labels */}
        <text x={pad + barWidth / 2} y={height - 2} fontSize={10} textAnchor="middle" fill="#64748b">
          7일 전
        </text>
        <text x={pad + barWidth + gap + barWidth / 2} y={height - 2} fontSize={10} textAnchor="middle" fill="#0f172a">
          현재
        </text>
      </svg>

      {!hasPrev && (
        <div className="text-xs text-muted-foreground">(7일 전 데이터 없음)</div>
      )}
    </div>
  );
}
