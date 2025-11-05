
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2, Loader2, GripVertical, X } from 'lucide-react';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.'),
  subcategories: z.array(z.object({
    value: z.string().min(1, 'Subcategory name cannot be empty.')
  })).optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subcategories",
  });

  const fetchCategories = useCallback(() => {
    if (!user) {
        setLoading(false);
        return;
    };
    
    setLoading(true);
    const q = query(collection(db, 'projectCategories'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesData: Category[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
      setCategories(categoriesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching categories: ", error);
      toast({ title: 'Error', description: 'Could not fetch categories.', variant: 'destructive' });
      setLoading(false);
    });
    return unsubscribe;
  }, [user, toast]);

  useEffect(() => {
    const unsubscribe = fetchCategories();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchCategories]);

  const handleAddNew = () => {
    form.reset({ name: '', subcategories: [] });
    setSelectedCategory(null);
    setIsEditDialogOpen(true);
  };
  
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
      subcategories: category.subcategories.map(sub => ({ value: sub })),
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    if (!user) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to save categories.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    const categoryData = {
      name: data.name,
      subcategories: data.subcategories ? data.subcategories.map(s => s.value).filter(Boolean) : []
    };

    try {
      if (selectedCategory) {
        // Update existing category
        const categoryRef = doc(db, 'projectCategories', selectedCategory.id);
        await updateDoc(categoryRef, categoryData);
        toast({ title: 'Success', description: 'Category updated successfully.' });
      } else {
        // Add new category
        await addDoc(collection(db, 'projectCategories'), categoryData);
        toast({ title: 'Success', description: 'New category added successfully.' });
      }
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error saving category: ", error);
      toast({ title: 'Error', description: 'Could not save category. Check permissions.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedCategory || !user) {
        toast({ title: 'Error', description: 'No category selected or not authenticated.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
      // Find projects using this category and update them
      const projectsQuery = query(collection(db, 'projects'), where('category', '==', selectedCategory.name));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      const batch = writeBatch(db);
      projectsSnapshot.forEach(projectDoc => {
        batch.update(projectDoc.ref, { category: 'Uncategorized', subcategory: '' });
      });
      
      await batch.commit();
      
      // Delete the category document
      await deleteDoc(doc(db, 'projectCategories', selectedCategory.id));
      
      toast({ title: 'Success', description: 'Category deleted. Associated projects have been moved to "Uncategorized".' });
    } catch (error) {
      console.error("Error deleting category: ", error);
      toast({ title: 'Error', description: 'Could not delete category. Check permissions.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Categories</h2>
          <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Category
          </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <CardDescription>
            Add, edit, or delete project categories and their sub-categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-4">
                {categories.map(category => (
                    <div key={category.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            {category.subcategories.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Sub-categories: {category.subcategories.join(', ')}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(category)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mt-4">No categories created yet. Click "Add New Category" to start.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Edit/Add Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                    Define a main category and add optional sub-categories.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Main Category Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Residential" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div>
                        <FormLabel>Sub-categories (Optional)</FormLabel>
                        <div className="space-y-2 mt-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                     <GripVertical className="h-4 w-4 text-muted-foreground" />
                                     <FormField
                                        control={form.control}
                                        name={`subcategories.${index}.value`}
                                        render={({ field }) => (
                                            <FormItem className="flex-grow">
                                                <FormControl>
                                                    <Input placeholder={`Sub-category ${index + 1}`} {...field} disabled={isSubmitting} />
                                                </FormControl>
                                                <FormMessage/>
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSubmitting}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => append({ value: '' })}
                            disabled={isSubmitting}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Sub-category
                        </Button>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete "{selectedCategory?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All projects under this category will be moved to an "Uncategorized" state. Sub-categories will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
