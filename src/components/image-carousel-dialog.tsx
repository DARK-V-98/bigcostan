'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ImageCarouselDialogProps {
    images: string[];
    startIndex?: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ImageCarouselDialog({ images, startIndex = 0, open, onOpenChange }: ImageCarouselDialogProps) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        if (open) {
            setCurrentIndex(startIndex);
        }
    }, [startIndex, open]);
    
    const goToPrevious = useCallback(() => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, images.length]);

    const goToNext = useCallback(() => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if(e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            }
        };

        if(open) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }

    }, [open, goToPrevious, goToNext]);


    if (!images || images.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-full p-0 bg-transparent border-0 flex items-center justify-center h-full">
                 <DialogTitle className="sr-only">Enlarged Project Images</DialogTitle>
                 <DialogDescription className="sr-only">A larger view of the selected project images. Use arrow keys or click the on-screen arrows to navigate.</DialogDescription>
                
                <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
                    <Image
                        key={currentIndex}
                        src={images[currentIndex]}
                        alt={`Project image ${currentIndex + 1} of ${images.length}`}
                        width={1200}
                        height={800}
                        className="rounded-lg object-contain w-full h-auto max-h-[90vh]"
                    />
                </div>

                {images.length > 1 && (
                     <>
                        <button
                            onClick={goToPrevious}
                            className="fixed top-1/2 left-4 md:left-8 -translate-y-1/2 z-20 p-2 bg-black/60 rounded-full text-white transition-opacity hover:bg-black/80"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="fixed top-1/2 right-4 md:right-8 -translate-y-1/2 z-20 p-2 bg-black/60 rounded-full text-white transition-opacity hover:bg-black/80"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
