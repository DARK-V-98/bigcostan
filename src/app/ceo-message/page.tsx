
'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function OldCeoMessagePage() {
  useEffect(() => {
    redirect('/about-us');
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <p className="text-muted-foreground mt-4">Redirecting to our 'About Us' page...</p>
        </div>
    </div>
  );
}
