
import Link from 'next/link';
import { Facebook, Linkedin, Instagram } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export default function Footer() {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about-us' },
    { name: 'Projects', href: '/projects' },
    { name: 'Contact', href: '/#contact' },
  ];

  const serviceLinks = [
    { name: 'Construction', href: '/services/construction' },
    { name: 'Home Solutions', href: '/services/home-solutions' },
    { name: 'Tech & Electronics', href: '/services/tech' },
  ];

  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center md:items-start md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logobc.png" alt="Big Costa Logo" width={40} height={40} className="h-10 w-10 rounded-full" />
              <span className="font-headline text-lg font-medium text-foreground">Big Costa Construction</span>
            </Link>
            <p className="text-sm text-center md:text-left">Building your vision, from foundations to final fixtures.</p>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-semibold text-foreground">Our Divisions</h3>
            <ul className="mt-4 space-y-2 text-center md:text-left">
              {serviceLinks.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm hover:text-primary transition-colors uppercase">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-start">
             <h3 className="text-lg font-semibold text-foreground">Follow Us</h3>
             <div className="mt-4 flex justify-center md:justify-start gap-4">
               <Link href="https://www.facebook.com/bigcostaconstruction" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                 <Facebook className="h-6 w-6 hover:text-primary transition-colors" />
               </Link>
               <Link href="https://www.instagram.com/big_costa_construction" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                 <Instagram className="h-6 w-6 hover:text-primary transition-colors" />
               </Link>
                <Link href="https://www.linkedin.com/in/lakshman-de-costa-271562376" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                 <Linkedin className="h-6 w-6 hover:text-primary transition-colors" />
               </Link>
             </div>
          </div>
        </div>
        <Separator className="my-8 bg-border" />
        <div className="text-center text-sm">
          <p>© {new Date().getFullYear()} Big Costa Construction (Private) Limited. All rights reserved.</p>
          <p className="mt-2">
            Website powered by{' '}
            <a 
              href="https://www.esystemlk.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              ESYSTEMLK
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

    