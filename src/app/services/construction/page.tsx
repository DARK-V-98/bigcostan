
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HardHat, DraftingCompass, Wrench, Building2, Shovel, PaintRoller, Layers, Droplets, Hammer, Paintbrush, Sprout, Flame } from 'lucide-react';
import AnimateOnScroll from "@/components/layout/animate-on-scroll";
import { type Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Comprehensive Construction Services | Big Costa',
    description: 'Explore the wide range of construction services offered by Big Costa, from general contracting and architectural design to specialized trades like electrical, plumbing, and steel fabrication for residential and commercial projects.',
    keywords: 'general contractor, architectural design, interior design, electrical services, plumbing services, HVAC, roofing, masonry, demolition, excavation, concrete work, tiling, waterproofing, carpentry, steel fabrication, Sri Lanka',
};


const allServices = [
  {
    icon: <HardHat className="h-10 w-10 text-primary" />,
    title: 'General Contractor Services',
    description: 'We manage your project from start to finish. We ensure quality, budget, and timeline.',
  },
  {
    icon: <DraftingCompass className="h-10 w-10 text-primary" />,
    title: 'Architect & Interior Design',
    description: 'We work with you to design useful and beautiful spaces, from plans to final details.',
  },
  {
    icon: <Wrench className="h-10 w-10 text-primary" />,
    title: 'Electrical, Plumbing & HVAC',
    description: 'We install and maintain key systems. This makes your building safe, comfortable, and efficient.',
  },
  {
    icon: <Building2 className="h-10 w-10 text-primary" />,
    title: 'Roofing & Masonry',
    description: 'We do expert structural work, from roofs to masonry.',
  },
  {
    icon: <Shovel className="h-10 w-10 text-primary" />,
    title: 'Demolition & Excavation',
    description: 'We prepare sites safely and quickly. This includes demolition and excavation.',
  },
  {
    icon: <PaintRoller className="h-10 w-10 text-primary" />,
    title: 'Flooring & Painting',
    description: 'We provide finishing touches. This includes professional flooring and painting.',
  },
  {
    icon: <Layers className="h-10 w-10 text-primary" />,
    title: 'Concrete Work',
    description: 'We specialize in high-quality concrete work for strong structures.',
  },
  {
    icon: <Droplets className="h-10 w-10 text-primary" />,
    title: 'Tiling & Waterproofing',
    description: 'We provide expert tile and waterproofing services to protect your property.',
  },
  {
    icon: <Hammer className="h-10 w-10 text-primary" />,
    title: 'Carpentry & Woodwork',
    description: 'We offer custom carpentry and woodwork.',
  },
  {
    icon: <Paintbrush className="h-10 w-10 text-primary" />,
    title: 'Plastering & Ceiling',
    description: 'We provide smooth plastering and ceiling work.',
  },
  {
    icon: <Sprout className="h-10 w-10 text-primary" />,
    title: 'Landscaping & Paving',
    description: 'We transform outdoor spaces with landscaping and paving.',
  },
  {
    icon: <Flame className="h-10 w-10 text-primary" />,
    title: 'Steel Fabrication',
    description: 'We offer custom steel fabrication.',
  },
];

const animationDelays = ["delay-0", "delay-150", "delay-300", "delay-0", "delay-150", "delay-300", "delay-0", "delay-150", "delay-300", "delay-0", "delay-150", "delay-300"];


export default function ConstructionServicesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
         <section id="services" className="container mx-auto px-4">
            <div className="rounded-3xl bg-gradient-to-br from-secondary to-background p-8 md:p-12 lg:p-20">
                <div className="text-center max-w-3xl mx-auto">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Construction Services</h1>
                <p className="mt-4 text-lg text-secondary-foreground">
                    We offer a comprehensive suite of construction services, customized for each client and project's unique needs.
                </p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allServices.map((service, index) => (
                    <AnimateOnScroll
                    key={index}
                    animationClasses={`animate-in fade-in zoom-in-95 duration-500 ${animationDelays[index % animationDelays.length]}`}
                    className="h-full"
                    >
                    <Card className="flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-card rounded-2xl h-full">
                        <CardHeader className="items-center">
                        {service.icon}
                        <CardTitle className="font-headline mt-4">{service.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                        <CardDescription className="text-secondary-foreground">{service.description}</CardDescription>
                        </CardContent>
                    </Card>
                    </AnimateOnScroll>
                ))}
                </div>
            </div>
            </section>
      </main>
      <Footer />
    </div>
  );
}
