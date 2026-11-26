import { useEffect, useRef, useState } from 'react';
import type { SimulationState, SimulationSnapshot } from '../engine';
import { useI18n } from '../i18n/context';
import { insights, technicalTerm, terms } from './insights';
import type { Insight, Term } from './insights';

interface Props {
  model: SimulationState;
  snapshot: SimulationSnapshot;
  applySpike: () => void;
  revealProtection?: () => void;
}

export function Learning({ model, snapshot, applySpike, revealProtection }: Props) {
  const { t, locale, technical, setTechnical } = useI18n();
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [term, setTerm] = useState<Term>('api');
  const entry = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (step) heading.current?.focus(); }, [step]);

  function openTour() {
    setSent(false);
    setStep(1);
    if (step === 1) heading.current?.focus();
  }
  function closeTour() {
    setStep(0);
    entry.current?.focus();
  }
  const note = (key: Insight) => <p id={key === primary ? 'flow-insight' : undefined} key={key}>{t[key]} {technical && t[`def${technicalTerm(key)}Tech`]}</p>;
  const [primary = 'neutral', ...others] = insights(model);
  const p95 = snapshot.window?.p95Ms;
  return <aside className="learning" aria-label={t.tour}>
    <div className="learn-tools">
      <button ref={entry} onClick={openTour} aria-expanded={step>0}>{t.tour}</button>
      <label>{t.depth} <select value={technical?'technical':'simple'} onChange={e=>setTechnical(e.target.value==='technical')}>
        <option value="simple">{t.simple}</option><option value="technical">{t.technical}</option>
      </select></label>
      <details className="glossary"><summary>{t.gloss}</summary>
        <label>{t.term} <select value={term} onChange={e=>setTerm(e.target.value as Term)}>
          {[...terms].sort((a,b)=>t[`def${a}Term`].localeCompare(t[`def${b}Term`],locale)).map(k=>
            <option key={k} value={k}>{t[`def${k}Term`]}</option>)}
        </select></label>
        <p>{t[`def${term}${technical?'Tech':'Simple'}`]}</p>
      </details>
    </div>
    {step>0 && <section className="lesson">
      <small>{t.step} {step}/3</small>
      <h3 tabIndex={-1} ref={heading}>{step===1?t.one:step===2?t.two:t.three}</h3>
      {step===1 && <>
        <p>{technical?t.introTech:t.introSimple}</p>
        <small>{t.fiction}</small><pre>{t.sample}</pre>
        <button onClick={()=>setSent(true)} disabled={sent}>{t.send}</button>
        <div aria-live="polite">{sent && <><pre>{t.reply}{'\n'}{t.json}</pre><p>{t.takeaway}</p></>}</div>
      </>}
      {step===2 && <>
        <p>{technical?t.pileTech:t.pileSimple}</p><p>{t.restartHelp}</p>
        <button onClick={applySpike}>{t.apply}</button> <a href="#run-controls">{t.startLink}</a>
        <p>{t.defp95Term} · {p95==null?t.noData:p95.toLocaleString(locale)+' ms'} · {t.window}</p>
        <p>{technical?t.defp95Tech:t.defp95Simple}</p>
        <p>{t.active}: {snapshot.processing} / {snapshot.slots} · {t.waiting}: {snapshot.waiting}</p>
      </>}
      {step===3 && <>
        <p>{technical?t.protectTech:t.protectSimple}</p><a href="#capacity-controls" onClick={event => { if (revealProtection) { event.preventDefault(); revealProtection(); } }}>{t.tryControls}</a>
        <p>{t.activeInstances}: {snapshot.effectiveInstanceCount} · {t.pending}: {Number(model.scaling.readyAt!==null)}</p>
        {model.scaling.events.at(-1) && <p>{t.scaleEvents} · {model.scaling.events.at(-1)!.atMs/1000} s · {t[model.scaling.events.at(-1)!.kind]}</p>}
      </>}
      <div className="lesson-nav">
        {step>1 && <button onClick={()=>setStep(step-1)}>{t.back}</button>}
        {step<3 && <button onClick={()=>setStep(step+1)}>{t.next}</button>}
        <button onClick={step===3?openTour:closeTour}>{step===3?t.restart:t.skipTour}</button>
        <button onClick={closeTour}>{t.close}</button>
      </div>
    </section>}
    <section className="why"><h3>{t.why}</h3>{note(primary)}
      {others.length>0 && <details><summary>{t.more} ({others.length})</summary>{others.map(note)}</details>}
    </section>
  </aside>;
}
