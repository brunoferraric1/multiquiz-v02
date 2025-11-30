'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
        'Priority support',
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
        delay: i * 0.2,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

export const PricingSection = () => {
    const [ref, controls] = useScrollAnimation();
  return (
    <section id="pricing" className="py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Flexible pricing for teams of all sizes
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Choose the plan that’s right for you.
          </p>
        </div>
        <motion.div 
            ref={ref}
            initial="hidden"
            animate={controls}
            className="mt-16 grid max-w-lg gap-8 mx-auto lg:max-w-none lg:grid-cols-3"
        >
          {tiers.map((tier, i) => (
            <motion.div
                key={tier.name}
                custom={i}
                variants={cardVariants}
                className={`flex flex-col rounded-2xl shadow-lg overflow-hidden ${tier.featured ? 'border-2 border-blue-500' : 'border border-gray-200'}`}
            >
              <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                <div>
                  <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-blue-100 text-blue-600">
                    {tier.name}
                  </h3>
                </div>
                <div className="mt-4 flex items-baseline text-6xl font-extrabold">
                  {tier.price}
                  <span className="ml-1 text-2xl font-medium text-gray-500">
                    {tier.frequency}
                  </span>
                </div>
                <p className="mt-5 text-lg text-gray-500">{tier.description}</p>
              </div>
              <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-base text-gray-700">{feature}</p>
                    </li>
                  ))}
                </ul>
                <div className="rounded-md shadow">
                    <Button asChild size="lg" className="w-full" variant={tier.featured ? 'default' : 'outline'}>
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
