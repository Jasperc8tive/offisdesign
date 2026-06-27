import { Container } from '@offisdesign/ui';
import { AnnouncementBar } from '../../components/chrome/announcement-bar';
import { Header } from '../../components/chrome/header';
import { Footer } from '../../components/chrome/footer';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="focus:z-tooltip focus:bg-primary focus:font-body focus:text-on-dark focus:shadow-focus sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-sm focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main">
        <Container className="py-12">{children}</Container>
      </main>
      <Footer />
    </div>
  );
}
