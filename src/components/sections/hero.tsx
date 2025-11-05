
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ArrowRight } from 'lucide-react';
import { useTheme } from 'next-themes';

import { db } from '@/lib/firebase-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Hero() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useTheme();

  useEffect(() => {
    const q = query(
      collection(db, 'projects'),
      where('showOnHomepage', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allImages: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.images && Array.isArray(data.images)) {
          allImages.push(...data.images);
        } else if (data.image && typeof data.image === 'string') {
          // Backward compatibility
          allImages.push(data.image);
        }
      });
      setImages(allImages);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching homepage images: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 5000); // Change image every 5 seconds

      return () => clearInterval(timer);
    }
  }, [images.length]);

  const isTechTheme = theme === 'theme-tech';

  return (
    <section id="hero" className="w-full">
      <div className="container mx-auto px-4 z-10">
        <div className="relative w-full min-h-[70vh] sm:min-h-[85vh] rounded-3xl overflow-hidden flex items-center justify-center p-6 bg-background">
          {loading ? (
            <Skeleton className="absolute inset-0 rounded-3xl" />
          ) : isTechTheme ? (
             <video
                src="/bg.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
          ) : (
            images.length > 0 ? (
              <>
                {images.map((src, index) => (
                  <Image
                    key={src + index}
                    src={src}
                    alt="Showcase of our construction projects"
                    fill
                    priority={index === 0}
                    className={cn(
                      "object-cover transition-opacity duration-1000 ease-in-out",
                      index === currentIndex ? "opacity-100" : "opacity-0"
                    )}
                  />
                ))}
              </>
            ) : (
                // Fallback if no images are found, show a gradient
                 <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary via-black to-secondary" />
            )
          )}
          
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <Image
                src="/logobc.png"
                alt="Big Costa Logo"
                width={128}
                height={128}
                className="h-32 w-32 mb-6 mx-auto rounded-full"
              />
               {isTechTheme ? (
                  <>
                    <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
                      Powering Your Digital World
                    </h1>
                    <p className="mt-6 text-base sm:text-lg md:text-xl text-neutral-200 max-w-2xl mx-auto drop-shadow-sm">
                      Your trusted source for high-performance computer parts, electronics, and tech accessories.
                    </p>
                  </>
              ) : (
                  <>
                    <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
                      Building Dreams, Crafting Futures
                    </h1>
                    <p className="mt-6 text-base sm:text-lg md:text-xl text-neutral-200 max-w-2xl mx-auto drop-shadow-sm">
                      We build exceptional buildings and spaces. We use expert skill, new designs, and are committed to quality.
                    </p>
                  </>
              )}
            </div>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
              <Button asChild size="lg" className="rounded-full px-8 py-6 text-lg w-full sm:w-auto">
                <Link href={isTechTheme ? '/services/tech' : '/about-us'}>
                   {isTechTheme ? 'Explore Products' : 'About Us'}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg text-white border-white hover:bg-white hover:text-black w-full sm:w-auto">
                <Link href="/projects">
                  View Our Work
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
