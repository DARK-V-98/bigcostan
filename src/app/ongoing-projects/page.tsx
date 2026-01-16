
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { format } from 'date-fns';
import { FileVideo, Image as ImageIcon } from 'lucide-react';
import { type Metadata } from 'next';


// Note: Per-page metadata cannot be used in a client component.
// It should be moved to a parent layout or a server component if dynamic metadata is needed.
// export const metadata: Metadata = {
//     title: 'Ongoing Projects | Big Costa',
//     description: 'Follow the progress of our latest construction projects with regular updates, photos, and videos.',
// };

interface MediaItem {
    url: string;
    type: 'image' | 'video';
    name: string;
}

interface OngoingProject {
    id: string;
    title: string;
    description?: string;
    media: MediaItem[];
    createdAt: { seconds: number; nanoseconds: number; };
}

export default function OngoingProjectsPage() {
  const [projects, setProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ongoingProjects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: OngoingProject[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as OngoingProject));
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching ongoing projects: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <section className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Ongoing Projects</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Follow our journey as we bring new visions to life, step by step.
            </p>
          </div>
          
          <div className="mt-12 max-w-4xl mx-auto space-y-12">
            {loading ? (
                Array.from({ length: 2 }).map((_, index) => (
                    <Card key={index} className="rounded-2xl">
                        <CardHeader>
                            <Skeleton className="h-7 w-3/4" />
                            <Skeleton className="h-4 w-1/4 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Skeleton className="h-4 w-full" />
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Skeleton className="aspect-square w-full" />
                                <Skeleton className="aspect-square w-full" />
                                <Skeleton className="aspect-square w-full" />
                           </div>
                        </CardContent>
                    </Card>
                ))
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <Card key={project.id} className="rounded-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        {project.createdAt && (
                            <CardDescription>
                                Posted on {format(new Date(project.createdAt.seconds * 1000), "MMMM d, yyyy")}
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                        {project.description && (
                            <p className="mb-6 text-muted-foreground">{project.description}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {project.media.map((item, index) => (
                                <div key={index} className="relative aspect-square w-full overflow-hidden rounded-lg group">
                                    {item.type === 'image' ? (
                                        <Image
                                            src={item.url}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <video
                                            src={item.url}
                                            controls
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                       {item.type === 'image' ? <ImageIcon className="h-8 w-8 text-white" /> : <FileVideo className="h-8 w-8 text-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
              ))
            ) : (
                 <div className="text-center text-muted-foreground mt-12 text-lg py-16">
                    No ongoing project updates have been posted yet. Check back soon!
                </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
