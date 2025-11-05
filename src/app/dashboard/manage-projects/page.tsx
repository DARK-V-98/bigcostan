
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MoreVertical, Edit, Trash2, Loader2, ImageIcon } from 'lucide-react';

import { db, storage } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { type Category } from '../categories/page';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface Project {
  id: string;
  title?: string;
  category: string;
  subcategory?: string;
  description?: string;
  images: string[];
  showOnHomepage: boolean;
  hint: string;
}

const editProjectSchema = z.object({
  title: z.string().optional(),
  category: z.string().min(1, { message: 'A category is required.' }),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  showOnHomepage: z.boolean().default(false),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;


export default function ManageProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
  });

  const watchCategory = form.watch('category');
  const availableSubcategories = categories.find(c => c.name === watchCategory)?.subcategories || [];

  const fetchProjects = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let images: string[] = [];
        if (data.images && Array.isArray(data.images)) {
          images = data.images;
        } else if (data.image && typeof data.image === 'string') {
          images = [data.image];
        }

        projectsData.push({ id: doc.id, ...data, images } as Project);
      });
      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects: ", error);
      toast({ title: 'Error', description: 'Could not fetch projects.', variant: 'destructive' });
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);
  
  const fetchCategories = useCallback(() => {
    const catQuery = query(collection(db, 'projectCategories'));
    const catUnsubscribe = onSnapshot(catQuery, (querySnapshot) => {
      const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
      setCategories(categoriesData);
    });
    return catUnsubscribe;
  }, []);

  useEffect(() => {
    let projectUnsubscribe: (() => void) | undefined;
    let categoryUnsubscribe: (() => void) | undefined;
    if (user) {
        projectUnsubscribe = fetchProjects();
        categoryUnsubscribe = fetchCategories();
    } else {
        setLoading(false);
    }
    return () => {
        if (projectUnsubscribe) projectUnsubscribe();
        if (categoryUnsubscribe) categoryUnsubscribe();
    }
  }, [user, fetchProjects, fetchCategories]);

  const openDeleteDialog = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    form.reset({
      title: project.title || '',
      category: project.category,
      subcategory: project.subcategory || '',
      description: project.description || '',
      showOnHomepage: project.showOnHomepage,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject || !user) {
        toast({ title: 'Error', description: 'No project selected or not authenticated.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
      if (selectedProject.images && selectedProject.images.length > 0) {
        const deletePromises = selectedProject.images.map(imageUrl => {
            const imageRef = ref(storage, imageUrl);
            return deleteObject(imageRef).catch(err => {
                console.error(`Failed to delete image ${imageUrl}:`, err);
            });
        });
        await Promise.all(deletePromises);
      }
      await deleteDoc(doc(db, 'projects', selectedProject.id));
      toast({ title: 'Success', description: 'Project deleted successfully.' });
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast({ title: 'Error', description: 'Could not delete project. Check permissions.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };
  
  const handleUpdateProject = async (data: EditProjectFormValues) => {
    if (!selectedProject || !user) {
        toast({ title: 'Error', description: 'No project selected or not authenticated.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
      const projectRef = doc(db, 'projects', selectedProject.id);
      await updateDoc(projectRef, {
        ...data,
        subcategory: data.subcategory || '', // ensure it's not undefined
      });
      toast({ title: 'Success', description: 'Project updated successfully.' });
    } catch (error) {
       console.error('Error updating project:', error);
       toast({ title: 'Update Failed', description: 'Could not update project details. Check permissions.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
        setIsEditDialogOpen(false);
        setSelectedProject(null);
    }
  };


  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Manage Projects</CardTitle>
          <CardDescription>
            View, edit, or delete uploaded projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Sub-Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Images</TableHead>
                  <TableHead className="hidden md:table-cell">On Homepage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-12 w-16 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="hidden sm:table-cell">
                        {project.images && project.images.length > 0 ? (
                           <Image src={project.images[0]} alt={project.title || 'Project'} width={64} height={48} className="rounded-md object-cover" />
                        ) : (
                            <div className="h-12 w-16 rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{project.title || <span className="text-muted-foreground">Untitled</span>}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{project.category}</Badge>
                      </TableCell>
                       <TableCell className="hidden lg:table-cell">
                        {project.subcategory ? <Badge variant="outline">{project.subcategory}</Badge> : '-'}
                      </TableCell>
                       <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{project.images?.length || 0}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={project.showOnHomepage ? 'default' : 'outline'}>
                          {project.showOnHomepage ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(project)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteDialog(project)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
           {!loading && projects.length === 0 && (
             <p className="text-center text-muted-foreground mt-8">No projects have been uploaded yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all its images from the servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Make changes to the project details. Click save when you're done. Note: Images cannot be edited here.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateProject)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Modern Villa" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); form.setValue('subcategory', ''); }} value={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {availableSubcategories.length > 0 && (
                 <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sub-category (Optional)</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a sub-category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             <SelectItem value="__none__">None</SelectItem>
                            {availableSubcategories.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
               )}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description..." {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showOnHomepage"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Show on Homepage</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmitting}>
                        Cancel
                    </Button>
                 </DialogClose>
                 <Button type="submit" disabled={isSubmitting}>
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Save changes
                 </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
