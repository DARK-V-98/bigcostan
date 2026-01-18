
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase-client';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ImageCarouselDialog from '@/components/image-carousel-dialog';
import { HomeProduct } from '../dashboard/homes/products/page';
import { HomeProductCategory } from '../dashboard/homes/categories/page';
import { Button } from '@/components/ui/button';

interface MediaItem {
    url: string;
    type?: 'image' | 'video';
}

function HomesContent() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [categories, setCategories] = useState<HomeProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);

  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselMedia, setCarouselMedia] = useState<MediaItem[]>([]);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<HomeProduct | null>(null);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('default');
  }, [setTheme]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category'));
  }, [searchParams]);

  const handleCategoryClick = (categoryName: string | null) => {
    setSelectedCategory(categoryName);
    const params = new URLSearchParams(window.location.search);
    if (categoryName) {
      params.set('category', categoryName);
    } else {
      params.delete('category');
    }
    router.push(`/homes?${params.toString()}`);
  };

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, 'homeProducts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeProduct)));
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchCategories = useCallback(() => {
    const q = query(collection(db, 'homeProductCategories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeProductCategory)));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubProducts = fetchProducts();
    const unsubCategories = fetchCategories();
    return () => {
      unsubProducts && unsubProducts();
      unsubCategories && unsubCategories();
    };
  }, [fetchProducts, fetchCategories]);
  
  const handleImageClick = (product: HomeProduct) => {
    setSelectedProduct(product);
  };
  
  const openImageCarousel = (images: string[], startIndex: number) => {
    setCarouselMedia(images.map(url => ({ url, type: 'image' })));
    setCarouselStartIndex(startIndex);
    setIsCarouselOpen(true);
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <section className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Our Home Products</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore our collection of custom-made home solutions.
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-2 flex-wrap">
            <Button variant={!selectedCategory ? 'default' : 'outline'} onClick={() => handleCategoryClick(null)}>
              All
            </Button>
            {categories.map(cat => (
              <Button key={cat.id} variant={selectedCategory === cat.name ? 'default' : 'outline'} onClick={() => handleCategoryClick(cat.name)}>
                {cat.name}
              </Button>
            ))}
          </div>
          
          <div className="mt-12">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Card key={index} className="overflow-hidden bg-card rounded-lg">
                            <Skeleton className="w-full h-auto aspect-square" />
                            <CardContent className="p-4">
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <Card 
                        key={product.id} 
                        className="overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 bg-card rounded-lg cursor-pointer flex flex-col"
                        onClick={() => handleImageClick(product)}
                    >
                        <CardContent className="p-0 relative">
                            <Image
                                src={product.images[0]}
                                alt={product.title}
                                width={400}
                                height={400}
                                className="w-full h-auto object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
                            />
                        </CardContent>
                        <div className="p-4 flex-grow flex flex-col">
                            <h3 className="font-semibold text-lg">{product.title}</h3>
                            {product.price != null && (
                                <p className="text-primary font-bold mt-1">LKR {product.price.toLocaleString()}</p>
                            )}
                            <div className="flex-grow mt-2">
                                <Badge variant="secondary">{product.category}</Badge>
                            </div>
                        </div>
                    </Card>
                  ))}
              </div>
            ) : (
                 <div className="text-center text-muted-foreground mt-12 text-lg">
                    No products found in this category.
                </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
       <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl">
            {selectedProduct && (
                <>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{selectedProduct.title}</DialogTitle>
                    <div className="flex gap-2 items-center">
                      <Badge variant="outline">{selectedProduct.category}</Badge>
                    </div>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6 items-start pt-4">
                    <div className="cursor-pointer" onClick={() => openImageCarousel(selectedProduct.images, 0)}>
                       <Image
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.title}
                        width={600}
                        height={600}
                        className="rounded-lg object-cover aspect-square"
                       />
                    </div>
                    <div>
                        {selectedProduct.price != null && (
                            <p className="text-3xl font-bold text-primary mb-4">LKR {selectedProduct.price.toLocaleString()}</p>
                        )}
                        <DialogDescription className="text-muted-foreground">{selectedProduct.description}</DialogDescription>
                    </div>
                </div>
                </>
            )}
        </DialogContent>
       </Dialog>

       <ImageCarouselDialog
        open={isCarouselOpen}
        onOpenChange={setIsCarouselOpen}
        media={carouselMedia}
        startIndex={carouselStartIndex}
      />
    </div>
  );
}

export default function HomesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomesContent />
    </Suspense>
  )
}
