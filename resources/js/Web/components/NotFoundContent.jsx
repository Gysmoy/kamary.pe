import { ArrowUpRight } from 'lucide-react'
import { Button, Container, Eyebrow, Heading, ImageFrame, Reveal, Serif } from './ui'

// Accesos rapidos del 404 (lista editorial con hairlines)
const QUICK = [
  { href: '/tienda', label: 'Tienda' },
  { href: '/preparados-magistrales', label: 'Preparados magistrales' },
  { href: '/contacto', label: 'Contacto' },
]

// Contenido 404 reutilizable (las paginas lo importan de aqui, no de Pages/NotFound que monta su propia app)
const NotFoundContent = () => (
  <section className="relative overflow-hidden bg-kf-canvas py-16 md:py-24">
    <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-6">
        <Eyebrow>Error 404</Eyebrow>
        <Heading level={1} size="xl" lines={['Esta página no', <><Serif>existe</Serif></>]} />
        <p className="mt-6 max-w-md text-lg leading-relaxed text-kf-text">El enlace puede haber cambiado o el producto ya no está disponible.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button href="/tienda">Ver la tienda</Button>
          <Button href="/" variant="ghost">Ir al inicio</Button>
        </div>
        <nav aria-label="Accesos rápidos" className="mt-12 max-w-md">
          <ul className="border-t border-kf-ink/15">
            {QUICK.map((q, k) => (
              <li key={q.href} className="border-b border-kf-ink/15">
                <a href={q.href} className="group flex items-center justify-between gap-4 py-4 text-kf-ink">
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-xs text-kf-red">0{k + 1}</span>
                    <span className="font-medium transition-transform group-hover:translate-x-1">{q.label}</span>
                  </span>
                  <ArrowUpRight size={18} className="text-kf-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-kf-red" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <Reveal delay={0.1} className="lg:col-span-6">
        <ImageFrame src="/web/slider/slider-Farmacia.webp" alt="Farmacia y laboratorio" ratio="aspect-[4/5] lg:aspect-[5/4]" radius="rounded-[32px]" position="object-[78%_50%]" />
      </Reveal>
    </Container>
  </section>
)

export { NotFoundContent }
export default NotFoundContent
