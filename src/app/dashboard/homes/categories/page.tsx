
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Loader2 } from 'lucide-react';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/lib/errors';
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


export interface HomeProductCategory {
  id: string;
  name: string;
}

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function ManageHomeCategoriesPage() {
  const [categories, setCategories] = useState<HomeProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HomeProductCategory | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const fetchCategories = useCallback(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    setLoading(true);
    const q = query(collection(db, 'homeProductCategories'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesData: HomeProductCategory[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HomeProductCategory));
      setCategories(categoriesData);
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collection(db, 'homeProductCategories').path,
        operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchCategories();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchCategories]);

  const handleAddNew = () => {
    form.reset({ name: '' });
    setSelectedCategory(null);
    setIsEditDialogOpen(true);
  };
  
  const handleEdit = (category: HomeProductCategory) => {
    setSelectedCategory(category);
    form.reset({
      name: category.name,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (category: HomeProductCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: CategoryFormValues) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to manage categories.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const categoryData = {
      name: data.name,
    };

    if (selectedCategory) {
        const categoryRef = doc(db, 'homeProductCategories', selectedCategory.id);
        updateDoc(categoryRef, categoryData).then(() => {
            toast({ title: 'Success', description: 'Category updated successfully.' });
            setIsEditDialogOpen(false);
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: categoryRef.path,
                operation: 'update',
                requestResourceData: categoryData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSubmitting(false);
        });
    } else {
        const collectionRef = collection(db, 'homeProductCategories');
        addDoc(collectionRef, categoryData).then(() => {
            toast({ title: 'Success', description: 'New category added successfully.' });
            setIsEditDialogOpen(false);
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: collectionRef.path,
                operation: 'create',
                requestResourceData: categoryData,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSubmitting(false);
        });
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedCategory || !user) {
        toast({ title: 'Error', description: 'No category selected or not authenticated.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    try {
      const productsQuery = query(collection(db, 'homeProducts'), where('category', '==', selectedCategory.name));
      const productsSnapshot = await getDocs(productsQuery);
      
      const batch = writeBatch(db);
      productsSnapshot.forEach(productDoc => {
        batch.update(productDoc.ref, { category: 'Uncategorized' });
      });
      
      await batch.commit();
      
      const docRef = doc(db, 'homeProductCategories', selectedCategory.id);
      deleteDoc(docRef).then(() => {
        toast({ title: 'Success', description: 'Category deleted. Associated products moved to "Uncategorized".' });
        setIsDeleteDialogOpen(false);
        setSelectedCategory(null);
      }).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'delete',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
          setIsSubmitting(false);
      });
      
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete category.', variant: 'destructive' });
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Home Product Categories</h2>
          <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Category
          </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <CardDescription>
            Add, edit, or delete categories for home products.
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
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                    Define a category for home products.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Pantry Cupboards" {...field} disabled={isSubmitting} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete "{selectedCategory?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All products under this category will be moved to an "Uncategorized" state.
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
