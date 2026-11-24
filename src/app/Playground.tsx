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

function Metrics({ title, rows }: { title: string; rows: [string,string|number][] }) {
  return <article><h3>{title}</h3><dl>{rows.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></article>;
}
export function Playground() {
  const {t,locale} = useI18n();
  const {model,status,preset,dispatch} = useSimulation();
  const snap = useMemo(()=>getSimulationSnapshot(model),[model]);
  const w = snap.window, c = snap.counters, config = model.config;
  const seconds = (snap.nowMs/1000).toLocaleString(locale);
  return <section id="experiment" className="experiment lab" tabIndex={-1} aria-labelledby="experiment-title">
    <div className="section-heading"><h2 id="experiment-title">{t.experiment}</h2><span className="status-pill">{t.simulated}</span></div>
    <div className="toolbar"><label>{t.scenario} <select value={preset} onChange={e=>dispatch({type:'select',preset:e.target.value as PresetId})}>{(Object.keys(presets) as PresetId[]).map(k=><option key={k} value={k}>{t[k]}</option>)}</select></label>
    <button id="run-controls" onClick={()=>dispatch({type:'toggle'})}>{t[status==='running'?'pause':status==='paused'?'resume':'play']}</button><button onClick={()=>dispatch({type:'reset'})}>{t.reset}</button>
    <span role="status">{t[preset]} · {t[status]}</span><span>{t.clock} · {seconds} s</span></div>
    <p>{t.restartHelp} {t.clockHelp}</p>
    <Learning model={model} snapshot={snap} applySpike={()=>dispatch({type:'select',preset:'trafficSpike'})}/>
    <div className="lab-grid"><section className="settings" id="capacity-controls" tabIndex={-1}><h3>{t.configTitle}</h3><p>{t.editHelp}</p>
    <label className="check"><input type="checkbox" checked={config.autoScalingEnabled}
      onChange={e=>dispatch({type:'edit',patch:{autoScalingEnabled:e.target.checked}})}/>{t.autoScaling}</label>
    {config.autoScalingEnabled && <p>{t.scalePolicy} {t.idlePolicy}</p>}
    {ranges.map(([key,min,max])=>{
      const cache = key==='configuredCacheHitRate', limit = key==='rateLimitRps';
      const toggle = cache?'cacheEnabled':limit?'rateLimitEnabled':null;
      const value = cache?Math.round(config[key]*100):config[key];
      return <div key={key}>{toggle && <label className="check"><input type="checkbox" checked={config[toggle]} onChange={e=>dispatch({type:'edit',patch:{[toggle]:e.target.checked}})}/>{t[toggle]}</label>}
        <label htmlFor={key}>{t[key]}</label><strong>{value}</strong>
        <input id={key} type="range" min={min} max={max} value={value} disabled={(toggle!==null && !config[toggle]) || (key==="instanceCount" && config.autoScalingEnabled)} onChange={e=>dispatch({type:'edit',patch:{[key]:e.target.valueAsNumber/(cache?100:1)}})}/>
      </div>;
    })}</section>
    <div className="observations"><p>{t.simulated} · {t.benchmark}</p>
    <Metrics title={w?t.window+' · '+w.startMs/1000+'–'+w.endMs/1000+' s':t.awaitWindow} rows={[[t.incomingRps,w?.incomingRps??t.noData],[t.throughput+' (RPS)',w?.throughputRps??t.noData],[t.latency,w?.p95Ms!=null?w.p95Ms.toLocaleString(locale)+' ms':t.noData]]}/>
    <Metrics title={t.cumulative} rows={[[t.completed200,c.completed200],[t.rejected429,c.rejected429],[t.rejected503,c.rejected503],[t.cacheHits,c.completedCacheHits]]}/>
    <Metrics title={t.current} rows={[[t.active,snap.processing],[t.waiting,snap.waiting],[t.effective,snap.effectiveInstanceCount+' / '+config.instanceCount]]}/>
    <article><h3>{t.autoScaling}</h3><dl>
      <div><dt>{t.activeInstances}</dt><dd>{snap.effectiveInstanceCount}</dd></div>
      <div><dt>{t.pending}</dt><dd>{Number(model.scaling.readyAt !== null)}</dd></div>
      <div><dt>{t.bounds}</dt><dd>{config.instanceCount} / {config.maxInstances}</dd></div>
    </dl><details><summary>{t.scaleEvents} ({model.scaling.events.length})</summary>
      {model.scaling.events.length === 0 ? <p>{t.noScaleEvents}</p> :
        <ol>{model.scaling.events.map((event,index)=><li key={event.atMs+'-'+index}>
          {(event.atMs/1000).toLocaleString(locale)} s · {t[event.kind]} · {t.activeInstances} {event.active}
        </li>)}</ol>}
    </details></article>
    <Plots history={snap.history}/></div></div>
  </section>;
}
