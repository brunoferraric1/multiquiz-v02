'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import Image from 'next/image';

const features = [
  {
    name: 'AI-Powered Question Generation',
    description: 'Leverage AI to generate engaging and relevant questions for your quizzes in seconds. Save time and create better quizzes.',
    icon: '/window.svg',
  },
  {
    name: 'Customizable Quiz Design',
    description: 'Match your brand with customizable themes, colors, and layouts. Create a seamless experience for your audience.',
    icon: '/file.svg',
  },
  {
    name: 'Detailed Analytics',
    description: 'Track performance with detailed analytics. Understand your audience better and make data-driven decisions.',
    icon: '/globe.svg',
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

export const FeaturesSection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section id="features" className="py-20 bg-gray-50 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Everything you need to create amazing quizzes
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Powerful features to help you create, share, and analyze quizzes.
          </p>
        </div>
        <div className="mt-16">
          <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.name}
                custom={i}
                variants={cardVariants}
                className="flex flex-col p-8 bg-white rounded-2xl shadow-lg"
              >
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500 text-white">
                  <Image src={feature.icon} alt={feature.name} width={24} height={24} />
                </div>
                <h3 className="mt-6 text-xl font-bold text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-base text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
