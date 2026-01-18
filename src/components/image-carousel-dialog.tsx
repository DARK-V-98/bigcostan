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

interface MediaItem {
    url: string;
    type?: 'image' | 'video';
}

interface ImageCarouselDialogProps {
    media: MediaItem[];
    startIndex?: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ImageCarouselDialog({ media, startIndex = 0, open, onOpenChange }: ImageCarouselDialogProps) {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        if (open) {
            setCurrentIndex(startIndex);
        }
    }, [startIndex, open]);
    
    const goToPrevious = useCallback(() => {
        if (!media || media.length === 0) return;
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? media.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, media]);

    const goToNext = useCallback(() => {
        if (!media || media.length === 0) return;
        const isLastSlide = currentIndex === media.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    }, [currentIndex, media]);

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


    if (!media || media.length === 0) return null;

    const currentItem = media[currentIndex];
    const itemType = currentItem.type || 'image'; // Default to image if type is not specified

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl w-full p-0 bg-transparent border-0 flex items-center justify-center h-full">
                 <DialogTitle className="sr-only">Enlarged Project Media</DialogTitle>
                 <DialogDescription className="sr-only">A larger view of the selected project media. Use arrow keys or click the on-screen arrows to navigate.</DialogDescription>
                
                <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
                    {itemType === 'video' ? (
                        <video
                            key={currentIndex}
                            src={currentItem.url}
                            controls
                            autoPlay
                            playsInline
                            className="rounded-lg object-contain w-full h-auto max-h-[90vh]"
                        />
                    ) : (
                        <Image
                            key={currentIndex}
                            src={currentItem.url}
                            alt={`Project media ${currentIndex + 1} of ${media.length}`}
                            width={1200}
                            height={800}
                            className="rounded-lg object-contain w-full h-auto max-h-[90vh]"
                        />
                    )}
                </div>

                {media.length > 1 && (
                     <>
                        <button
                            onClick={goToPrevious}
                            className="fixed top-1/2 left-4 md:left-8 -translate-y-1/2 z-20 p-2 bg-black/60 rounded-full text-white transition-opacity hover:bg-black/80"
                            aria-label="Previous media"
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="fixed top-1/2 right-4 md:right-8 -translate-y-1/2 z-20 p-2 bg-black/60 rounded-full text-white transition-opacity hover:bg-black/80"
                            aria-label="Next media"
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
