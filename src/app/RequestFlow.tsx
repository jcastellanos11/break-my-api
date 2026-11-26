import type { ReactNode } from 'react';
import type { SimulationSnapshot, SimulationState } from '../engine';
import { useI18n } from '../i18n/context';
import { Help, type HelpKey } from './Help';
import { statusPath } from './navigation';

interface Props {
  model: SimulationState;
  snapshot: SimulationSnapshot;
  admissionSlots: number;
  interval: string;
  running: boolean;
}

function Stage({ title, help, children, branch }: {
  title: string; help: HelpKey; children: ReactNode; branch?: ReactNode;
}) {
  const { t } = useI18n();
  return <li className="flow-step">
    <div className="flow-node">
      <div className="flow-node-title"><h4>{title}</h4><Help field={help} context={t.flowTitle}/></div>
      {children}
    </div>
    {branch}
  </li>;
}

function ResponseBranch({ label, code, count, total }: {
  label: string; code: 200 | 429 | 503; count: number | undefined; total: number;
}) {
  const { t } = useI18n();
  const share = total ? (count ?? 0) / total : 0;
  return <div className={'flow-branch code-'+code}>
    <a href={statusPath(code)}>{label}</a>
    <span>{t.flowWindow} · <b>{count ?? '—'}</b></span>
    <span className="flow-meter" aria-hidden="true"><i style={{transform:`scaleX(${share})`}}/></span>
  </div>;
}

export function RequestFlow({ model, snapshot, admissionSlots, interval, running }: Props) {
  const { t, technical } = useI18n();
  const { config } = model;
  const bucket = snapshot.history.at(-1);
  const responses = bucket ? bucket.completed200 + bucket.rejected429 + bucket.rejected503 : 0;
  const origin = bucket && bucket.completed200 - bucket.completedCacheHits;
  return <section className="request-flow" aria-labelledby="flow-title" aria-describedby="flow-insight" data-running={running}>
    <header><h3 id="flow-title">{t.flowTitle}</h3><p>{t.flowCaveat}</p></header>
    <div className="flow-key"><strong>{interval}</strong><p>{t.flowLegend}</p></div>
    <ol className="flow-map">
      <Stage title={t.flowIn} help="incomingRps">
        <p>{t.flowWindow} · <b>{bucket?.arrivals ?? '—'}</b> {t.requestsUnit}</p>
      </Stage>
      <Stage title={t.flowLimiter} help="rateLimitEnabled" branch={
        <ResponseBranch label={t.flowLimited} code={429} count={bucket?.rejected429} total={responses}/>}>
        <p>{t.flowNow} · {config.rateLimitEnabled ? t.flowOn : t.flowOff}</p>
      </Stage>
      <Stage title={t.flowCache} help="cacheEnabled" branch={
        <ResponseBranch label={t.flowHit} code={200} count={bucket?.completedCacheHits} total={responses}/>}>
        <p>{t.flowNow} · {config.cacheEnabled ? t.flowOn : t.flowOff}</p>
        <p>{t.flowPendingCache} · <b>{snapshot.cachePending}</b></p>
      </Stage>
      <Stage title={t.flowAdmit} help="waiting" branch={
        <ResponseBranch label={t.flowFull} code={503} count={bucket?.rejected503} total={responses}/>}>
        <p>{t.flowRoute}</p>
        <p>{t.flowNow} · {t.flowWait} <b>{snapshot.waiting} / {config.maxQueueSize}</b></p>
        {snapshot.waiting > config.maxQueueSize && <p>{t.flowDrain}</p>}
      </Stage>
      <Stage title={t.flowOrigin} help="active" branch={
        <ResponseBranch label={t.flowDone} code={200} count={origin} total={responses}/>}>
        <p>{t.flowNow} · {t.flowBusy} <b>{snapshot.processing} / {admissionSlots}</b></p>
        <p>{t.flowDispatch}</p>
        <p>{t.flowFree} · <b>{Math.max(0, admissionSlots - snapshot.processing)}</b></p>
      </Stage>
    </ol>
    <div className="flow-foot"><strong>{t.flowWindow} · {t.flowTotal} · {bucket?.completed200 ?? '—'}</strong>
      <div className="flow-node-title"><h4>{t.flowCapacity}</h4><Help field="autoScaling" context={t.flowTitle}/></div>
      <p>{t.flowNow} · {t.activeInstances} <b>{snapshot.effectiveInstanceCount}</b> · {t.concurrencyPerInstance} <b>{config.concurrencyPerInstance}</b> · {t.pending} <b>{Number(model.scaling.readyAt !== null)}</b></p>
      <p>{t.flowProvision}</p>
      {technical && <p>{t.flowTech}</p>}
    </div>
  </section>;
}
