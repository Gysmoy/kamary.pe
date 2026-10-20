import { createRoot } from 'react-dom/client'
import CreateReactScript from '../../Utils/CreateReactScript'
import Layout from '../components/Layout'
import { Badge, Container, Eyebrow, Heading, Serif } from '../components/ui'
import content from '../data/content'

const { privacy } = content

// Etiquetas de secciones: las que no tienen título en el sitio usan un nombre propio (UI)
const LABELS = ['Introducción y finalidades', 'Revocación del consentimiento']
const sections = privacy.sections.map((s, i) => ({
  id: `seccion-${i + 1}`,
  label: s.heading ?? LABELS[i] ?? `Sección ${i + 1}`,
  ...s,
}))

const num = (i) => String(i + 1).padStart(2, '0')

// Indice editorial: hairlines y numeracion mono
const TocList = ({ onPick }) => (
  <ol className="border-t border-kf-ink/15">
    {sections.map((s, i) => (
      <li key={s.id} className="border-b border-kf-ink/15">
        <a href={`#${s.id}`} onClick={onPick}
          className="group flex gap-3 py-3 text-sm text-kf-text transition-colors hover:text-kf-navy">
          <span className="pt-0.5 font-mono text-[11px] text-kf-red">{num(i)}</span>
          <span className="leading-snug transition-transform group-hover:translate-x-1">{s.label}</span>
        </a>
      </li>
    ))}
  </ol>
)

const Hero = () => (
  <section className="border-b border-kf-ink/15 bg-kf-canvas pb-12 pt-16 md:pb-16 md:pt-24">
    <Container>
      <Eyebrow n="LG">Legal</Eyebrow>
      <Heading level={1} size="xl" immediate lines={['Políticas de', <><Serif>privacidad</Serif></>]} />
      <div className="mt-7"><Badge tone="outline">Ley N.º 29733 · Protección de datos personales</Badge></div>
    </Container>
  </section>
)

const Privacy = () => (
  <>
    <Hero />
    <section className="bg-kf-canvas py-14 md:py-20">
      <Container className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20">
        {/* Índice: sticky en desktop, desplegable en móvil */}
        <details className="group rounded-2xl border border-kf-ink/15 bg-white p-5 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-kf-muted">
            Índice <span className="text-kf-red transition-transform group-open:rotate-45">+</span>
          </summary>
          <nav aria-label="Índice de la política" className="mt-4"><TocList /></nav>
        </details>
        <nav aria-label="Índice de la política" className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-kf-muted">Índice</p>
          <TocList />
        </nav>

        <article className="max-w-[68ch] space-y-14">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-kf-ink/15 pt-10 first:border-t-0 first:pt-0">
              <p className="font-mono text-xs text-kf-red">{num(i)} / {num(sections.length - 1)}</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] text-kf-ink md:text-[28px]">{s.label}</h2>
              <div className="mt-5 space-y-5">
                {s.paragraphs.map((p, k) => <p key={k} className="text-[16px] leading-[1.8] text-kf-text md:text-[17px]">{p}</p>)}
                {s.bullets && (
                  <ul className="space-y-3 text-[16px] leading-[1.75] text-kf-text md:text-[17px]">
                    {s.bullets.map((b, k) => (
                      <li key={k} className="flex gap-4"><span className="mt-[0.7em] h-px w-4 shrink-0 bg-kf-red" aria-hidden="true" /><span>{b}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </article>
      </Container>
    </section>
  </>
)

export default Privacy

CreateReactScript((el, properties) => {
  createRoot(el).render(<Layout><Privacy {...properties} /></Layout>)
})
