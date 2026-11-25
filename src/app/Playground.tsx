import { Help } from './Help';
import type { HelpKey } from './Help';
import { statusPath } from './navigation';
import { useMemo } from 'react';
import { getSimulationSnapshot, presets } from '../engine';
import type { PresetId } from '../engine';
import { useI18n } from '../i18n/context';
import { useSimulation } from './useSimulation';
import { Learning } from './Learning';
import { Plots } from './Plots';

const ranges = [
  ['incomingRps',10,500], ['instanceCount',1,8], ['concurrencyPerInstance',1,20],
  ['processingTimeMs',50,1000], ['maxQueueSize',0,1000], ['configuredCacheHitRate',0,80], ['rateLimitRps',10,500],
] as const;

function Metrics({ title, rows }: { title: string; rows: [HelpKey,string|number][] }) {
  const {t}=useI18n();
  const codes: Partial<Record<HelpKey, number>>={completed200:200,rejected429:429,rejected503:503};
  return <article><h3>{title}</h3><dl>{rows.map(([k,v])=><div key={k}><dt>{t[k]}{codes[k] && <a href={statusPath(codes[k])} aria-label={t[k]}><span aria-hidden="true"> ↗</span></a>}<Help field={k}/></dt><dd>{v}</dd></div>)}</dl></article>;
}
export function Playground({ standalone = false }: { standalone?: boolean }) {
  const {t,locale} = useI18n();
  const {model,status,preset,dispatch} = useSimulation();
  const snap = useMemo(()=>getSimulationSnapshot(model),[model]);
  const w = snap.window, c = snap.counters, config = model.config;
  const seconds = (snap.nowMs/1000).toLocaleString(locale);
  const Heading = standalone ? 'h1' : 'h2';
  return <section id="experiment" className="experiment lab" tabIndex={-1} aria-labelledby="experiment-title">
    <div className="section-heading"><Heading id="experiment-title" tabIndex={-1} data-route-heading={standalone || undefined}>{t.experiment}</Heading><span className="status-pill">{t.simulated}</span></div>
    <div className="toolbar"><label>{t.scenario} <select value={preset} onChange={e=>dispatch({type:'select',preset:e.target.value as PresetId})}>{(Object.keys(presets) as PresetId[]).map(k=><option key={k} value={k}>{t[k]}</option>)}</select></label>
    <button id="run-controls" onClick={()=>dispatch({type:'toggle'})}>{t[status==='running'?'pause':status==='paused'?'resume':'play']}</button><button onClick={()=>dispatch({type:'reset'})}>{t.reset}</button>
    <span role="status">{t[preset]} · {t[status]}</span><span>{t.clock} · {seconds} s</span></div>
    <p>{t.restartHelp} {t.clockHelp}</p>
    <Learning model={model} snapshot={snap} applySpike={()=>dispatch({type:'select',preset:'trafficSpike'})}/>
    <div className="lab-grid"><section className="settings" id="capacity-controls" tabIndex={-1}><h3>{t.configTitle}</h3><p>{t.editHelp}</p>
    <div className="toggle-line"><label className="check"><input type="checkbox" checked={config.autoScalingEnabled}
      onChange={e=>dispatch({type:'edit',patch:{autoScalingEnabled:e.target.checked}})}/>{t.autoScaling}</label><Help field="autoScaling" adjustable/></div>
    {config.autoScalingEnabled && <p>{t.scalePolicy} {t.idlePolicy}</p>}
    {ranges.map(([key,min,max])=>{
      const cache = key==='configuredCacheHitRate', limit = key==='rateLimitRps';
      const toggle = cache?'cacheEnabled':limit?'rateLimitEnabled':null;
      const value = cache?Math.round(config[key]*100):config[key];
      return <div key={key}>{toggle && <span className="toggle-line"><label className="check"><input type="checkbox" checked={config[toggle]} onChange={e=>dispatch({type:'edit',patch:{[toggle]:e.target.checked}})}/>{t[toggle]}</label><Help field={toggle} adjustable/></span>}
        <span><label htmlFor={key}>{t[key]}</label><Help field={key} adjustable/></span><strong>{value}</strong>
        <input id={key} type="range" min={min} max={max} value={value} disabled={(toggle!==null && !config[toggle]) || (key==="instanceCount" && config.autoScalingEnabled)} onChange={e=>dispatch({type:'edit',patch:{[key]:e.target.valueAsNumber/(cache?100:1)}})}/>
      </div>;
    })}</section>
    <div className="observations"><p>{t.simulated} · {t.benchmark}</p>
    <Metrics title={w?t.window+' · '+w.startMs/1000+'–'+w.endMs/1000+' s':t.awaitWindow} rows={[['incomingRps',w?.incomingRps??t.noData],['throughput',w?.throughputRps??t.noData],['latency',w?.p95Ms!=null?w.p95Ms.toLocaleString(locale)+' ms':t.noData]]}/>
    <Metrics title={t.cumulative} rows={[['completed200',c.completed200],['rejected429',c.rejected429],['rejected503',c.rejected503],['cacheHits',c.completedCacheHits]]}/>
    <Metrics title={t.current} rows={[['active',snap.processing],['waiting',snap.waiting],['effective',snap.effectiveInstanceCount+' / '+config.instanceCount]]}/>
    <article><h3>{t.autoScaling}</h3><dl>
      <div><dt>{t.activeInstances}<Help field="activeInstances"/></dt><dd>{snap.effectiveInstanceCount}</dd></div>
      <div><dt>{t.pending}<Help field="pending"/></dt><dd>{Number(model.scaling.readyAt !== null)}</dd></div>
      <div><dt>{t.bounds}<Help field="bounds"/></dt><dd>{config.instanceCount} / {config.maxInstances}</dd></div>
    </dl><details><summary>{t.scaleEvents} ({model.scaling.events.length})</summary>
      {model.scaling.events.length === 0 ? <p>{t.noScaleEvents}</p> :
        <ol>{model.scaling.events.map((event,index)=><li key={event.atMs+'-'+index}>
          {(event.atMs/1000).toLocaleString(locale)} s · {t[event.kind]} · {t.activeInstances} {event.active}
        </li>)}</ol>}
    </details></article>
    <Plots history={snap.history}/></div></div>
  </section>;
}
