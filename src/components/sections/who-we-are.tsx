
import Image from 'next/image';

export default function WhoWeAre() {
  return (
    <section id="who-we-are" className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">
            WHO WE ARE
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Big Costa Construction (Pvt) Ltd is Sri Lanka’s Premier and a leading construction company in Sri Lanka that designs and build luxury houses, villas, hotels, apartments, and office building projects under one roof. We strive higher to deliver value-added products and cost-effective and value driven solutions to our clientele, capitalizing the core competencies of being innovative in the supply of products that’s suited for the market, understanding the need, which defines our brand. We approach business with discipline, consistency, partnerships, and transparency.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            INTEGRITY. EXPERTISE. LEADERSHIP. Our expertise in estimating, construction, project management and reconstruction services ensures that our customers receive a quality product at a fair price and in a reasonable time frame. This is accomplished through the selective use of responsible subcontractors, hiring and retaining first class employees, and working for clients that share a belief in open, honest, and direct communication.
          </p>
        </div>
        <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-lg group backdrop-blur-sm">
          <Image
            src="/fg.jpg"
            alt="A showcase of Big Costa Construction's work"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="construction architecture"
          />
        </div>
      </div>
    </section>
  );
}
