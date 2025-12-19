
'use client';

import Link from 'next/link';
import { Menu, LogOut, LayoutDashboard, ChevronDown, Sun, Moon, ChefHat, Building, Home, HardHat, MessageSquare } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/context/auth-provider';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { type HomeProductCategory } from '@/app/dashboard/homes/categories/page';
import { type PropertyCategory } from '@/app/dashboard/properties/categories/page';
import CountdownTimer from '@/components/countdown-timer';


const navItems = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about-us' },
  { name: 'Professionals', href: '/company-professionals' },
  { name: 'Projects', href: '/projects' },
];

const serviceComponents: { title: string; href: string; description: string; icon: React.ReactNode }[] = [
  {
    title: "Construction",
    href: "/services/construction",
    description: "Full-service general contracting for residential and commercial projects.",
    icon: <HardHat className="h-6 w-6 text-primary" />,
  },
  {
    title: "Home Solutions",
    href: "/services/home-solutions",
    description: "Custom pantry cupboards, kitchen designs, and interior solutions.",
    icon: <Home className="h-6 w-6 text-primary" />,
  },
  {
    title: "Real Estate",
    href: "/properties",
    description: "Browse and find your perfect property with our real estate services.",
    icon: <Building className="h-6 w-6 text-primary" />,
  },
  {
    title: "Tech & Electronics",
    href: "/services/tech",
    description: "Retail of computer components, electronics, and tech accessories.",
    icon: <ChefHat className="h-6 w-6 text-primary" />, // Re-using ChefHat, can be changed
  },
];


export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { user, role, permissions, loading, logout } = useAuth();
  const [homeCategories, setHomeCategories] = useState<HomeProductCategory[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const { theme, setTheme } = useTheme();
  const [showHolidayFeatures, setShowHolidayFeatures] = useState(false);

  useEffect(() => {
    setShowHolidayFeatures(new Date() < new Date('2026-01-01'));

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const qHome = query(collection(db, 'homeProductCategories'), orderBy('name'));
    const unsubHome = onSnapshot(qHome, (snapshot) => {
      setHomeCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeProductCategory)));
    });
    
    const qProperties = query(collection(db, 'propertyCategories'), orderBy('name'));
    const unsubProperties = onSnapshot(qProperties, (snapshot) => {
      setPropertyCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyCategory)));
    });

    return () => {
      unsubHome();
      unsubProperties();
    };
  }, []);

  const getInitials = (email: string | null | undefined) => {
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const toggleTheme = () => {
    const themes = ['default', 'theme-tech', 'theme-orange-black'];
    const currentTheme = theme === 'dark' ? 'default' : theme;
    const currentIndex = themes.indexOf(currentTheme ?? 'default');
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }
  
  const homeComponents = [
      { title: "All Products", href: "/homes", description: "Browse our full range of custom-made home products." },
      ...homeCategories.map(cat => ({ title: cat.name, href: `/homes?category=${encodeURIComponent(cat.name)}`, description: `View all ${cat.name}.`}))
  ];
  
  const propertyComponents = [
      { title: "All Properties", href: "/properties", description: "Browse our full range of property listings." },
      ...propertyCategories.map(cat => ({ title: cat.name, href: `/properties?category=${encodeURIComponent(cat.name)}`, description: `View all ${cat.name} listings.`}))
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled ? "border-b border-border bg-background" : "bg-transparent"
    )}>
       {showHolidayFeatures && (
        <div className="bg-primary text-primary-foreground text-center p-2 text-sm font-medium">
            <CountdownTimer targetDate="2026-01-01T00:00:00" />
        </div>
       )}
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 mr-2 overflow-hidden">
          <Image src="/logobc.png" alt="Big Costa Logo" width={40} height={40} className="h-10 w-10 rounded-full flex-shrink-0" />
          <span className="font-headline text-sm font-normal md:text-base text-foreground whitespace-nowrap">Big Costa Construction</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-1 text-xs font-medium">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} className="transition-colors text-muted-foreground hover:text-primary uppercase px-2 py-2 rounded-md">
              {item.name}
            </Link>
          ))}
           <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-primary uppercase focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent text-xs">Homes</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                     <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/homes"
                          >
                            <ChefHat className="h-6 w-6 text-primary" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Big Costa Homes
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Beautifully designed products for modern living.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    {homeComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-primary uppercase focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent text-xs">Properties</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                     <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/properties"
                          >
                            <Building className="h-6 w-6 text-primary" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Big Costa Properties
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Your next home, land, or investment is waiting.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    {propertyComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-muted-foreground hover:text-primary uppercase focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent text-xs">Services</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px] ">
                    {serviceComponents.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        <div className="flex gap-4 items-start">
                          <div className="mt-1">{component.icon}</div>
                          <div>
                            <div className="text-sm font-medium leading-none">{component.title}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {component.description}
                            </p>
                          </div>
                        </div>
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
           <Link href="/#contact" className="transition-colors text-muted-foreground hover:text-primary uppercase px-2 py-2 rounded-md">
              Contact
            </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <div className="hidden md:flex items-center gap-2">
            <Button asChild className="rounded-full">
              <Link href="/#contact">Contact Us</Link>
            </Button>
            {loading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL ?? ''} alt={user.email ?? ''} />
                      <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {permissions.length > 0 && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                     <DropdownMenuItem asChild>
                       <Link href="/my-chats">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>My Chats</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline">
                <Link href="/auth">Login</Link>
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col p-0">
                <SheetHeader className="p-6">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main menu for navigating the Big Costa website.
                  </SheetDescription>
                  <Link href="/" className="flex items-center gap-2 mb-6">
                      <Image src="/logobc.png" alt="Big Costa Logo" width={48} height={48} className="h-12 w-12 rounded-full" />
                      <span className="font-headline text-base font-normal">Big Costa Construction</span>
                  </Link>
                </SheetHeader>
                
                <nav className="grid gap-4 px-6">
                    {navItems.map((item) => (
                      <SheetClose key={item.name} asChild>
                          <Link href={item.href} className="text-lg font-medium transition-colors hover:text-primary uppercase">
                          {item.name}
                          </Link>
                      </SheetClose>
                    ))}
                     <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center text-lg font-medium transition-colors hover:text-primary uppercase">
                        Homes <ChevronDown className="ml-1 h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {homeComponents.map((component) => (
                           <SheetClose key={component.title} asChild>
                             <DropdownMenuItem asChild>
                               <Link href={component.href}>{component.title}</Link>
                             </DropdownMenuItem>
                           </SheetClose>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center text-lg font-medium transition-colors hover:text-primary uppercase">
                        Properties <ChevronDown className="ml-1 h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {propertyComponents.map((component) => (
                           <SheetClose key={component.title} asChild>
                             <DropdownMenuItem asChild>
                               <Link href={component.href}>{component.title}</Link>
                             </DropdownMenuItem>
                           </SheetClose>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center text-lg font-medium transition-colors hover:text-primary uppercase">
                        Services <ChevronDown className="ml-1 h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {serviceComponents.map((component) => (
                           <SheetClose key={component.title} asChild>
                             <DropdownMenuItem asChild>
                               <Link href={component.href}>{component.title}</Link>
                             </DropdownMenuItem>
                           </SheetClose>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                     <SheetClose asChild>
                        <Link href="/#contact" className="text-lg font-medium transition-colors hover:text-primary uppercase">
                        Contact
                        </Link>
                    </SheetClose>
                </nav>
                
                {/* Sheet Footer */}
                <div className="mt-auto border-t p-6 grid gap-4">
                  {loading ? (
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                  ) : user ? (
                      <>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.photoURL ?? ''} alt={user.email ?? ''} />
                                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1 overflow-hidden">
                                <p className="text-sm font-medium leading-none">My Account</p>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            </div>
                        </div>
                        {permissions.length > 0 && (
                          <SheetClose asChild>
                            <Link href="/dashboard" className={cn(buttonVariants({variant: "outline"}), "w-full justify-start")}>
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard
                            </Link>
                          </SheetClose>
                        )}
                         <SheetClose asChild>
                            <Link href="/my-chats" className={cn(buttonVariants({variant: "outline"}), "w-full justify-start")}>
                               <MessageSquare className="mr-2 h-4 w-4" />
                                My Chats
                            </Link>
                         </SheetClose>
                        <SheetClose asChild>
                            <Button onClick={logout} variant="outline" className="w-full justify-start">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </SheetClose>
                      </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button asChild className="w-full">
                          <Link href="/auth">Login / Sign Up</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild className="w-full" variant="secondary">
                          <Link href="/#contact">Contact Us</Link>
                        </Button>
                      </SheetClose>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          {children}
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
