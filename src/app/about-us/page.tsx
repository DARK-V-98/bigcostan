
'use client';

import { useState } from 'react';
import { Target, Eye, Download, FileText, Handshake, PlayCircle, Sofa } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function AboutUsPage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <section id="about-us" className="container mx-auto px-4">

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">About Big Costa</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Building the future with quality, honesty, and new ideas across multiple industries.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-lg group">
                <Image
                    src="/cs.jpg"
                    alt="Our team at a construction site"
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="team construction"
                />
            </div>
            <div className="space-y-4">
                <h2 className="font-headline text-3xl font-bold">Our Story</h2>
                <p className="text-muted-foreground">
                    Big Costa started with a foundation in construction, built on hard work and a focus on client happiness. We grew from a small contractor to a top name in the field. Our story shows our dedication to doing great work. With a skilled team, we build strong relationships, not just buildings.
                </p>
                <p className="text-muted-foreground">
                    Today, Big Costa has expanded its vision. While construction remains our cornerstone, we've branched into home solutions and technology, bringing the same commitment to quality and innovation to new markets. We work on many projects, from homes to large commercial buildings, custom interiors, and technology retail.
                </p>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <Card className="inline-block bg-card/50 rounded-2xl p-8">
              <CardHeader className="p-0">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="font-headline text-3xl mt-4">Our Company Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <p className="text-muted-foreground mb-6">
                  Get an in-depth look at our work, capabilities, and company history.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="rounded-full">
                    <a href="/pro.pdf" target="_blank" rel="noopener noreferrer">
                      <Eye className="mr-2" />
                      View Profile
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <a href="/pro.pdf" download="Big_Costa_Construction_Profile.pdf">
                      <Download className="mr-2" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-24 text-center">
            <Card className="inline-block bg-card/50 rounded-2xl p-8">
              <CardHeader className="p-0">
                <Handshake className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="font-headline text-3xl mt-4">International Business Ventured Partner</CardTitle>
                <p className="mt-2 text-lg text-muted-foreground font-semibold">
                    ANHUI FUHUANG ENGINEERING SCI.AND TECH
                </p>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <p className="text-muted-foreground mb-6">
                  View the profile of our esteemed international partner.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="rounded-full">
                    <a href="/tp.pdf" target="_blank" rel="noopener noreferrer">
                      <Eye className="mr-2" />
                      View Profile
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <a href="/tp.pdf" download="ANHUI_FUHUANG_Profile.pdf">
                      <Download className="mr-2" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <section id="partner-video" className="mt-24">
            <div className="relative rounded-3xl overflow-hidden w-full h-[50vh] md:h-[70vh]">
              <video
                src="/vid.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-start justify-end p-8">
                <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="rounded-full text-white border-white hover:bg-white hover:text-black">
                      <PlayCircle className="mr-2" />
                      Watch Full Video
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 bg-black border-0">
                    <DialogHeader>
                      <DialogTitle className="sr-only">Partnership Video</DialogTitle>
                      <DialogDescription className="sr-only">A video showcasing our international business partnership.</DialogDescription>
                    </DialogHeader>
                    <video src="/vid.mp4" controls autoPlay className="w-full rounded-lg" />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </section>

          <section id="interior-partner" className="mt-24">
            <Card className="bg-card/50 rounded-2xl p-8 w-full text-center">
              <CardHeader className="p-0">
                <Sofa className="h-12 w-12 mx-auto text-primary" />
                <CardTitle className="font-headline text-3xl mt-4">Interior Supplier Partner: Rebon</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-4">
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  We partner with Rebon to bring you the best in modern interior design, materials, and craftsmanship.
                </p>
                <div className="aspect-video w-full max-w-4xl mx-auto mt-8 rounded-2xl overflow-hidden shadow-lg">
                    <iframe 
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/MORpHqaswRo" 
                        title="YouTube video player for Rebon" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen>
                    </iframe>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-2xl bg-card/50">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Target className="h-10 w-10 text-primary" />
                    <CardTitle className="font-headline">Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Our mission is to deliver exceptional projects and products on time and on budget. We have motivated and focused teams across all our divisions. We value our relationships and operate with fairness and honesty.
                    </p>
                </CardContent>
            </Card>
            <Card className="rounded-2xl bg-card/50">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Eye className="h-10 w-10 text-primary" />
                    <CardTitle className="font-headline">Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Our vision is to be the most trusted and diversified group in the region, known for great work, market leadership, and a commitment to helping our communities thrive.
                    </p>
                </CardContent>
            </Card>
          </div>

          <section id="director-message" className="mt-24">
            <div className="rounded-3xl bg-gradient-to-br from-secondary to-background p-8 md:p-12 lg:p-20">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold">The Chairman's Message</h2>
                </div>
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4 text-secondary-foreground">
                        <p>
                            We are proud to be a leading company in construction, engineering, and building materials. We are known for our skill, competitive prices, and on-time delivery. We follow high quality and safety standards. We have a long history of making our clients happy with good management and great work. We continue to do this.
                        </p>
                        <p>
                            We grew from a small contractor to a large, respected firm. This is because of hard work and our commitment to making customers happy. Our company is built on ethics, professionalism, commitment, and quality. We have worked on industrial, infrastructure, and housing projects. Our success comes from our great team and our focus on client happiness.
                        </p>
                        <p>
                           Our goal is to grow and get more business. With our dedicated staff and modern management, we can achieve this. We are proud of our employees. Their hard work and loyalty make Big Costa a strong company.
                        </p>
                    </div>
                    <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-lg group">
                        <Image
                            src="/cer.png"
                            alt="Big Costa Construction Certifications"
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                </div>
            </div>
           </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
