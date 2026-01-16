
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { storage, db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const ongoingProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  media: z
    .instanceof(FileList)
    .refine((files) => files?.length >= 1, 'At least one image or video is required.')
    .refine(
        (files) => Array.from(files).every((file) => file.size <= 50 * 1024 * 1024), // 50MB limit per file
        'Each file size must be less than 50MB.'
    )
    .refine(
        (files) => Array.from(files).every((file) => file.type.startsWith('image/') || file.type.startsWith('video/')),
        'Only image and video files are accepted.'
    ),
});

type OngoingProjectFormValues = z.infer<typeof ongoingProjectSchema>;

export default function UploadOngoingProjectsPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<OngoingProjectFormValues>({
    resolver: zodResolver(ongoingProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      media: undefined,
    },
  });

  const onSubmit = async (data: OngoingProjectFormValues) => {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to upload projects.', variant: 'destructive' });
        return;
    }
    setLoading(true);
    try {
      const mediaFiles = Array.from(data.media);
      const mediaUploads = await Promise.all(
        mediaFiles.map(async (file) => {
          const storageRef = ref(storage, `ongoingProjects/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return {
            url,
            type: file.type.startsWith('video') ? 'video' : 'image',
            name: file.name,
          };
        })
      );
      
      const projectData = {
          title: data.title,
          description: data.description || '',
          media: mediaUploads,
          createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "ongoingProjects"), projectData);

      toast({
        title: 'Upload Successful!',
        description: `New ongoing project update "${data.title}" has been added.`,
      });

      form.reset();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
      if(fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error uploading project:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
       <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Upload Ongoing Project Media</CardTitle>
          <CardDescription>
            Upload multiple photos and videos for an ongoing project. This will be displayed on the "Ongoing Projects" page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Update Title</FormLabel>
                     <FormControl>
                      <Input placeholder="e.g., Week 5 Progress - Foundation" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description of the progress..." {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="media"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <FormItem>
                    <FormLabel>Media Files (Photos & Videos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept="image/*,video/*"
                        multiple
                        onBlur={onBlur}
                        name={name}
                        ref={ref}
                        onChange={(e) => {
                            if (e.target.files) {
                                onChange(e.target.files);
                            }
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {loading ? 'Uploading...' : 'Upload Media'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
