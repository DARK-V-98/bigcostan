
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Loader2, Edit, Trash2, MoreVertical, FileVideo, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { format } from 'date-fns';

import { storage, db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/lib/errors';

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

const editProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
});
type EditProjectFormValues = z.infer<typeof editProjectSchema>;


export default function UploadOngoingProjectsPage() {
  const [projects, setProjects] = useState<OngoingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<OngoingProject | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadForm = useForm<OngoingProjectFormValues>({
    resolver: zodResolver(ongoingProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      media: undefined,
    },
  });

  const editForm = useForm<EditProjectFormValues>({
      resolver: zodResolver(editProjectSchema)
  });

  const fetchProjects = useCallback(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    const q = query(collection(db, 'ongoingProjects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OngoingProject)));
      setLoading(false);
    }, (error) => {
      const permissionError = new FirestorePermissionError({ path: 'ongoingProjects', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchProjects();
    return () => unsubscribe && unsubscribe();
  }, [fetchProjects]);

  const onUploadSubmit = async (data: OngoingProjectFormValues) => {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to upload projects.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
      const mediaFiles = Array.from(data.media);
      const mediaUploads = await Promise.all(
        mediaFiles.map(async (file) => {
          const storageRef = ref(storage, `ongoingProjects/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return { url, type: file.type.startsWith('video') ? 'video' : 'image', name: file.name };
        })
      );
      
      const projectData = {
          title: data.title,
          description: data.description || '',
          media: mediaUploads,
          createdAt: serverTimestamp(),
      };
      
      const collectionRef = collection(db, "ongoingProjects");
      addDoc(collectionRef, projectData)
        .then(() => {
            toast({ title: 'Upload Successful!', description: `New ongoing project update has been added.` });
            uploadForm.reset();
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (fileInput) fileInput.value = '';
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: 'ongoingProjects', operation: 'create', requestResourceData: projectData });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsSubmitting(false));

    } catch (error) {
      toast({ title: 'Upload Failed', description: 'There was an error uploading your files.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: EditProjectFormValues) => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    const docRef = doc(db, 'ongoingProjects', selectedProject.id);
    updateDoc(docRef, data)
        .then(() => {
            toast({ title: 'Success', description: 'Project update has been saved.' });
            setIsEditDialogOpen(false);
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: data });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setIsSubmitting(false));
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;
    setIsSubmitting(true);
    try {
        const deletePromises = selectedProject.media.map(item => {
            const mediaRef = ref(storage, item.url);
            return deleteObject(mediaRef).catch(err => console.error(`Failed to delete file ${item.url}:`, err));
        });
        await Promise.all(deletePromises);
        
        const docRef = doc(db, 'ongoingProjects', selectedProject.id);
        deleteDoc(docRef)
            .then(() => {
                toast({ title: 'Success', description: 'Project update deleted successfully.' });
                setIsDeleteDialogOpen(false);
            })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => setIsSubmitting(false));

    } catch(error) {
        toast({ title: 'Error', description: 'An unexpected error occurred while deleting media.', variant: 'destructive' });
        setIsSubmitting(false);
    }
  };

  const openEditDialog = (project: OngoingProject) => {
    setSelectedProject(project);
    editForm.reset(project);
    setIsEditDialogOpen(true);
  }

  const openDeleteDialog = (project: OngoingProject) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1">
       <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Upload Ongoing Project Media</CardTitle>
          <CardDescription>
            Upload multiple photos and videos for a new project update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...uploadForm}>
            <form onSubmit={uploadForm.handleSubmit(onUploadSubmit)} className="space-y-6">
              <FormField
                control={uploadForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Update Title</FormLabel>
                     <FormControl>
                      <Input placeholder="e.g., Week 5 Progress - Foundation" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={uploadForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description of the progress..." {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={uploadForm.control}
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
                        onChange={(e) => e.target.files && onChange(e.target.files)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Uploading...' : 'Upload Media'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="rounded-2xl">
            <CardHeader>
                <CardTitle>Existing Project Updates</CardTitle>
                <CardDescription>Manage your previously uploaded project updates.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : projects.length > 0 ? (
                    <div className="space-y-4">
                        {projects.map(project => (
                            <div key={project.id} className="border p-4 rounded-lg flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 overflow-hidden">
                                   <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center shrink-0">
                                       {project.media[0]?.type === 'image' ? (
                                           <Image src={project.media[0].url} alt={project.title} width={80} height={80} className="object-cover w-full h-full rounded-md" />
                                       ) : (
                                           <FileVideo className="w-8 h-8 text-muted-foreground" />
                                       )}
                                   </div>
                                   <div className="overflow-hidden">
                                       <h3 className="font-semibold truncate">{project.title}</h3>
                                       <p className="text-sm text-muted-foreground">{format(new Date(project.createdAt.seconds * 1000), "PP")}</p>
                                       <p className="text-xs text-muted-foreground mt-1 truncate">{project.description}</p>
                                   </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEditDialog(project)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openDeleteDialog(project)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">No ongoing project updates have been added yet.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
    
    {/* Edit Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Project Update</DialogTitle>
                <DialogDescription>Modify the title and description for this update.</DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
                    <FormField control={editForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>

    {/* Delete Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the project update "{selectedProject?.title}" and all its media. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
