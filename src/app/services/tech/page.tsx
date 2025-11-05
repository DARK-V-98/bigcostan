
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Cpu, HardDrive, MemoryStick, Monitor, Gamepad2, Laptop } from 'lucide-react';
import AnimateOnScroll from "@/components/layout/animate-on-scroll";
import { type Metadata } from 'next';

export const metadata: Metadata = {
    title: 'PC Parts & Electronics Store | Big Costa',
    description: 'Your source for computer parts, PC components, gaming gear, laptops, and electronics from Big Costa Tech. Build your ultimate PC with our wide selection of high-performance products.',
    keywords: 'computer parts sri lanka, pc components, gaming pc sri lanka, electronics store colombo, gpu, cpu, ram, ssd, laptops, gaming accessories',
};


const techServices = [
  {
    icon: <Cpu className="h-10 w-10 text-primary" />,
    title: 'Computer Components',
    description: 'A wide selection of CPUs, motherboards, GPUs, and more for your custom PC build.',
  },
  {
    icon: <HardDrive className="h-10 w-10 text-primary" />,
    title: 'Storage Solutions',
    description: 'Fast and reliable SSDs, high-capacity HDDs, and external drives for all your data needs.',
  },
  {
    icon: <MemoryStick className="h-10 w-10 text-primary" />,
    title: 'RAM & Memory',
    description: 'Upgrade your performance with our range of high-speed DDR4 and DDR5 RAM kits.',
  },
  {
    icon: <Monitor className="h-10 w-10 text-primary" />,
    title: 'Peripherals & Accessories',
    description: 'Keyboards, mice, monitors, and headsets to complete your setup.',
  },
  {
    icon: <Gamepad2 className="h-10 w-10 text-primary" />,
    title: 'Gaming Gear',
    description: 'Everything you need for the ultimate gaming experience, from components to accessories.',
  },
  {
    icon: <Laptop className="h-10 w-10 text-primary" />,
    title: 'Laptops & Pre-builts',
    description: 'Powerful pre-built PCs and laptops for gaming, work, and everyday use.',
  },
];

const animationDelays = ["delay-0", "delay-150", "delay-300", "delay-0", "delay-150", "delay-300"];


export default function TechPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
         <section id="services" className="container mx-auto px-4">
            <div className="rounded-3xl bg-gradient-to-br from-muted to-background p-8 md:p-12 lg:p-20">
                <div className="text-center max-w-3xl mx-auto">
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Tech & Electronics</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Your trusted retail partner for high-performance computer components, gaming gear, and electronics.
                </p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {techServices.map((service, index) => (
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
