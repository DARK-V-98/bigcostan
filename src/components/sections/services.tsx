
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { HardHat, Home, Cpu, Building } from 'lucide-react';
import AnimateOnScroll from "@/components/layout/animate-on-scroll";
import Link from 'next/link';
import Image from "next/image";

const divisions = [
  {
    icon: <HardHat className="h-10 w-10 text-primary" />,
    title: 'Big Costa Construction',
    description: 'Leading the industry with robust and reliable construction services for projects of all sizes.',
    href: '/services/construction',
    imgSrc: '/cs.jpg',
    imgHint: 'construction site'
  },
  {
    icon: <Home className="h-10 w-10 text-primary" />,
    title: 'Big Costa Homes',
    description: 'Specializing in custom pantry cupboards, kitchen solutions, and elegant interior designs.',
    href: '/services/home-solutions',
    imgSrc: '/hm.png',
    imgHint: 'modern kitchen pantry'
  },
  {
    icon: <Building className="h-10 w-10 text-primary" />,
    title: 'Big Costa Properties',
    description: 'Your trusted partner in finding and securing the perfect real estate properties.',
    href: '/properties',
    imgSrc: '/gb.png',
    imgHint: 'modern house exterior'
  },
  {
    icon: <Cpu className="h-10 w-10 text-primary" />,
    title: 'Big Costa Tech',
    description: 'Your trusted source for high-performance computer parts, electronics, and tech accessories.',
    href: '/services/tech',
    imgSrc: '/th.png',
    imgHint: 'computer hardware'
  },
];

const animationDelays = ["delay-0", "delay-150", "delay-300", "delay-[450ms]"];

export default function Services() {
  return (
    <section id="services" className="container mx-auto px-4">
      <div className="rounded-3xl bg-gradient-to-br from-secondary to-background p-8 md:p-12 lg:p-20 backdrop-blur-sm">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">Our Core Divisions</h2>
          <p className="mt-4 text-lg text-secondary-foreground">
            A family of companies dedicated to excellence in construction, home solutions, and technology.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {divisions.map((division, index) => (
            <AnimateOnScroll
              key={index}
              animationClasses={`animate-in fade-in zoom-in-95 duration-500 ${animationDelays[index % animationDelays.length]}`}
              className="h-full"
            >
              <Link href={division.href} className="h-full block group">
                <Card className="flex flex-col text-center transition-all duration-300 shadow-lg hover:shadow-primary/50 hover:-translate-y-2 bg-card rounded-2xl h-full overflow-hidden backdrop-blur-sm">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={division.imgSrc}
                      alt={division.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={division.imgHint}
                    />
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col items-center">
                    {division.icon}
                    <h3 className="font-headline mt-4 text-xl font-bold">{division.title}</h3>
                    <p className="mt-2 text-muted-foreground text-sm flex-grow">{division.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
