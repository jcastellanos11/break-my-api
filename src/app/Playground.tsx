import { flushSync } from 'react-dom';
import { Help } from './Help';
import type { HelpKey } from './Help';
import { statusPath } from './navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSimulationSnapshot, presets } from '../engine';
import type { PresetId } from '../engine';
import { useI18n } from '../i18n/context';
import { useSimulation } from './useSimulation';
import { Learning } from './Learning';
import { TrafficPlot, PlotHistory } from './Plots';
import { Configuration } from './Configuration';

function Metrics({ title, rows, className = '' }: { className?: string; title: string; rows: [HelpKey,string|number][] }) {
  const {t}=useI18n();
  const codes: Partial<Record<HelpKey, number>>={completed200:200,rejected429:429,rejected503:503};
  return <article className={'metric-panel '+className} aria-label={title}><h3>{title}</h3><dl>{rows.map(([k,v])=><div className={k} key={k}><dt>{t[k]}{codes[k] && <a href={statusPath(codes[k])} aria-label={t[k]}><span aria-hidden="true"> ↗</span></a>}<Help field={k} context={title}/></dt><dd>{v}</dd></div>)}</dl></article>;
}
export function Playground({ standalone = false }: { standalone?: boolean }) {
  const {t,locale} = useI18n();
  const {model,status,preset,dispatch} = useSimulation();
  const snap = useMemo(()=>getSimulationSnapshot(model),[model]);
  const w = snap.window, c = snap.counters, config = model.config;
  const seconds = (snap.nowMs/1000).toLocaleString(locale);
  const Heading = standalone ? 'h1' : 'h2';
  const [expanded, setExpanded] = useState(() => window.matchMedia?.('(min-width: 64rem)').matches ?? window.innerWidth >= 1024);
  useEffect(() => {
    const viewport = window.matchMedia?.('(min-width: 64rem)');
    const resize = (event: MediaQueryListEvent) => setExpanded(event.matches);
    viewport?.addEventListener('change', resize);
    return () => viewport?.removeEventListener('change', resize);
  }, []);
  const protection = useRef<HTMLInputElement>(null);
  const admissionSlots = model.scaling.returning
    ? config.instanceCount * config.concurrencyPerInstance : snap.slots;
  function revealProtection() {
    flushSync(() => setExpanded(true));
    protection.current?.focus();
  }
  const interval = w ? t.window+' · '+w.startMs/1000+'–'+w.endMs/1000+' s' : t.awaitWindow;
  return <section id="experiment" className="experiment lab" tabIndex={-1} aria-labelledby="experiment-title">
    <header className="lab-intro">
      <Heading id="experiment-title" tabIndex={-1} data-route-heading={standalone || undefined}>{t.experiment}</Heading>
      <p className="lab-notice">{t.localNotice}</p>
    </header>
    <div className="run-panel">
      <div className="toolbar">
        <label>{t.scenario} <select value={preset} aria-describedby="preset-note"
          onChange={e=>dispatch({type:'select',preset:e.target.value as PresetId})}>
          {(Object.keys(presets) as PresetId[]).map(k=><option key={k} value={k}>{t[k]}</option>)}
        </select></label>
        <div className="run-buttons">
          <button id="run-controls" onClick={()=>dispatch({type:'toggle'})}>{t[status==='running'?'pause':status==='paused'?'resume':'play']}</button>
          <button onClick={()=>dispatch({type:'reset'})}>{t.reset}</button>
        </div>
        <div className="run-state"><span role="status">{t[preset]} · {t[status]}</span><span>{t.clock} · {seconds} s</span></div>
      </div>
      <p id="preset-note">{t.restartHelp}</p>
    </div>
    <div className="lab-layout">
      <Metrics className="primary-readings" title={interval} rows={[
        ['incomingRps',w ? w.incomingRps+' '+t.rateUnit : t.noData],
        ['throughput',w ? w.throughputRps+' '+t.rateUnit : t.noData],
        ['latency',w?.p95Ms!=null ? w.p95Ms.toLocaleString(locale)+' ms' : t.noData],
      ]}/>
      <Configuration config={config} preset={preset} edit={patch=>dispatch({type:'edit',patch})}
        expanded={expanded} toggleExpanded={()=>setExpanded(!expanded)} protection={protection}/>
      <div className="lab-results">
        <Metrics title={t.current} rows={[
          ['active',snap.processing], ['admissionSlots',admissionSlots], ['waiting',snap.waiting],
          ['activeInstances',snap.effectiveInstanceCount], ['pending',Number(model.scaling.readyAt !== null)],
        ]}/>
        <TrafficPlot history={snap.history}/>
        <Learning model={model} snapshot={snap} applySpike={()=>dispatch({type:'select',preset:'trafficSpike'})}
          revealProtection={revealProtection}/>
        <Metrics title={t.cumulative} rows={[
          ['completed200',c.completed200], ['rejected429',c.rejected429], ['rejected503',c.rejected503], ['cacheHits',c.completedCacheHits],
        ]}/>
        <PlotHistory history={snap.history}/>
        <details className="scale-log"><summary>{t.scaleEvents} ({model.scaling.events.length})</summary>
          <p>{t.effective}<Help field="effective"/> · {snap.effectiveInstanceCount} / {config.instanceCount}</p>
          {model.scaling.events.length === 0 ? <p>{t.noScaleEvents}</p> :
            <ol>{model.scaling.events.map((event,index)=><li key={event.atMs+'-'+index}>
              {(event.atMs/1000).toLocaleString(locale)} s · {t[event.kind]} · {t.activeInstances} {event.active}
            </li>)}</ol>}
          <p>{t.clockHelp}</p>
        </details>
      </div>
    </div>
  </section>;
}
