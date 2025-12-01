'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const CTASection = () => {
    const [ref, controls] = useScrollAnimation();

  return (
    <section className="bg-background py-20 sm:py-32">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="container mx-auto px-4"
      >
        <div className="relative rounded-3xl bg-card py-16 text-center shadow-lg">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Ready to create amazing quizzes?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators and start building engaging, intelligent quizzes today.
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 rounded-full px-8 py-3 text-lg">
              <Link href="/dashboard">
                Sign Up for Free
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
