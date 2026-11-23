import { Playground } from './Playground';
import { useI18n } from '../i18n/context';

function Journey() {
  const { t } = useI18n();
  return (
    <figure className="journey">
      <figcaption><span className="tiny-label">{t.fictionalEndpoint}</span><strong>{t.diagramTitle}</strong></figcaption>
      <div className="journey-art" role="img" aria-label={t.diagramLabel}>
        <div className="client-node"><span className="browser-symbol" aria-hidden="true"><i /><i /><i /></span><span>{t.client}</span></div>
        <div className="path-to-api"><span>{t.request}</span><span className="path-line" aria-hidden="true">→</span></div>
        <div className="api-node"><span className="server-symbol" aria-hidden="true"><i /><i /><i /></span><strong>{t.compute}</strong></div>
        <div className="return-path"><span aria-hidden="true">←</span><span>{t.response}</span></div>
      </div>
      <div className="endpoint"><span className="method">GET</span><code>/api/products</code><span aria-hidden="true">↗</span></div>
      <p className="diagram-note">{t.diagramNote}</p>
    </figure>
  );
}

export function App() {
  const { locale, setLocale, t } = useI18n();
  return (
    <>
      <a className="skip-link" href="#main">{t.skip}</a>
      <header className="site-header wrap">
        <a className="brand" href="#main"><span className="brand-mark" aria-hidden="true">↗</span>{t.brand}<span className="brand-dot" aria-hidden="true">.</span></a>
        <nav aria-label={t.navigation}><a href="#main">{t.overview}</a><a href="#experiment">{t.experiment}</a></nav>
        <div className="language-switch" role="group" aria-label={t.language}>
          <button lang="en" aria-label={t.english} aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
          <button lang="es" aria-label={t.spanish} aria-pressed={locale === 'es'} onClick={() => setLocale('es')}>ES</button>
        </div>
      </header>
      <main id="main" className="wrap" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span aria-hidden="true">✳</span>{t.badge}</p>
            <h1 id="hero-title">{t.headline}<br /><span>{t.headlineAccent}</span></h1>
            <p className="hero-intro">{t.intro}</p>
            <a className="primary-button" href="#experiment">{t.start}<span aria-hidden="true">↗</span></a>
            <p className="start-note">{t.startNote}</p>
          </div>
          <Journey />
          <p className="hero-footnote">{t.heroNote}</p>
        </section>
        <aside className="safety-notice"><span className="safety-icon" aria-hidden="true">✓</span><div><strong>{t.simulated}</strong><p>{t.safety}</p></div><span className="benchmark">{t.benchmark}</span></aside>
        <section className="idea" aria-labelledby="idea-title">
          <div><p className="tiny-label">{t.lessonNumber}</p><h2 id="idea-title">{t.lessonTitle}</h2></div>
          <p>{t.lessonBody}</p>
        </section>
        <div className="features">
          {[
            { symbol: '↳', title: t.featureOneTitle, body: t.featureOneBody },
            { symbol: '⇄', title: t.featureTwoTitle, body: t.featureTwoBody },
            { symbol: '◎', title: t.featureThreeTitle, body: t.featureThreeBody },
          ].map((feature) => <article key={feature.symbol}><span className="feature-symbol" aria-hidden="true">{feature.symbol}</span><h3>{feature.title}</h3><p>{feature.body}</p></article>)}
        </div>
        <Playground />

      </main>
      <footer className="site-footer wrap"><span>{t.brand}<span aria-hidden="true"> / </span>{t.footer}</span><span>{t.phase}</span></footer>
    </>
  );
}
