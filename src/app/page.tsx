
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Hero from '@/components/sections/hero';
import WhoWeAre from '@/components/sections/who-we-are';
import Services from '@/components/sections/services';
import Projects from '@/components/sections/projects';
import Testimonials from '@/components/sections/testimonials';
import Contact from '@/components/sections/contact';
import AnimateOnScroll from '@/components/layout/animate-on-scroll';
import VisionMission from '@/components/sections/vision-mission';
import { type HomeAndConstructionBusiness, type WithContext } from 'schema-dts';


const jsonLd: WithContext<HomeAndConstructionBusiness> = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  'name': 'Big Costa Construction (Private) Limited',
  'image': 'https://bigcosta.lk/logobc.png', // Replace with your absolute domain URL
  '@id': 'https://bigcosta.lk', // Replace with your absolute domain URL
  'url': 'https://bigcosta.lk', // Replace with your absolute domain URL
  'telephone': '+94 77 466 2078',
  'priceRange': '$$',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': 'No. 33 - Level 1, Parkland Building 02',
    'addressLocality': 'Colombo',
    'addressRegion': 'Western Province',
    'postalCode': '00200',
    'addressCountry': 'LK'
  },
  'sameAs': [
    'https://www.facebook.com/bigcostaconstruction',
    'https://www.instagram.com/big_costa_construction',
    'https://www.linkedin.com/in/lakshman-de-costa-271562376',
  ],
  'geo': {
    '@type': 'GeoCoordinates',
    'latitude': 6.9271, // Approximate latitude for Colombo
    'longitude': 79.8612 // Approximate longitude for Colombo
  },
  'servesCuisine': '',
  'openingHoursSpecification': [
    {
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
      ],
      'opens': '09:00',
      'closes': '17:00'
    }
  ],
  'logo': 'https://bigcosta.lk/logobc.png'
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1 flex flex-col space-y-24 md:space-y-32 py-12 overflow-x-hidden">
        <Hero />
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <WhoWeAre />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-top-16 duration-1000">
          <VisionMission />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <Services />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-right-32 duration-1000">
          <Projects />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in zoom-in-95 duration-1000">
          <Testimonials />
        </AnimateOnScroll>
        <AnimateOnScroll animationClasses="animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <Contact />
        </AnimateOnScroll>
      </main>
      <Footer />
    </div>
  );
}
