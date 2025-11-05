
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import { useToast } from '@/hooks/use-toast';

// This is a client-side component that should be used in a layout or provider.
// It centralizes the handling of Firestore permission errors.
export default function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: Error) => {
        // In a real app, you might log this to an error tracking service.
        // For this demo, we'll throw it to make it visible in the Next.js dev overlay.
        // The custom error class is designed to provide a rich, debuggable message.
        console.error("A Firestore permission error was caught. This will now be thrown to appear in the development overlay.", error.message);

        // This makes the error visible in the Next.js dev overlay
        // We wrap it in a timeout to ensure it's thrown in a new call stack
        // and properly caught by Next.js's error boundary.
        setTimeout(() => {
            throw error;
        }, 0);

        // Also show a user-friendly toast notification.
        toast({
            title: "Permission Denied",
            description: "You don't have permission to perform this action. Check the console for details.",
            variant: "destructive",
        });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
