
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DoorClosed, Lamp, Sofa, UtensilsCrossed, SquareGanttChart, Ruler } from 'lucide-react';
import AnimateOnScroll from "@/components/layout/animate-on-scroll";
import { type Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Custom Home & Interior Solutions | Big Costa',
    description: 'Discover custom pantry cupboards, modern kitchen designs, bespoke furniture, and complete interior solutions from Big Costa Homes. Transform your living space with our expert craftsmanship.',
    keywords: 'pantry cupboards sri lanka, kitchen design sri lanka, interior design colombo, custom furniture, 3d modeling, space planning, home solutions',
};


const homeServices = [
  {
    icon: <DoorClosed className="h-10 w-10 text-primary" />,
    title: 'Custom Pantry Cupboards',
    description: 'Beautiful, functional, and space-efficient pantry cupboards designed to fit your kitchen perfectly.',
  },
  {
    icon: <UtensilsCrossed className="h-10 w-10 text-primary" />,
    title: 'Modern Kitchen Design',
    description: 'Complete kitchen remodeling and design services, from layout planning to installation.',
  },
  {
    icon: <Sofa className="h-10 w-10 text-primary" />,
    title: 'Interior Design Solutions',
    description: 'Comprehensive interior design services to create stylish and harmonious living spaces.',
  },
  {
    icon: <Lamp className="h-10 w-10 text-primary" />,
    title: 'Custom Furniture & Fixtures',
    description: 'Bespoke furniture and fixtures to match your unique style and requirements.',
  },
  {
    icon: <SquareGanttChart className="h-10 w-10 text-primary" />,
    title: 'Space Planning',
    description: 'Expert space planning to maximize functionality and flow in your home or office.',
  },
  {
    icon: <Ruler className="h-10 w-10 text-primary" />,
    title: 'Consultation & 3D Modeling',
    description: 'Visualize your project with our professional consultation and 3D modeling services.',
  },
];

const animationDelays = ["delay-0", "delay-150", "delay-300", "delay-0", "delay-150", "delay-300"];


export default function HomeSolutionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
         <section id="services" className="container mx-auto px-4">
            <div className="rounded-3xl bg-gradient-to-br from-primary to-background p-8 md:p-12 lg:p-20">
                <div className="text-center max-w-3xl mx-auto">
                <h1 className="font-headline text-4xl md:text-5xl font-bold">Home Solutions</h1>
                <p className="mt-4 text-lg text-foreground">
                    Crafting beautiful and functional interiors, from custom pantry cupboards to complete kitchen designs.
                </p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {homeServices.map((service, index) => (
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
                        <CardDescription className="text-card-foreground/80">{service.description}</CardDescription>
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
