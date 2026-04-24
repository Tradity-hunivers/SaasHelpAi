/* Reusable chart primitives — pure SVG */

const CHART_COLORS = {
  primary: "var(--accent)",
  secondary: "var(--accent-2)",
  success: "var(--success)",
  info: "var(--info)",
  muted: "var(--text-3)",
};

/* ---------- LineChart ---------- */
function LineChart({ data, series, height = 300, yFormat = (v) => v, xLabels, dualAxis = false }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(800);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const padL = dualAxis ? 56 : 48, padR = dualAxis ? 56 : 16, padT = 16, padB = 30;
  const iw = Math.max(100, w - padL - padR);
  const ih = height - padT - padB;
  const n = data.length;

  // compute series ranges
  const vals1 = series.filter(s => !s.rightAxis).flatMap(s => data.map(d => d[s.key]));
  const vals2 = series.filter(s => s.rightAxis).flatMap(s => data.map(d => d[s.key]));
  const [min1, max1] = niceRange(vals1);
  const [min2, max2] = vals2.length ? niceRange(vals2) : [0, 1];

  const x = (i) => padL + (i / Math.max(1, n - 1)) * iw;
  const y1 = (v) => padT + ih - ((v - min1) / Math.max(1e-9, max1 - min1)) * ih;
  const y2 = (v) => padT + ih - ((v - min2) / Math.max(1e-9, max2 - min2)) * ih;

  const ticks = 5;
  const yTicks1 = Array.from({ length: ticks + 1 }, (_, i) => min1 + (i / ticks) * (max1 - min1));

  const [hover, setHover] = React.useState(null);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg width={w} height={height} style={{ display: "block" }}
           onMouseLeave={() => setHover(null)}
           onMouseMove={(e) => {
             const r = e.currentTarget.getBoundingClientRect();
             const px = e.clientX - r.left;
             const idx = Math.round(((px - padL) / iw) * (n - 1));
             if (idx >= 0 && idx < n) setHover(idx);
           }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`lg-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {/* grid */}
        {yTicks1.map((t, i) => (
          <g key={i}>
            <line className="grid-line" x1={padL} x2={padL + iw} y1={y1(t)} y2={y1(t)} />
            <text x={padL - 8} y={y1(t) + 3} textAnchor="end"
                  style={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
              {yFormat(t)}
            </text>
          </g>
        ))}
        {dualAxis && Array.from({ length: ticks + 1 }, (_, i) => {
          const t = min2 + (i / ticks) * (max2 - min2);
          return (
            <text key={i} x={padL + iw + 8} y={y2(t) + 3} textAnchor="start"
                  style={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
              {(series.find(s => s.rightAxis)?.rightFormat || ((v) => Math.round(v)))(t)}
            </text>
          );
        })}
        {/* x labels */}
        {xLabels && xLabels.map((lbl, i) => (
          <text key={i} x={x(i)} y={height - 10} textAnchor="middle"
                style={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
            {lbl}
          </text>
        ))}
        {/* areas + lines */}
        {series.map((s, si) => {
          const ys = s.rightAxis ? y2 : y1;
          const pts = data.map((d, i) => [x(i), ys(d[s.key])]);
          const path = smoothPath(pts);
          const area = `${path} L ${x(n - 1)} ${padT + ih} L ${padL} ${padT + ih} Z`;
          return (
            <g key={si}>
              {!s.dashed && (
                <path d={area} fill={`url(#lg-${s.key})`} />
              )}
              <path d={path} fill="none" stroke={s.color} strokeWidth="2"
                    strokeDasharray={s.dashed ? "4 4" : "none"}
                    strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
        {/* hover line + dots */}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih}
                  stroke="var(--text-3)" strokeDasharray="2 3" strokeWidth="1" opacity="0.6" />
            {series.map((s, i) => {
              const ys = s.rightAxis ? y2 : y1;
              return (
                <circle key={i} cx={x(hover)} cy={ys(data[hover][s.key])} r="4"
                        fill="var(--bg)" stroke={s.color} strokeWidth="2" />
              );
            })}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div style={{
          position: "absolute",
          left: Math.min(Math.max(x(hover) - 90, 8), w - 188),
          top: 8,
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 11.5,
          boxShadow: "var(--shadow-2)",
          pointerEvents: "none",
          minWidth: 180,
        }}>
          <div style={{ color: "var(--text-3)", marginBottom: 6, fontFamily: "var(--font-mono)", fontSize: 10.5 }}>
            {xLabels ? xLabels[hover] : ""}
          </div>
          {series.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
              <span style={{ color: "var(--text-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }}></span>
                {s.label}
              </span>
              <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>
                {(s.fmt || yFormat)(data[hover][s.key])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function niceRange(vals) {
  if (!vals.length) return [0, 1];
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { max = min + 1; }
  const span = max - min;
  const pad = span * 0.12;
  min = Math.max(0, min - pad);
  max = max + pad;
  return [min, max];
}

/* ---------- BarChart (stacked or grouped) ---------- */
function BarChart({ data, series, height = 260, xLabels, yFormat = (v) => v, stacked = true }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(600);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const padL = 42, padR = 12, padT = 12, padB = 28;
  const iw = Math.max(80, w - padL - padR);
  const ih = height - padT - padB;
  const n = data.length;

  const totals = data.map(d => series.reduce((s, k) => s + (d[k.key] || 0), stacked ? 0 : 0));
  const max = stacked
    ? Math.max(...totals) * 1.1
    : Math.max(...data.flatMap(d => series.map(s => d[s.key]))) * 1.1;

  const bw = (iw / n) * 0.62;
  const gap = (iw / n) - bw;

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg width={w} height={height} style={{ display: "block" }}>
        {Array.from({ length: 5 }, (_, i) => {
          const t = (i / 4) * max;
          const y = padT + ih - (t / max) * ih;
          return (
            <g key={i}>
              <line className="grid-line" x1={padL} x2={padL + iw} y1={y} y2={y} />
              <text x={padL - 8} y={y + 3} textAnchor="end"
                    style={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
                {yFormat(t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = padL + gap / 2 + i * (iw / n);
          if (stacked) {
            let acc = 0;
            return (
              <g key={i}>
                {series.map((s, si) => {
                  const v = d[s.key] || 0;
                  const h = (v / max) * ih;
                  const y = padT + ih - acc - h;
                  acc += h;
                  return (
                    <rect key={si} x={cx} y={y} width={bw} height={h}
                          fill={s.color} rx={si === series.length - 1 ? 3 : 0}
                          style={{ opacity: 0.92 }} />
                  );
                })}
                {xLabels && (
                  <text x={cx + bw / 2} y={height - 10} textAnchor="middle"
                        style={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
                    {xLabels[i]}
                  </text>
                )}
              </g>
            );
          } else {
            const sw = bw / series.length;
            return (
              <g key={i}>
                {series.map((s, si) => {
                  const v = d[s.key] || 0;
                  const h = (v / max) * ih;
                  return (
                    <rect key={si} x={cx + si * sw} y={padT + ih - h} width={sw - 2} height={h}
                          fill={s.color} rx={2} />
                  );
                })}
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
}

/* ---------- Sparkline ---------- */
function Sparkline({ data, color = "var(--accent)", height = 36, stroke = 1.5, fill = true }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(100);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    height - 2 - ((v - min) / span) * (height - 4)
  ]);
  const path = smoothPath(pts);
  const id = React.useId();
  return (
    <div ref={ref} style={{ width: "100%", height }}>
      <svg width={w} height={height} style={{ display: "block" }}>
        {fill && (
          <>
            <defs>
              <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} L ${w} ${height} L 0 ${height} Z`} fill={`url(#${id})`} />
          </>
        )}
        <path d={path} fill="none" stroke={color} strokeWidth={stroke}
              strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ---------- DonutChart ---------- */
function DonutChart({ data, size = 180, thickness = 18 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={d.color} strokeWidth={thickness}
                    strokeDasharray={`${dash} ${c}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt" />
          );
          offset += dash;
          return el;
        })}
      </svg>
    </div>
  );
}

Object.assign(window, { LineChart, BarChart, Sparkline, DonutChart, CHART_COLORS });
