
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  company?: string;
  avatar: string | null;
  userId: string;
}

const testimonialSchema = z.object({
  quote: z.string().min(10, { message: 'Please share a bit more about your experience.' }).max(500),
  title: z.string().min(2, { message: 'Please enter your role or title.' }).max(50),
  company: z.string().max(50).optional(),
});

export default function Testimonials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testimonials, setTestimonials] = React.useState<Testimonial[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      quote: '',
      title: '',
      company: '',
    },
  });

  React.useEffect(() => {
    const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const testimonialsData: Testimonial[] = [];
      querySnapshot.forEach((doc) => {
        testimonialsData.push({ id: doc.id, ...doc.data() } as Testimonial);
      });
      setTestimonials(testimonialsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching testimonials: ", error);
      toast({ title: 'Error', description: 'Could not fetch testimonials.', variant: 'destructive' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddTestimonial = async (values: z.infer<typeof testimonialSchema>) => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to leave a testimonial.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        ...values,
        name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        avatar: user.photoURL,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Thank You!', description: 'Your testimonial has been submitted successfully.' });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding testimonial: ", error);
      toast({ title: 'Submission Failed', description: 'Could not submit your testimonial. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userHasTestimonial = React.useMemo(() => {
    if (!user) return false;
    return testimonials.some(t => t.userId === user.uid);
  }, [user, testimonials]);
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <section id="testimonials" className="container mx-auto px-4">
      <div className="rounded-3xl bg-gradient-to-br from-background to-secondary p-8 md:p-12 lg:p-20 backdrop-blur-sm">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold">What Our Clients Say</h2>
          <p className="mt-4 text-lg text-foreground">
            We are proud of our work. Hear from our happy clients.
          </p>
        </div>
        <div className="mt-12 max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: 'start',
            }}
            className="w-full"
          >
            <CarouselContent>
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-4 h-full">
                       <Card className="h-full flex flex-col justify-between shadow-lg rounded-2xl bg-card">
                         <CardContent className="p-6 flex-grow">
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-5/6 mb-2" />
                            <Skeleton className="h-4 w-3/4" />
                         </CardContent>
                         <div className="p-6 bg-muted flex items-center gap-4 rounded-b-2xl">
                           <Skeleton className="h-12 w-12 rounded-full" />
                           <div className="w-full">
                             <Skeleton className="h-4 w-2/3 mb-2" />
                             <Skeleton className="h-3 w-1/3" />
                           </div>
                         </div>
                       </Card>
                    </div>
                  </CarouselItem>
                ))
              ) : testimonials.length > 0 ? (
                testimonials.map((testimonial) => (
                  <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-4 h-full">
                      <Card className="h-full flex flex-col justify-between shadow-lg rounded-2xl transition-shadow duration-300 hover:shadow-xl bg-card backdrop-blur-sm">
                        <CardContent className="p-6 flex-grow">
                          <blockquote className="italic text-card-foreground border-l-4 border-primary pl-4">
                            "{testimonial.quote}"
                          </blockquote>
                        </CardContent>
                        <div className="p-6 bg-muted flex items-center gap-4 rounded-b-2xl">
                          <Avatar className="h-12 w-12">
                            {testimonial.avatar && <AvatarImage src={testimonial.avatar} alt={testimonial.name} />}
                            <AvatarFallback>{getInitials(testimonial.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-foreground">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.title}{testimonial.company && `, ${testimonial.company}`}</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                <div className="w-full text-center col-span-full py-10">
                   <p className="text-foreground">No testimonials yet. Be the first to share yours!</p>
                </div>
              )}
            </CarouselContent>
            {testimonials.length > 3 && (
                <>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                </>
            )}
          </Carousel>
        </div>

        {user && !loading && !userHasTestimonial && (
           <div className="mt-12 text-center">
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="text-foreground border-foreground hover:bg-foreground hover:text-background">
                        Share Your Experience
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Add Your Testimonial</DialogTitle>
                        <DialogDescription>
                           We would love to hear about your experience with us.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAddTestimonial)} className="space-y-4 pt-4">
                             <FormField
                                control={form.control}
                                name="quote"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Thoughts</FormLabel>
                                    <FormControl>
                                    <Textarea
                                        placeholder="They did an amazing job..."
                                        className="min-h-[120px]"
                                        {...field}
                                        disabled={isSubmitting}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Role / Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Homeowner, CEO" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Tech Innovations Inc." {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
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
                                    Submit Testimonial
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
             </Dialog>
           </div>
        )}
      </div>
    </section>
  );
}
