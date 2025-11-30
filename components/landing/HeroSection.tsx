'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const HeroSection = () => {
  return (
    <section className="relative bg-white pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
          >
            Create Engaging Quizzes in Minutes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 max-w-md mx-auto text-lg text-gray-500 sm:text-xl md:mt-8 md:max-w-3xl"
          >
            Build beautiful, interactive quizzes to engage your audience, generate leads, and assess knowledge. No coding required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10"
          >
            <div className="rounded-md shadow">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Create Your First Quiz for Free
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
        className="mt-16 md:mt-24"
      >
        <div className="relative max-w-4xl mx-auto">
          <div className="relative rounded-xl shadow-2xl bg-gray-800 p-2">
            <div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-center h-full">
                    <p className="text-white font-semibold">Visual of the product here</p>
                </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
