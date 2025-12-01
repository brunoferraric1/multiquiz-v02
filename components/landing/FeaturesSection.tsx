'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { BrainCircuit, Palette, BarChart3 } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Question Generation',
    description: 'Leverage AI to generate engaging and relevant questions for your quizzes in seconds. Save time and create better quizzes.',
    icon: <BrainCircuit size={28} className="text-primary" />,
  },
  {
    name: 'Customizable Quiz Design',
    description: 'Match your brand with customizable themes, colors, and layouts. Create a seamless experience for your audience.',
    icon: <Palette size={28} className="text-primary" />,
  },
  {
    name: 'Detailed Analytics',
    description: 'Track performance with detailed analytics. Understand your audience better and make data-driven decisions.',
    icon: <BarChart3 size={28} className="text-primary" />,
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

export const FeaturesSection = () => {
  const [ref, controls] = useScrollAnimation();

  return (
    <section id="features" className="py-20 bg-background sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-5xl">
            Everything you need, and then some.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features to help you create, share, and analyze quizzes that not only engage but also convert.
          </p>
        </div>
        <div className="mt-20">
          <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            className="grid gap-8 md:grid-cols-3"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.name}
                custom={i}
                variants={cardVariants}
                className="flex flex-col text-center p-8 bg-card rounded-3xl"
              >
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-background mx-auto">
                  {feature.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold text-foreground">{feature.name}</h3>
                <p className="mt-2 text-base text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
