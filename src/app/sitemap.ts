
import { headers } from 'next/headers';
import { type MetadataRoute } from 'next';

const staticPages = [
  '/',
  '/about-us',
  '/services/construction',
  '/services/home-solutions',
  '/services/tech',
  '/projects',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const headersList = headers();
  const host = headersList.get('host') || 'bigcosta.lk';
  
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const entries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: page === '/' ? 1 : 0.8,
  }));

  return entries;
}
