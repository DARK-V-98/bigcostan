
'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


import { db, storage } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import { type Property } from '../dashboard/properties/page';
import { type PropertyCategory } from '../dashboard/properties/categories/page';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Bed, Bath, Maximize, PlusCircle, Loader2, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';


const submissionSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  description: z.string().min(10, 'Please provide a detailed description.'),
  price: z.coerce.number().min(1, 'Price is required.'),
  location: z.string().min(3, 'Location is required.'),
  images: z.instanceof(FileList).refine(files => files.length > 0, 'At least one image is required.'),
});


function PropertySubmissionForm({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm<z.infer<typeof submissionSchema>>({
        resolver: zodResolver(submissionSchema),
        defaultValues: { title: '', description: '', price: 0, location: '' },
    });

    const onSubmit = async (data: z.infer<typeof submissionSchema>) => {
        if (!user) {
            toast({ title: 'Authentication Required', description: 'Please log in to submit a property.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const imageUrls = await Promise.all(
                Array.from(data.images).map(async (file) => {
                    const storageRef = ref(storage, `propertySubmissions/${user.uid}/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    return getDownloadURL(storageRef);
                })
            );

            const submissionData = {
                ...data,
                images: imageUrls,
                userId: user.uid,
                userEmail: user.email,
                status: 'pending',
                createdAt: serverTimestamp(),
            };

            const submissionRef = await addDoc(collection(db, 'propertySubmissions'), submissionData);
            
            const chatRef = await addDoc(collection(db, 'chats'), {
                userId: user.uid,
                userEmail: user.email,
                agentIds: [], // Agents can join this chat
                createdAt: serverTimestamp(),
                lastMessage: 'New property submission.',
                submissionId: submissionRef.id,
                readBy: [user.uid],
            });
            
            await addDoc(collection(db, 'chats', chatRef.id, 'messages'), {
                text: `New submission for: ${data.title}. \nDescription: ${data.description}\nPrice: LKR ${data.price.toLocaleString()}\nLocation: ${data.location}`,
                senderId: 'system',
                senderName: 'System',
                createdAt: serverTimestamp(),
                imageUrls,
            });

            toast({ title: 'Submission Received', description: 'An agent will contact you shortly via chat.' });
            form.reset();
            setDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'Submission Failed', description: 'There was an error. Please try again.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Property Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Luxury Villa in Colombo 7" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Describe your property..." /></FormControl><FormMessage /></FormItem>
          )} />
           <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem><FormLabel>Asking Price (LKR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
           <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} placeholder="City or area" /></FormControl><FormMessage /></FormItem>
          )} />
           <FormField control={form.control} name="images" render={({ field: { onChange, ...fieldProps} }) => (
            <FormItem><FormLabel>Property Images</FormLabel><FormControl><Input type="file" multiple accept="image/*" onChange={e => onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
          )} />
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Submit for Review
            </Button>
          </DialogFooter>
        </form>
      </Form>
    );
}

function PropertiesContent() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);

  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('default');
  }, [setTheme]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category'));
  }, [searchParams]);

  const handleCategoryChange = (categoryName: string) => {
    const newCategory = categoryName === 'all' ? null : categoryName;
    setSelectedCategory(newCategory);
    const params = new URLSearchParams(window.location.search);
    if (newCategory) {
      params.set('category', newCategory);
    } else {
      params.delete('category');
    }
    router.push(`/properties?${params.toString()}`);
  };
  
  const handleListPropertyClick = () => {
    if (!user) {
        toast({
            title: "Login Required",
            description: "Please log in or create an account to list your property.",
            variant: "destructive"
        });
        router.push('/auth');
    } else {
        setIsSubmissionDialogOpen(true);
    }
  };

  const fetchProperties = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProperties(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchCategories = useCallback(() => {
    const q = query(collection(db, 'propertyCategories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyCategory)));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubProducts = fetchProperties();
    const unsubCategories = fetchCategories();
    return () => {
      unsubProducts && unsubProducts();
      unsubCategories && unsubCategories();
    };
  }, [fetchProperties, fetchCategories]);
  
  const handleImageClick = (property: Property) => {
    setSelectedProperty(property);
  };
  
  const openImageCarousel = (images: string[], startIndex: number) => {
    setCarouselImages(images);
    setIsCarouselOpen(true);
  }

  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      const categoryMatch = !selectedCategory || p.category === selectedCategory;
      const searchMatch = !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [properties, selectedCategory, searchTerm]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <section className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Property Listings</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Find your next home, land, or investment opportunity with us. Or, list your property for sale.
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
             <Input
                type="text"
                placeholder="Search by title or location..."
                className="max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            <Select onValueChange={handleCategoryChange} value={selectedCategory || 'all'}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Button onClick={handleListPropertyClick}>
                <PlusCircle className="mr-2 h-4 w-4" />
                List Your Property
            </Button>
          </div>
          
          <div className="mt-12">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index} className="overflow-hidden bg-card rounded-lg">
                            <Skeleton className="w-full h-auto aspect-video" />
                            <CardContent className="p-4">
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-4 w-1/3 mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <Card 
                        key={property.id} 
                        className="overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 bg-card rounded-lg cursor-pointer flex flex-col"
                        onClick={() => handleImageClick(property)}
                    >
                        <CardContent className="p-0 relative">
                            <Image
                                src={property.images[0]}
                                alt={property.title}
                                width={600}
                                height={400}
                                className="w-full h-auto object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
                            />
                             <Badge variant="secondary" className="absolute top-2 right-2">{property.category}</Badge>
                        </CardContent>
                        <div className="p-4 flex-grow flex flex-col">
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                             <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <MapPin className="w-4 h-4 text-primary"/>
                                <span>{property.location}</span>
                            </div>
                            {property.price != null && (
                                <p className="text-primary font-bold text-xl mt-2">LKR {property.price.toLocaleString()}</p>
                            )}
                            <div className="flex-grow mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                                {property.bedrooms != null && <span className="flex items-center gap-1.5"><Bed className="w-4 h-4"/>{property.bedrooms}</span>}
                                {property.bathrooms != null && <span className="flex items-center gap-1.5"><Bath className="w-4 h-4"/>{property.bathrooms}</span>}
                                {property.size != null && <span className="flex items-center gap-1.5"><Maximize className="w-4 h-4"/>{property.size} sqft</span>}
                            </div>
                        </div>
                    </Card>
                  ))}
              </div>
            ) : (
                 <div className="text-center text-muted-foreground mt-12 text-lg">
                    No properties found matching your criteria.
                </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      <Dialog open={!!selectedProperty} onOpenChange={(open) => !open && setSelectedProperty(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            {selectedProperty && (
                <>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{selectedProperty.title}</DialogTitle>
                     <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4 text-primary"/>
                        <span>{selectedProperty.location}</span>
                    </div>
                </DialogHeader>
                <ScrollArea className="flex-1 -mr-6 pr-6">
                    <div className="grid md:grid-cols-2 gap-6 items-start pt-4">
                        <div className="cursor-pointer" onClick={() => openImageCarousel(selectedProperty.images, 0)}>
                          <Image
                            src={selectedProperty.images[0]}
                            alt={selectedProperty.title}
                            width={600}
                            height={600}
                            className="rounded-lg object-cover aspect-square w-full"
                          />
                        </div>
                        <div>
                            {selectedProperty.price != null && (
                                <p className="text-3xl font-bold text-primary mb-4">LKR {selectedProperty.price.toLocaleString()}</p>
                            )}
                            <Badge variant="outline">{selectedProperty.category}</Badge>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground my-4">
                                {selectedProperty.bedrooms != null && <span className="flex items-center gap-1.5"><Bed className="w-5 h-5 text-primary"/> {selectedProperty.bedrooms} Beds</span>}
                                {selectedProperty.bathrooms != null && <span className="flex items-center gap-1.5"><Bath className="w-5 h-5 text-primary"/> {selectedProperty.bathrooms} Baths</span>}
                                {selectedProperty.size != null && <span className="flex items-center gap-1.5"><Maximize className="w-5 h-5 text-primary"/> {selectedProperty.size} sqft</span>}
                            </div>
                            
                            <h4 className="font-semibold mt-6 mb-2">Description</h4>
                            <ScrollArea className="h-32">
                               <p className="text-muted-foreground whitespace-pre-wrap">{selectedProperty.description}</p>
                            </ScrollArea>
                            
                            
                            {selectedProperty.contacts && selectedProperty.contacts.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold mb-3">Contact Information</h4>
                                    <div className="space-y-3">
                                        {selectedProperty.contacts.map((contact, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                <div>
                                                    <p className="font-medium text-foreground">{contact.name}</p>
                                                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                                                </div>
                                                <Button asChild variant="outline" size="sm">
                                                    <a href={`tel:${contact.phone}`}>
                                                        <Phone className="mr-2 h-4 w-4"/> Call Now
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter className="mt-auto pt-4 border-t">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Close</Button>
                    </DialogClose>
                    <Button onClick={() => alert('Contact agent functionality to be implemented')}>
                        <MessageSquare className="mr-2 h-4 w-4"/>
                        Contact Agent
                    </Button>
                </DialogFooter>
                </>
            )}
        </DialogContent>
       </Dialog>

       <ImageCarouselDialog
        open={isCarouselOpen}
        onOpenChange={setIsCarouselOpen}
        images={carouselImages}
      />
      
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>List Your Property</DialogTitle>
                <DialogDescription>
                    Fill out the form below. An agent will review your submission and get in touch via chat.
                </DialogDescription>
            </DialogHeader>
            <PropertySubmissionForm setDialogOpen={setIsSubmissionDialogOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertiesContent />
    </Suspense>
  )
}
