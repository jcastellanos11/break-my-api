import type { MetricBucket } from '../engine';
import { useI18n } from '../i18n/context';

const traffic = ['arrivals', 'completed200', 'rejected429', 'rejected503'] as const;
const queue = ['queueDepth'] as const;
const colors = ['var(--ink)', 'var(--success)', 'var(--limited)', 'var(--unavailable)'];
const strokes = ['', '8 4', '2 3', '9 3 2 3'];
type PlotProps = { history: readonly MetricBucket[] };
function Plot({ history, series }: PlotProps & { series: typeof traffic | typeof queue }) {
  const { t } = useI18n();
  const first = history[0], last = history.at(-1);
  const labels = { ...t, queueDepth: t.waiting };
  const title = series === traffic ? t.trafficChart : t.queueChart;
  const peak = Math.max(1, ...history.flatMap(b => series.map(k => b[k])));
  const x = (i: number) => 12 + (i + 1) * 336 / history.length;
  const y = (v: number) => 85 - 75 * v / peak;
  return <figure><h3>{title}</h3>
    {first && last ? <>
      <p>{t.count} · 0–{peak}</p>
      <svg viewBox="0 0 360 94" role="img" aria-label={title}>
        <path d="M12 10 V85 H348" stroke="#a3aea0" fill="none"/>
        {series.map((k,j) => <g key={k} stroke={colors[j]}>
          <polyline points={history.map((b,i) => x(i)+','+y(b[k])).join(' ')} fill="none" strokeWidth="2" strokeDasharray={strokes[j]}/>
          <circle cx={x(history.length-1)} cy={y(last[k])} r="2.5" fill={colors[j]}/>
        </g>)}
      </svg>
      <figcaption>{t.seconds} · {first.startMs/1000}–{last.endMs/1000}<br/>{t.window} · {series.map(k=>labels[k]+' '+last[k]).join(' · ')}</figcaption>
    </> : <p>{t.empty}</p>}
    <ul>{series.map((k,j)=><li key={k}><svg aria-hidden="true" width="22" height="8"><path d="M0 4H22" stroke={colors[j]} strokeWidth="3" strokeDasharray={strokes[j]}/></svg>{labels[k]}</li>)}</ul>
  </figure>;
}

export function TrafficPlot({ history }: PlotProps) {
  return <section className="plots primary-plot"><Plot history={history} series={traffic}/></section>;
}

export function PlotHistory({ history }: PlotProps) {
  const { t } = useI18n();
  return <section className="plots plot-history"><h3>{t.historyTitle}</h3>
    <Plot history={history} series={queue}/>
    {history.length > 0 && <details><summary>{t.table}</summary><div className="table-scroll" tabIndex={0} role="region" aria-label={t.table}><table><caption>{t.table}</caption><thead><tr>{[t.seconds,...traffic.map(k=>t[k]),t.waiting].map(s=><th key={s}>{s}</th>)}</tr></thead><tbody>{history.map(b=><tr key={b.startMs}><th>{b.startMs/1000}–{b.endMs/1000}</th>{[...traffic,...queue].map(k=><td key={k}>{b[k]}</td>)}</tr>)}</tbody></table></div></details>}
  </section>;
}
