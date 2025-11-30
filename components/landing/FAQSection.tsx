'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';

const faqs = [
  {
    question: 'How does the AI question generation work?',
    answer: 'Our AI uses advanced language models to understand your topic and generate relevant, high-quality questions and answers, saving you hours of work.',
  },
  {
    question: 'Can I customize the look of my quizzes?',
    answer: 'Yes! With our Pro plan, you can customize colors, fonts, and layouts to match your brand. You can also add your own logo.',
  },
  {
    question: 'What kind of analytics do you provide?',
    answer: 'We provide detailed analytics on completion rates, correct answer ratios, and individual user performance. This helps you understand engagement and knowledge retention.',
  },
  {
    question: 'Can I export the quiz results?',
    answer: 'Yes, you can export quiz results as a CSV file to use in your own reporting and analysis tools.',
  },
];

const AccordionItem = ({ faq }: { faq: typeof faqs[0] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 py-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full text-lg font-medium text-left text-gray-900"
            >
                <span>{faq.question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="mt-4 text-base text-gray-500"
                    >
                       {faq.answer}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export const FAQSection = () => {
    const [ref, controls] = useScrollAnimation();

  return (
    <section id="faq" className="py-20 bg-gray-50 sm:py-32">
      <div ref={ref} className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
         initial={{ opacity: 0, y: 50 }}
         animate={controls}
         transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Have questions? We have answers. If you can’t find what you’re looking for, feel free to contact us.
          </p>
        </motion.div>
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={controls}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 max-w-3xl mx-auto">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} faq={faq} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
