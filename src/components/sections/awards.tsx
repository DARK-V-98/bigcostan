'use client';

import { Download, Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Awards() {
  return (
    <section id="awards" className="container mx-auto px-4">
      <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 md:p-12 lg:p-16 border border-primary/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              Quality Assured
            </div>
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              ISO 9001:2015 <br />
              <span className="text-primary">Certified Quality Management</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Big Costa Construction (Private) Limited is proud to be ISO 9001:2015 certified for Building Construction Works. This international standard reflects our commitment to consistently providing services that meet customer and regulatory requirements.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
               <Button asChild size="lg" className="rounded-full">
                  <a href="/iso-2015.pdf" target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-5 w-5" />
                    View Certificate
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-primary/50 hover:bg-primary/10">
                  <a href="/iso-2015.pdf" download="Big_Costa_ISO_9001_2015.pdf">
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                  </a>
                </Button>
            </div>
          </div>
          <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
             <div className="relative bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
                <Image 
                   src="https://picsum.photos/seed/iso/800/1000"
                   alt="ISO 9001:2015 Certificate"
                   width={800}
                   height={1000}
                   className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                   data-ai-hint="quality certificate"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                   <div className="text-white">
                      <p className="text-sm font-bold uppercase tracking-widest text-primary">Certified</p>
                      <h3 className="text-2xl font-bold mt-1">ISO 9001:2015</h3>
                      <p className="text-neutral-200 text-sm mt-1">Reg No: 177993</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
