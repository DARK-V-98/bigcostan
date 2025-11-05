
import { type MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: ['https://bigcosta.lk/sitemap.xml', 'https://www.bigcosta.com/sitemap.xml'],
  }
}
