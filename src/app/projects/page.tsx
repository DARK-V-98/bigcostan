
'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import ImageCarouselDialog from '@/components/image-carousel-dialog';

interface ProjectImage {
  projectId: string;
  imageUrl: string;
  projectImages: string[];
}

interface MediaItem {
    url: string;
    type?: 'image' | 'video';
}

const IMAGES_PER_PAGE = 15;

export default function ProjectsPage() {
  const [allImages, setAllImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselMedia, setCarouselMedia] = useState<MediaItem[]>([]);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const imagesData: ProjectImage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let projectImages: string[] = [];
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          projectImages = data.images;
        } else if (data.image && typeof data.image === 'string') {
          projectImages = [data.image];
        }
        
        if (projectImages.length > 0) {
            projectImages.forEach(imageUrl => {
                imagesData.push({
                    projectId: doc.id,
                    imageUrl,
                    projectImages,
                });
            });
        }
      });
      setAllImages(imagesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleImageClick = (projectImages: string[], imageUrl: string) => {
    const startIndex = projectImages.findIndex(img => img === imageUrl);
    setCarouselMedia(projectImages.map(url => ({ url, type: 'image' })));
    setCarouselStartIndex(startIndex > -1 ? startIndex : 0);
    setIsCarouselOpen(true);
  };

  const totalPages = Math.ceil(allImages.length / IMAGES_PER_PAGE);
  const paginatedImages = allImages.slice(
    (currentPage - 1) * IMAGES_PER_PAGE,
    currentPage * IMAGES_PER_PAGE
  );

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <section className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Our Work</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse our full portfolio of projects.
            </p>
          </div>
          
          <div className="mt-12">
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 15 }).map((_, index) => (
                        <div key={index} className="overflow-hidden bg-card rounded-lg">
                            <Skeleton className="w-full h-auto aspect-[4/3]" />
                        </div>
                    ))}
                </div>
            ) : allImages.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {paginatedImages.map(({ projectId, imageUrl, projectImages }, index) => (
                    <Card 
                        key={`${projectId}-${index}`} 
                        className="overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 bg-card rounded-lg cursor-pointer"
                        onClick={() => handleImageClick(projectImages, imageUrl)}
                    >
                        <CardContent className="p-0 relative">
                            <Image
                                src={imageUrl}
                                alt={`Project image ${index + 1}`}
                                width={400}
                                height={300}
                                className="w-full h-auto object-cover aspect-[4/3] transition-transform duration-300 group-hover:scale-105"
                            />
                        </CardContent>
                    </Card>
                  ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-12 flex justify-center items-center gap-4">
                        <Button onClick={goToPreviousPage} disabled={currentPage === 1} variant="outline">
                            Previous
                        </Button>
                        <span className="text-muted-foreground font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button onClick={goToNextPage} disabled={currentPage === totalPages} variant="outline">
                            Next
                        </Button>
                    </div>
                )}
              </>
            ) : (
                 <div className="text-center text-muted-foreground mt-12 text-lg">
                    No projects have been uploaded yet. Please check back soon!
                </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
       <ImageCarouselDialog
        open={isCarouselOpen}
        onOpenChange={setIsCarouselOpen}
        media={carouselMedia}
        startIndex={carouselStartIndex}
      />
    </div>
  );
}
