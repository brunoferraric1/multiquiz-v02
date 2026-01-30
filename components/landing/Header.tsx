'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export const LandingHeader = () => {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 h-20 bg-[#1a1f2e]/80 backdrop-blur-xl border-b border-[#3d4454]"
    >
      <div className="container mx-auto px-8 h-full">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/multiquiz-logo.svg"
              alt="MultiQuiz Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-[#f8fafc] font-serif">MultiQuiz</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
              Por que usar
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
              Como funciona
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
              Planos
            </Link>
            <Link href="#faq" className="text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
              Dúvidas
            </Link>
          </nav>

          {/* CTA Button */}
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-full bg-[#fbbf24] text-[#1a1f2e] text-sm font-bold hover:bg-[#fbbf24]/90 transition-colors"
          >
            Começar Grátis
          </Link>
        </div>
      </div>
    </motion.header>
  );
};
