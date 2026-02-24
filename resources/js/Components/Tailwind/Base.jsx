import { BaseProvider } from "./BaseContext"
import Header from "./Header";
import Footer from "./Footer";
import TopBanner from "./TopBanner";

const Base = (properties) => {
  const { footerLinks, socials, terms, children, hasRole } = properties
  return <BaseProvider {...properties}>
    <section className="relative text-light bg-deep">
      <TopBanner />
      <Header hasRole={hasRole} />
      <div
        className="block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl aspect-square z-0"
        style={{
          background: 'radial-gradient(circle, rgba(47, 59, 82, 0.66) 0%, rgba(47, 59, 82, 0) 70%)'
        }}
      />
      <main className="min-h-[480px] relative">{children}</main>
      <Footer socials={socials} terms={terms} footerLinks={footerLinks} />
    </section>
  </BaseProvider>
}

export default Base