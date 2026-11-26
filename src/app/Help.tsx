import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n/context';

const topics = {
  incomingRps: 'rps', instanceCount: 'instance', concurrencyPerInstance: 'slots',
  processingTimeMs: 'service', maxQueueSize: 'queue', cacheEnabled: 'cache',
  configuredCacheHitRate: 'hit', rateLimitEnabled: 'limit', rateLimitRps: 'limit',
  autoScaling: 'auto', effective: 'instance', activeInstances: 'instance', bounds: 'auto',
  admissionSlots: 'slots', pending: 'delay', throughput: 'throughput', waiting: 'queue', latency: 'p95',
  completed200: 'status', rejected429: 'reject', rejected503: 'overflow', active: 'slots', cacheHits: 'hit',
} as const;
export type HelpKey = keyof typeof topics;

export function Help({field, adjustable = false, context}: {field: HelpKey; adjustable?: boolean; context?: string}) {
  const {t, technical} = useI18n();
  const topic = topics[field];
  const id = useId();
  const container = useRef<HTMLSpanElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', dismissOutside);
    return () => document.removeEventListener('pointerdown', dismissOutside);
  }, [open]);

  function close() {
    setOpen(false);
    opener.current?.focus();
  }

  const meaning = field === 'bounds' ? t.boundsMeaning :
    topic === 'service' ? t.serviceMeaning : t[`def${topic}Simple`];
  const effect = field === 'rateLimitRps' ? t.effectcap :
    `effect${topic}` in t ? t[`effect${topic}` as keyof typeof t] : undefined;
  return <span className="help-wrap" ref={container}
    onKeyDown={event => { if (open && event.key === 'Escape') { event.preventDefault(); close(); } }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button className="help-icon" ref={opener} type="button"
      aria-label={[t.help,t[field],context ?? (adjustable ? t.configTitle : t.current)].join(' · ')}
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
      <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" className="help-disc"/>
        <path d="M9.25 9a2.8 2.8 0 0 1 5.5.5c0 2.2-2.75 2.3-2.75 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="17" r="1" fill="currentColor"/>
      </svg>
    </button>
    {open && <span className="help-box" role="region" id={id} aria-labelledby={id+'-title'}>
      <strong className="help-title" id={id+'-title'}>{t[field]}</strong>
      <b>{t.meaning}</b><span>{meaning}</span>
      <span className="help-example"><b>{t.illustrated}</b>{t[`ex${topic}`]}</span>
      {adjustable && effect && <><b>{t.effect}</b><span>{effect}</span></>}
      {technical && <><b>{t.technical}</b><span>{topic === 'service' ? t.servicePolicy : t[`def${topic}Tech`]}</span></>}
      <button className="help-close" type="button" onClick={close}>{t.dismiss}</button>
    </span>}
  </span>;
}
