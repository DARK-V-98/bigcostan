
'use client';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function ServicesPage() {
  useEffect(() => {
    redirect('/services/construction');
  }, []);

  return null;
}

    