
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, type Permission } from '@/context/auth-provider';
import Footer from '@/components/layout/footer';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from 'lucide-react';

type NavItem = {
    name: string;
    href: string;
    permission: Permission;
};

type DropdownNavItem = {
    name: string;
    items: { name: string; href: string }[];
    permission: Permission;
    pathPrefixes: string[];
};

const mainNavItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', permission: 'overview' },
    { name: 'Manage Roles', href: '/dashboard/roles', permission: 'roles' },
    { name: 'Contact Messages', href: '/dashboard/messages', permission: 'messages' },
    { name: 'Manage Events', href: '/dashboard/events', permission: 'events' },
    { name: 'Property Submissions', href: '/dashboard/submissions', permission: 'submissions' },
];

const dropdownNavs: DropdownNavItem[] = [
    {
        name: 'Projects',
        permission: 'projects',
        pathPrefixes: ['/dashboard/categories', '/dashboard/upload', '/dashboard/manage-projects'],
        items: [
            { name: 'Manage Categories', href: '/dashboard/categories' },
            { name: 'Upload Projects', href: '/dashboard/upload' },
            { name: 'Manage Projects', href: '/dashboard/manage-projects' },
        ],
    },
    {
        name: 'Homes',
        permission: 'homes',
        pathPrefixes: ['/dashboard/homes'],
        items: [
            { name: 'Manage Categories', href: '/dashboard/homes/categories' },
            { name: 'Manage Products', href: '/dashboard/homes/products' },
            { name: 'Manage Pantry Designs', href: '/dashboard/homes/pantry-designs' },
        ],
    },
    {
        name: 'Properties',
        permission: 'properties',
        pathPrefixes: ['/dashboard/properties'],
        items: [
            { name: 'Manage Categories', href: '/dashboard/properties/categories' },
            { name: 'Manage Properties', href: '/dashboard/properties' },
        ],
    }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role, permissions, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hasAccess = !loading && user && permissions.length > 0;

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-24 w-24 rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    router.replace('/');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
          <Button asChild className="mt-4">
              <Link href="/">Return to Homepage</Link>
          </Button>
      </div>
    );
  }

  const userCanSee = (permission: Permission) => permissions.includes(permission);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-headline">Dashboard</h1>
          <nav className="mt-6 border-b">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto -mb-px">
               {mainNavItems.filter(item => userCanSee(item.permission)).map((item) => (
                 <Link 
                    key={item.name} 
                    href={item.href} 
                    className={cn(
                        "py-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base",
                        pathname === item.href ? 'text-primary border-primary' : 'text-muted-foreground hover:text-primary border-transparent'
                    )}
                >
                  {item.name}
                </Link>
               ))}
               {dropdownNavs.filter(nav => userCanSee(nav.permission)).map(nav => (
                <DropdownMenu key={nav.name}>
                    <DropdownMenuTrigger className={cn("py-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex items-center gap-1",
                        nav.pathPrefixes.some(p => pathname.startsWith(p)) ? 'text-primary border-primary' : 'text-muted-foreground hover:text-primary border-transparent'
                    )}>
                        {nav.name} <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {nav.items.map(item => (
                            <DropdownMenuItem key={item.name} asChild>
                                <Link href={item.href}>{item.name}</Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
               ))}
            </div>
          </nav>
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}
