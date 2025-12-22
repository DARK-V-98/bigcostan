
'use client';

import { User, Shield, Briefcase, DraftingCompass, Cpu } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Metadata } from 'next';
import AnimateOnScroll from '@/components/layout/animate-on-scroll';


const professionals = [
    {
        name: 'Lakshman De Costa',
        title: 'Founder/Chairman',
        icon: <User className="h-10 w-10 text-primary" />,
        description: "Leading the company with a vision for excellence and a commitment to quality across all divisions. With decades of experience in the industry, the Chairman guides the strategic direction of Big Costa, ensuring sustainable growth and client satisfaction.",
        qualifications: [],
        imageUrl: "/cer.png",
        imgHint: "portrait man"
    },
    {
        name: 'Marie Shermila',
        title: 'Chief Operating Officer',
        icon: <Briefcase className="h-10 w-10 text-primary" />,
        description: "As Chief Operating Officer, Marie Shermila oversees the company's daily operations and ensures that business strategies are executed efficiently. Her extensive management qualifications contribute to our operational excellence and strategic growth.",
        qualifications: [
            "MBA (Aus)",
            "MBA (SZ)",
            "MABE (UK)",
            "AA (US)",
            "DBA (MY) Reading"
        ],
        imageUrl: "/ma.jpg",
        imgHint: "portrait woman business"
    },
    {
        name: 'Vishwa Vidarshana',
        title: 'Chief Technology Officer',
        icon: <Cpu className="h-10 w-10 text-primary" />,
        description: "Leads the company’s technology direction by managing systems, platforms, and security. Aligns technical solutions with business objectives and long-term growth.",
        qualifications: [
            "BSc (Hons) in Computer Science – UCSC",
            "Oracle Database Management Certification",
            "Ethical Hacking & Cyber Security Certification"
        ],
        imageUrl: "/va.jpg",
        imgHint: "portrait man tech"
    },
    {
        name: 'Lahiruka Vindani Weeraratne',
        title: 'Corporate Company Secretary',
        icon: <Shield className="h-10 w-10 text-primary" />,
        description: "Attorney-at-Law | Company Secretary. Lahiruka is a qualified legal professional and certified company secretary with expertise in corporate governance, compliance, and human resource management. She holds an LL.B. from KDU, a Chartered Qualification in Human Resource Management, and a Master’s degree (MSc) in Human Resource Management (UK). She ensures the company’s legal and regulatory responsibilities are met with precision and integrity.",
        qualifications: [
            "LL.B. from KDU",
            "Chartered Qualification in Human Resource Management",
            "Master’s degree (MSc) in Human Resource Management (UK)"
        ],
        imageUrl: "/la.jpg",
        imgHint: "portrait woman professional"
    },
    {
        name: 'Chinthaka Kanchana Nikapitiya',
        title: 'Consultant Architect',
        icon: <DraftingCompass className="h-10 w-10 text-primary" />,
        description: "Architect (AIA - SL) | Associate Member of SLIA. Chinthaka is a registered architect with over 18 years of experience in architectural design and construction. He holds a B.Sc. in Built Environment and an M.Sc. in Architecture, and is an Associate Member of the Sri Lanka Institute of Architects (SLIA). His work combines creative vision with technical excellence across residential, commercial, and public sector projects.",
        qualifications: [
            "B.Sc. in Built Environment",
            "M.Sc. in Architecture",
            "Associate Member of the Sri Lanka Institute of Architects (SLIA)"
        ],
        imageUrl: "/ca.jpg",
        imgHint: "portrait man architect"
    },
    {
        name: 'Chandra Kumara',
        title: 'Consultant Auditor',
        icon: <Shield className="h-10 w-10 text-primary" />,
        description: "As the Managing Partner of NHK Associates (Chartered Accountants), he provides professional Statutory and Management Auditing services, along with Tax Consultancy and Advisory services.",
        qualifications: [
            "FCA",
            "MBA-USQ",
            "ACMA",
            "MCPM",
            "QB Qualified Pro Advisor"
        ],
        imageUrl: "/nhk.png",
        imgHint: "portrait man auditor"
    },
];

export default function CompanyProfessionalsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <section className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary">Our Professionals</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Meet the experienced and dedicated team driving the success of Big Costa.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {professionals.map((prof, index) => (
                <AnimateOnScroll key={index} animationClasses="animate-in fade-in zoom-in-95 duration-500" className="h-full">
                    <Card className="h-full flex flex-col text-center rounded-2xl bg-card/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                        <CardHeader className="items-center">
                            <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20">
                                <Image
                                    src={prof.imageUrl}
                                    alt={`Photo of ${prof.name}`}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={prof.imgHint}
                                />
                            </div>
                            <CardTitle className="font-headline mt-4 text-2xl">{prof.name}</CardTitle>
                            <CardDescription className="text-primary font-semibold">{prof.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col">
                            <p className="text-muted-foreground text-sm">{prof.description}</p>
                            {prof.qualifications.length > 0 && (
                                <div className="mt-4 text-left">
                                    <h4 className="font-semibold text-foreground">Key Qualifications:</h4>
                                    <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground space-y-1">
                                        {prof.qualifications.map((q, i) => <li key={i}>{q}</li>)}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </AnimateOnScroll>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
