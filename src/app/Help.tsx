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
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>?</button>
    {open && <span className="help-box" role="region" id={id} aria-label={t[field]}>
      <b>{t.meaning}</b><span>{meaning}</span>
      <b>{t.illustrated}</b><span>{t[`ex${topic}`]}</span>
      {adjustable && effect && <><b>{t.effect}</b><span>{effect}</span></>}
      {technical && <><b>{t.technical}</b><span>{topic === 'service' ? t.servicePolicy : t[`def${topic}Tech`]}</span></>}
      <button type="button" onClick={close}>{t.dismiss}</button>
    </span>}
  </span>;
}
