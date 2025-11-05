
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Loader2, Edit, Trash2, MoreVertical, ImageIcon, MapPin, Bed, Bath, Car, Phone } from 'lucide-react';
import Image from 'next/image';

import { db, storage } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { type PropertyCategory } from './categories/page';
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

export interface PropertyContact {
    name: string;
    phone: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  price?: number;
  category: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  size?: number;
  images: string[];
  contacts?: PropertyContact[];
  createdAt: any;
}

const contactSchema = z.object({
  name: z.string().min(2, 'Contact name is required.'),
  phone: z.string().min(10, 'A valid phone number is required.'),
});

const basePropertySchema = {
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.').optional(),
  category: z.string().min(1, 'A category is required.'),
  location: z.string().min(3, 'Location is required'),
  size: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  parking: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
  contacts: z.array(contactSchema).max(3, 'You can add up to 3 contacts.').optional(),
};

const propertySchema = z.object({
  ...basePropertySchema,
  images: z
    .instanceof(FileList)
    .refine((files) => files?.length >= 1, 'At least one image is required.')
    .refine(files => Array.from(files).every(file => file.size < 10 * 1024 * 1024), 'Each image must be less than 10MB.')
});

const editPropertySchema = z.object(basePropertySchema);

const companyContacts: PropertyContact[] = [
    { name: 'Main Office', phone: '+94 11 499 1200' },
    { name: 'Sales Hotline', phone: '+94 77 466 2078' },
];

export default function ManagePropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const addForm = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: { contacts: [] }
  });
  const { fields: addContacts, append: appendAddContact, remove: removeAddContact } = useFieldArray({ control: addForm.control, name: "contacts" });

  const editForm = useForm<z.infer<typeof editPropertySchema>>({
    resolver: zodResolver(editPropertySchema),
    defaultValues: { contacts: [] }
  });
  const { fields: editContacts, append: appendEditContact, remove: removeEditContact } = useFieldArray({ control: editForm.control, name: "contacts" });

  const fetchProperties = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
      setLoading(false);
    }, async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collection(db, 'properties').path,
        operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);
  
  const fetchCategories = useCallback(() => {
    if (!user) return;
    const q = query(collection(db, 'propertyCategories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyCategory)));
    }, async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collection(db, 'propertyCategories').path,
            operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubProducts = fetchProperties();
    const unsubCategories = fetchCategories();
    return () => {
      if(unsubProducts) unsubProducts();
      if(unsubCategories) unsubCategories();
    }
  }, [fetchProperties, fetchCategories]);
  
  const handleAddNew = () => {
    addForm.reset({ contacts: [] });
    setIsAddDialogOpen(true);
  };
  
  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    editForm.reset({
        ...property,
        price: property.price ?? undefined,
        size: property.size ?? undefined,
        bedrooms: property.bedrooms ?? undefined,
        bathrooms: property.bathrooms ?? undefined,
        parking: property.parking ?? undefined,
        contacts: property.contacts ?? [],
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (property: Property) => {
    setSelectedProperty(property);
    setIsDeleteDialogOpen(true);
  };

  const onAddSubmit = async (data: z.infer<typeof propertySchema>) => {
    if (!user) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to add properties.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls = await Promise.all(
        Array.from(data.images).map(async (file) => {
          const storageRef = ref(storage, `properties/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );

      const propertyData = {
        title: data.title,
        description: data.description || null,
        price: data.price ?? null,
        category: data.category,
        location: data.location,
        size: data.size ?? null,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        parking: data.parking ?? null,
        contacts: data.contacts || [],
        images: imageUrls,
        createdAt: serverTimestamp(),
      };
      
      const collectionRef = collection(db, 'properties');
      addDoc(collectionRef, propertyData).then(() => {
        toast({ title: 'Property Added Successfully' });
        setIsAddDialogOpen(false);
      }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: propertyData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      }).finally(() => {
          setIsSubmitting(false);
      });

    } catch (error) {
      console.error("Error adding property:", error);
      toast({ title: 'Error adding property', description: 'There was an issue with image uploads.', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };
  
  const onEditSubmit = async (data: z.infer<typeof editPropertySchema>) => {
    if (!selectedProperty || !user) return toast({ title: 'No property selected or not authenticated', variant: 'destructive' });
    setIsSubmitting(true);
    
    const docRef = doc(db, 'properties', selectedProperty.id);
    const updateData = {
        ...data,
        price: data.price ?? null,
        size: data.size ?? null,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        parking: data.parking ?? null,
        contacts: data.contacts || [],
    };

    updateDoc(docRef, updateData).then(() => {
        toast({ title: 'Property Updated Successfully' });
        setIsEditDialogOpen(false);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: updateData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsSubmitting(false);
    });
  }

  const onDeleteConfirm = async () => {
    if (!selectedProperty || !user) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedProperty.images.map(imageUrl => {
            const imageRef = ref(storage, imageUrl);
            return deleteObject(imageRef).catch(err => console.error(`Failed to delete image ${imageUrl}:`, err));
        })
      );
      const docRef = doc(db, 'properties', selectedProperty.id);
      deleteDoc(docRef).then(() => {
          toast({ title: 'Property Deleted' });
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
      toast({ title: 'Error deleting property', variant: 'destructive' });
      setIsSubmitting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const propertyFormFields = (formInstance: any, fields: any[], append: any, remove: any) => (
    <>
      <FormField control={formInstance.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="price" render={({ field }) => (
          <FormItem><FormLabel>Price (LKR) (Optional)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={categories.length === 0}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
          <FormMessage /></FormItem>
      )} />
      <FormField control={formInstance.control} name="location" render={({ field }) => (
          <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-4">
        <FormField control={formInstance.control} name="size" render={({ field }) => (
            <FormItem><FormLabel>Size (sqft/perch)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={formInstance.control} name="bedrooms" render={({ field }) => (
            <FormItem><FormLabel>Bedrooms</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={formInstance.control} name="bathrooms" render={({ field }) => (
            <FormItem><FormLabel>Bathrooms</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={formInstance.control} name="parking" render={({ field }) => (
            <FormItem><FormLabel>Parking</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={formInstance.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
      )} />
       <div>
            <FormLabel>Additional Contacts</FormLabel>
            <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border rounded-lg relative">
                        <FormField control={formInstance.control} name={`contacts.${index}.name`} render={({ field }) => (
                            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="e.g., John Doe"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={formInstance.control} name={`contacts.${index}.phone`} render={({ field }) => (
                            <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} placeholder="+94 XX XXX XXXX"/></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)} className="self-end">Remove</Button>
                    </div>
                ))}
            </div>
            {fields.length < 3 && (
                 <div className="flex gap-2 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', phone: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Custom
                    </Button>
                     <Select onValueChange={(value) => {
                        const contact = companyContacts.find(c => c.phone === value);
                        if (contact) append(contact);
                     }}>
                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Add from company..." /></SelectTrigger>
                        <SelectContent>
                            {companyContacts.map(c => <SelectItem key={c.phone} value={c.phone}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
            )}
        </div>
    </>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Manage Properties</h2>
          <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Property
          </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>View, edit, or delete property listings.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
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
                  properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="hidden sm:table-cell">
                        {property.images && property.images.length > 0 ? (
                           <Image src={property.images[0]} alt={property.title} width={64} height={48} className="rounded-md object-cover" />
                        ) : (
                            <div className="h-12 w-16 rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{property.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                         {property.location}
                      </TableCell>
                       <TableCell className="hidden lg:table-cell">
                        {property.price ? `LKR ${property.price.toLocaleString()}` : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(property)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(property)} className="text-destructive focus:text-destructive">
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
           {!loading && properties.length === 0 && (
             <p className="text-center text-muted-foreground mt-8">No properties have been added yet.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Add New Property</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                    {propertyFormFields(addForm, addContacts, appendAddContact, removeAddContact)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Edit Property</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                     {propertyFormFields(editForm, editContacts, appendEditContact, removeEditContact)}
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
            <AlertDialogTitle>Delete "{selectedProperty?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This action is irreversible. The property and all its images will be permanently deleted.</AlertDialogDescription>
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
