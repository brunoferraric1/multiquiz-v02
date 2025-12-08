'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const LandingHeader = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Image
                src="/multiquiz-logo.svg"
                alt="MultiQuiz Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              MultiQuiz
            </Link>
          </div>
          <nav className="hidden md:flex md:space-x-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Por que usar
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Como funciona
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Planos
            </Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Dúvidas
            </Link>
          </nav>
          <div className="flex items-center">
            <Button asChild className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
              <Link href="/dashboard">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
