
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';
import Image from 'next/image';

import { storage, db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/lib/errors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PantryDesign {
  id: string;
  title?: string;
  imageUrl: string;
}

const designSchema = z.object({
  title: z.string().optional(),
  image: z
    .instanceof(FileList)
    .refine((files) => files?.length === 1, 'A single image is required.')
    .refine((files) => files?.[0]?.size <= 10 * 1024 * 1024, 'Image size must be less than 10MB.')
    .refine((files) => files?.[0]?.type.startsWith('image/'), 'Only image files are accepted.'),
});

type DesignFormValues = z.infer<typeof designSchema>;

export default function ManagePantryDesignsPage() {
  const [designs, setDesigns] = useState<PantryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<PantryDesign | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designSchema),
    defaultValues: {
      title: '',
      image: undefined,
    },
  });

  const fetchDesigns = useCallback(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    const q = query(collection(db, 'pantryDesigns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const designsData: PantryDesign[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PantryDesign));
      setDesigns(designsData);
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collection(db, 'pantryDesigns').path,
        operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchDesigns();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchDesigns]);

  const onSubmit = async (data: DesignFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to add designs.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const imageFile = data.image[0];
      const storageRef = ref(storage, `pantryDesigns/${Date.now()}_${imageFile.name}`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      const designData = {
        title: data.title || '',
        imageUrl,
        createdAt: serverTimestamp(),
      };
      
      const collectionRef = collection(db, 'pantryDesigns');
      addDoc(collectionRef, designData).then(() => {
          toast({ title: 'Success', description: 'New pantry design added successfully.' });
          form.reset();
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
          if (fileInput) fileInput.value = '';
      }).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: designData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
        setIsSubmitting(false);
      });

    } catch (error) {
      toast({ title: 'Upload Failed', description: 'Could not upload design.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteClick = (design: PantryDesign) => {
    setSelectedDesign(design);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDesign || !user) {
        toast({ title: 'Error', description: 'No design selected or not authenticated.', variant: 'destructive' });
        return;
    }
    setIsDeleting(true);
    try {
      const imageRef = ref(storage, selectedDesign.imageUrl);
      await deleteObject(imageRef).catch(err => console.error("Failed to delete image, it might not exist:", err));

      const docRef = doc(db, 'pantryDesigns', selectedDesign.id);
      deleteDoc(docRef).then(() => {
        toast({ title: 'Success', description: 'Pantry design deleted successfully.' });
        setIsDeleteDialogOpen(false);
        setSelectedDesign(null);
      }).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
        setIsDeleting(false);
      });

    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete design.', variant: 'destructive' });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedDesign(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Add New Pantry Design</CardTitle>
            <CardDescription>Upload an image and an optional title for a pantry design.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design Title (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Modern Oak Pantry" {...field} value={field.value ?? ''} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                      <FormLabel>Design Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onBlur={onBlur}
                          name={name}
                          ref={ref}
                          onChange={(e) => {
                            if (e.target.files) {
                              onChange(e.target.files);
                            }
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Uploading...' : 'Add Design'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Existing Pantry Designs</CardTitle>
            <CardDescription>View and manage uploaded pantry designs.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : designs.length > 0 ? (
              <div className="space-y-3">
                {designs.map((design) => (
                  <div key={design.id} className="border p-3 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                       <Image src={design.imageUrl} alt={design.title || 'Pantry Design'} width={64} height={48} className="rounded-md object-cover w-16 h-12" />
                       <span className="font-medium">{design.title || <span className="italic text-muted-foreground">Untitled Design</span>}</span>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(design)} disabled={isDeleting}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground mt-4">No pantry designs have been added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pantry design and its image from the servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
