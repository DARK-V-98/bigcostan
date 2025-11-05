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
            Big Costa Construction (Pvt) Ltd is Sri Lanka’s Premier and leading construction company in Sri Lanka that designs and build luxury houses, villas, hotels, apartments, and office building projects under one roof. We strive higher to deliver value-added products and cost-effective and value driven solutions to our clientele, capitalizing the core competencies of being innovative in the supply of products that’s suited for the market, understanding the need, which defines our brand. We approach business with discipline, consistency, partnerships, and transparency.
          </p>
        </div>
        <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-lg group">
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
