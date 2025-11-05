'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface ProjectForCard {
  id: string;
  title?: string;
  category: string;
  subcategory?: string;
  images: string[];
  hint: string;
}

interface ProjectCardProps {
  project: ProjectForCard;
  onCardClick: (images: string[], startIndex: number) => void;
  showBadges?: boolean;
  showTitle?: boolean;
}

export default function ProjectCard({ project, onCardClick, showBadges = true, showTitle = true }: ProjectCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? project.images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isLastSlide = currentIndex === project.images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (!project.images || project.images.length === 0) {
    return null;
  }
  
  return (
    <div onClick={() => onCardClick(project.images, currentIndex)} className="cursor-pointer h-full">
      <Card className="overflow-hidden group shadow-md hover:shadow-2xl transition-shadow duration-300 bg-card rounded-2xl h-full flex flex-col">
        <CardContent className="p-0 relative">
          <Image
            src={project.images[currentIndex]}
            alt={project.title || 'Project Image'}
            data-ai-hint={project.hint}
            width={600}
            height={400}
            className="w-full h-auto object-cover aspect-[4/3] transition-transform duration-300 group-hover:scale-105"
          />
          
          {project.images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute top-1/2 left-2 -translate-y-1/2 z-10 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute top-1/2 right-2 -translate-y-1/2 z-10 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </CardContent>
        <div className="p-4 bg-card flex-grow flex flex-col">
          {showTitle && <h3 className="font-headline text-xl font-bold text-foreground">{project.title || 'Project'}</h3>}
            <div className="flex-grow mt-2">
                {showBadges && (
                    <>
                        <Badge variant="secondary">{project.category}</Badge>
                        {project.subcategory && <Badge variant="outline" className="ml-2">{project.subcategory}</Badge>}
                    </>
                )}
            </div>
        </div>
      </Card>
    </div>
  );
}
