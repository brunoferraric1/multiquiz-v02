'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '#features', label: 'Recursos' },
  { href: '#how-it-works', label: 'Como funciona' },
  { href: '#pricing', label: 'Planos' },
  { href: '#faq', label: 'Duvidas' },
];

export const HeaderCentered = () => {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-border bg-foreground/90 text-background backdrop-blur-lg"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 py-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-background">
            <Image
              src="/multiquiz-logo.svg"
              alt="MultiQuiz Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            MultiQuiz
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-background/70">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-background"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button asChild size="lg" className="h-11 px-7 text-sm font-semibold">
            <Link href="/dashboard">Comecar gratis</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
};
