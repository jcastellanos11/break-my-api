import type { RefObject } from 'react';
import type { PresetId, SimulationConfig } from '../engine';
import { useI18n } from '../i18n/context';
import { Help } from './Help';

const ranges = {
  incomingRps: [10, 500], instanceCount: [1, 8], concurrencyPerInstance: [1, 20],
  processingTimeMs: [50, 1000], maxQueueSize: [0, 1000],
  configuredCacheHitRate: [0, 80], rateLimitRps: [10, 500],
} as const;

interface Props {
  config: SimulationConfig;
  preset: PresetId;
  edit: (patch: Partial<SimulationConfig>) => void;
  expanded: boolean;
  toggleExpanded: () => void;
  protection: RefObject<HTMLInputElement | null>;
}

export function Configuration({config, preset, edit, expanded, toggleExpanded, protection}: Props) {
  const {t} = useI18n();
  function range(key: keyof typeof ranges, unit: string, disabled = false) {
    const percent = key === 'configuredCacheHitRate';
    const value = percent ? Math.round(config[key] * 100) : config[key];
    const [min, max] = ranges[key];
    return <div className="range-field">
      <div><label htmlFor={key}>{t[key]}</label><Help field={key} adjustable/></div>
      <strong>{value} {unit}</strong>
      <input id={key} type="range" min={min} max={max} value={value} disabled={disabled}
        aria-valuetext={value+' '+unit}
        onChange={event => edit({[key]: event.target.valueAsNumber / (percent ? 100 : 1)})}/>
    </div>;
  }

  function toggle(key: 'cacheEnabled' | 'rateLimitEnabled' | 'autoScalingEnabled') {
    const name = key === 'autoScalingEnabled' ? 'autoScaling' : key;
    return <div className="toggle-line"><label className="check"><input type="checkbox"
      ref={key === 'cacheEnabled' ? protection : undefined}
      checked={config[key]} onChange={event => edit({[key]: event.target.checked})}/>{t[name]}</label>
      <Help field={name} adjustable/></div>;
  }

  return <section className="settings" id="capacity-controls">
    <button type="button" className="settings-trigger" aria-expanded={expanded}
      aria-controls="lab-settings" onClick={toggleExpanded}>
      <strong>{t.configureLab}</strong><span aria-hidden="true">{expanded ? '−' : '+'}</span>
      <small>{t[preset]} · {config.incomingRps} {t.rateUnit} · {config.processingTimeMs} ms</small>
    </button>
    <div id="lab-settings" hidden={!expanded}>
    <p>{t.editHelp}</p>
    <fieldset><legend>{t.trafficGroup}</legend>{range('incomingRps', t.rateUnit)}</fieldset>
    <fieldset><legend>{t.computeGroup}</legend>
      {range('instanceCount', t.instanceCount, config.autoScalingEnabled)}
      {config.autoScalingEnabled && <p>{t.manualDisabled}</p>}
      {range('concurrencyPerInstance', t.slotsUnit)}
      {range('processingTimeMs', 'ms')}
      {range('maxQueueSize', t.requestsUnit)}
    </fieldset>
    <fieldset><legend>{t.protectionGroup}</legend>
      {toggle('cacheEnabled')}
      {range('configuredCacheHitRate', '%', !config.cacheEnabled)}
      {toggle('rateLimitEnabled')}
      {range('rateLimitRps', t.rateUnit, !config.rateLimitEnabled)}
      {toggle('autoScalingEnabled')}
      <p>{t.bounds}<Help field="bounds"/> · {config.instanceCount} / {config.maxInstances}</p>
      {config.autoScalingEnabled && <p>{t.scalePolicy} {t.idlePolicy}</p>}
    </fieldset>
    </div>
  </section>;
}
