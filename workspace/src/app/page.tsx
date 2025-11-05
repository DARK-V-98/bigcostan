import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Hero from '@/components/sections/hero';
import WhoWeAre from '@/components/sections/who-we-are';
import Services from '@/components/sections/services';
import Projects from '@/components/sections/projects';
import Testimonials from '@/components/sections/testimonials';
import Contact from '@/components/sections/contact';
import AnimateOnScroll from '@/components/layout/animate-on-scroll';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col space-y-24 md:space-y-32 py-12 overflow-x-hidden">
        <Hero />
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <WhoWeAre />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-left-32 duration-1000">
          <Services />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-right-32 duration-1000">
          <Projects />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in zoom-in-95 slide-in-from-left-32 duration-1000">
          <Testimonials />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in zoom-in-95 slide-in-from-left-32 duration-1000">
          <Contact />
        </AnimateOnScroll>
      </main>
      <Footer />
    </div>
  );
}
