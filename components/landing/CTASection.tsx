'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const CTASection = () => {
    const [ref, controls] = useScrollAnimation();

  return (
    <section className="bg-white">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="relative rounded-2xl bg-gray-800 py-16 text-center shadow-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to create amazing quizzes?
          </h2>
          <p className="mt-6 text-lg text-gray-300">
            Join thousands of creators and start building engaging quizzes today.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
                <Button asChild size="lg">
                    <Link href="/dashboard">
                        Sign Up for Free
                    </Link>
                </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
