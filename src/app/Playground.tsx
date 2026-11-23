import { useMemo } from 'react';
import { getSimulationSnapshot, presets } from '../engine';
import type { PresetId } from '../engine';
import { useI18n } from '../i18n/context';
import { useSimulation } from './useSimulation';
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
    <button onClick={()=>dispatch({type:'toggle'})}>{t[status==='running'?'pause':status==='paused'?'resume':'play']}</button><button onClick={()=>dispatch({type:'reset'})}>{t.reset}</button>
    <span role="status">{t[preset]} · {t[status]}</span><span>{t.clock} · {seconds} s</span></div>
    <p>{t.restartHelp} {t.clockHelp}</p>
    <div className="lab-grid"><section className="settings"><h3>{t.configTitle}</h3><p>{t.editHelp}</p>
    {ranges.map(([key,min,max])=>{
      const cache = key==='configuredCacheHitRate', limit = key==='rateLimitRps';
      const toggle = cache?'cacheEnabled':limit?'rateLimitEnabled':null;
      const value = cache?Math.round(config[key]*100):config[key];
      return <div key={key}>{toggle && <label className="check"><input type="checkbox" checked={config[toggle]} onChange={e=>dispatch({type:'edit',patch:{[toggle]:e.target.checked}})}/>{t[toggle]}</label>}
        <label htmlFor={key}>{t[key]}</label><strong>{value}</strong>
        <input id={key} type="range" min={min} max={max} value={value} disabled={toggle!==null && !config[toggle]} onChange={e=>dispatch({type:'edit',patch:{[key]:e.target.valueAsNumber/(cache?100:1)}})}/>
      </div>;
    })}</section>
    <div className="observations"><p>{t.simulated} · {t.benchmark}</p>
    <Metrics title={w?t.window+' · '+w.startMs/1000+'–'+w.endMs/1000+' s':t.awaitWindow} rows={[[t.incomingRps,w?.incomingRps??t.noData],[t.throughput+' (RPS)',w?.throughputRps??t.noData],[t.latency,w?.p95Ms!=null?w.p95Ms.toLocaleString(locale)+' ms':t.noData]]}/>
    <Metrics title={t.cumulative} rows={[[t.completed200,c.completed200],[t.rejected429,c.rejected429],[t.rejected503,c.rejected503],[t.cacheHits,c.completedCacheHits]]}/>
    <Metrics title={t.current} rows={[[t.active,snap.processing],[t.waiting,snap.waiting],[t.effective,snap.effectiveInstanceCount+' / '+config.instanceCount]]}/>
    <Plots history={snap.history}/></div></div>
  </section>;
}
