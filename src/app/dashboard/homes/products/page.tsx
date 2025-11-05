
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Loader2, Edit, Trash2, MoreVertical, ImageIcon } from 'lucide-react';
import Image from 'next/image';

import { db, storage } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { type HomeProductCategory } from '../categories/page';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/lib/errors';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export interface HomeProduct {
  id: string;
  title: string;
  description?: string;
  price?: number;
  category: string;
  images: string[];
  createdAt: any;
}

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.').optional(),
  category: z.string().min(1, 'A category is required.'),
  description: z.string().optional(),
  images: z
    .instanceof(FileList)
    .refine((files) => files?.length >= 1, 'At least one image is required.')
    .refine(files => Array.from(files).every(file => file.size < 10 * 1024 * 1024), 'Each image must be less than 10MB.')
});

const editProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.').optional(),
  category: z.string().min(1, 'A category is required.'),
  description: z.string().optional(),
});


export default function ManageHomeProductsPage() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [categories, setCategories] = useState<HomeProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<HomeProduct | null>(null);
  const { toast } = useToast();
  const { user, role } = useAuth();

  const addForm = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  });

  const editForm = useForm<z.infer<typeof editProductSchema>>({
    resolver: zodResolver(editProductSchema),
  });

  const fetchProducts = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'homeProducts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeProduct)));
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collection(db, 'homeProducts').path,
        operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);
  
  const fetchCategories = useCallback(() => {
    if (!user) return;
    const q = query(collection(db, 'homeProductCategories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeProductCategory)));
    }, async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collection(db, 'homeProductCategories').path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubProducts = fetchProducts();
    const unsubCategories = fetchCategories();
    return () => {
      if(unsubProducts) unsubProducts();
      if(unsubCategories) unsubCategories();
    }
  }, [fetchProducts, fetchCategories]);
  
  const handleAddNew = () => {
    addForm.reset({
      title: '',
      price: undefined,
      category: '',
      description: '',
      images: undefined,
    });
    setIsAddDialogOpen(true);
  };
  
  const handleEdit = (product: HomeProduct) => {
    setSelectedProduct(product);
    editForm.reset({
        title: product.title,
        price: product.price ?? undefined,
        category: product.category,
        description: product.description || ''
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (product: HomeProduct) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const onAddSubmit = async (data: z.infer<typeof productSchema>) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to add products.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls = await Promise.all(
        Array.from(data.images).map(async (file) => {
          const storageRef = ref(storage, `homeProducts/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );

      const productData = {
        title: data.title,
        description: data.description || null,
        price: data.price ?? null,
        category: data.category,
        images: imageUrls,
        createdAt: serverTimestamp(),
      };
      
      const collectionRef = collection(db, 'homeProducts');
      addDoc(collectionRef, productData).then(() => {
        toast({ title: 'Product Added Successfully' });
        setIsAddDialogOpen(false);
      }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: productData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
          setIsSubmitting(false);
      });

    } catch (error) {
      console.error("Error adding product:", error);
      toast({ title: 'Error adding product', description: 'There was an issue with image uploads.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };
  
  const onEditSubmit = async (data: z.infer<typeof editProductSchema>) => {
    if (!selectedProduct || !user) return toast({ title: 'No product selected or not authenticated', variant: 'destructive' });
    setIsSubmitting(true);
    
    const docRef = doc(db, 'homeProducts', selectedProduct.id);
    updateDoc(docRef, { ...data, price: data.price ?? null }).then(() => {
        toast({ title: 'Product Updated Successfully' });
        setIsEditDialogOpen(false);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsSubmitting(false);
    });
  }

  const onDeleteConfirm = async () => {
    if (!selectedProduct || !user) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedProduct.images.map(imageUrl => {
            const imageRef = ref(storage, imageUrl);
            return deleteObject(imageRef).catch(err => console.error(`Failed to delete image ${imageUrl}:`, err));
        })
      );
      const docRef = doc(db, 'homeProducts', selectedProduct.id);
      deleteDoc(docRef).then(() => {
          toast({ title: 'Product Deleted' });
          setIsDeleteDialogOpen(false);
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
      toast({ title: 'Error deleting product', variant: 'destructive' });
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Home Products</h2>
          <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Product
          </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>View, edit, or delete home products.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Price</TableHead>
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
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="hidden sm:table-cell">
                        {product.images && product.images.length > 0 ? (
                           <Image src={product.images[0]} alt={product.title} width={64} height={48} className="rounded-md object-cover" />
                        ) : (
                            <div className="h-12 w-16 rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                       <TableCell className="hidden lg:table-cell">
                        {product.price ? `LKR ${product.price.toLocaleString()}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(product)} className="text-destructive focus:text-destructive">
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
           {!loading && products.length === 0 && (
             <p className="text-center text-muted-foreground mt-8">No products have been added yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Home Product</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                    <FormField control={addForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={addForm.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>Price (LKR) (Optional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={addForm.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={categories.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={addForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={addForm.control} name="images" render={({ field: { onChange, ...fieldProps} }) => (
                         <FormItem><FormLabel>Images</FormLabel><FormControl>
                            <Input type="file" multiple accept="image/*" onChange={e => onChange(e.target.files)} /></FormControl><FormMessage />
                        </FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                     <FormField control={editForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="price" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Price (LKR) (Optional)</FormLabel>
                            <FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={editForm.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={categories.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={editForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
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
            <AlertDialogTitle>Delete "{selectedProduct?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This action is irreversible. The product and all its images will be permanently deleted.</AlertDialogDescription>
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
