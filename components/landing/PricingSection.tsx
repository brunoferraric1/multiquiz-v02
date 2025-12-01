'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    frequency: '/month',
    description: 'For individuals and small teams getting started.',
    features: [
        '1 User',
        'Up to 3 quizzes',
        'Basic analytics',
        'Community support',
    ],
    cta: 'Start for Free',
    href: '/dashboard',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$29',
    frequency: '/month',
    description: 'For growing teams and businesses.',
    features: [
        'Up to 10 users',
        'Unlimited quizzes',
        'Advanced analytics',
        'Custom branding',
        'Priority email support',
    ],
    cta: 'Get Started',
    href: '/dashboard',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    frequency: '',
    description: 'For large organizations with custom needs.',
    features: [
        'Unlimited users',
        'Dedicated account manager',
        'Single Sign-On (SSO)',
        'Custom integrations',
        '24/7 Phone Support',
    ],
    cta: 'Contact Sales',
    href: '#',
    featured: false,
  },
];

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

export const PricingSection = () => {
    const [ref, controls] = useScrollAnimation();
  return (
    <section id="pricing" className="py-20 bg-background sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the perfect plan for your team. Start free, upgrade anytime.
          </p>
        </div>
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            className="mt-16 grid max-w-md gap-8 mx-auto lg:max-w-none lg:grid-cols-3"
        >
          {tiers.map((tier, i) => (
            <motion.div
                key={tier.name}
                custom={i}
                variants={cardVariants}
                className={`flex flex-col rounded-3xl overflow-hidden ${tier.featured ? 'border-2 border-primary shadow-lg' : 'border border-border'}`}
            >
              <div className="px-6 py-8 bg-card sm:p-10 sm:pb-6">
                <div>
                  <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-primary/20 text-primary">
                    {tier.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline text-6xl font-extrabold text-foreground">
                  {tier.price}
                  <span className="ml-1 text-2xl font-medium text-muted-foreground">
                    {tier.frequency}
                  </span>
                </div>
                <p className="mt-5 text-lg text-muted-foreground">{tier.description}</p>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-card/50 space-y-6 sm:p-10 sm:pt-6">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <Check className="h-6 w-6 text-green-400" />
                      </div>
                      <p className="ml-3 text-base text-foreground">{feature}</p>
                    </li>
                  ))}
                </ul>
                <div className="rounded-md shadow">
                    <Button
                        asChild
                        size="lg"
                        className={`w-full font-bold ${tier.featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    >
                        <Link href={tier.href}>{tier.cta}</Link>
                    </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
