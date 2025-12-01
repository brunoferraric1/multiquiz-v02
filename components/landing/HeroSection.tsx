'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const QuizBuilderVisual = () => (
    <div className="relative rounded-xl bg-card/50 p-2 shadow-2xl">
        <div className="aspect-w-16 aspect-h-9 rounded-lg bg-background p-4">
            <div className="flex space-x-4 h-full">
                <div className="w-2/3 bg-background rounded-md p-4 flex flex-col">
                    <div className="flex-grow">
                        <p className="font-mono text-sm text-green-400">Ok, Bruno! Tudo confirmado.</p>
                        <p className="font-mono text-xs text-muted-foreground mt-2">Agora, vamos finalizar a estrutura do quiz com as informações que definimos:</p>
                        <div className="mt-4 space-y-2 text-xs">
                            <p className="text-foreground truncate"> Título: Desvende os Segredos dos Bancos de Dados...</p>
                            <p className="text-foreground truncate"> Descrição: Curioso sobre bancos de dados? ...</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="flex-grow h-10 bg-card rounded-md"></div>
                        <div className="w-10 h-10 bg-primary rounded-md"></div>
                    </div>
                </div>
                <div className="w-1/3 bg-background rounded-md p-4 space-y-3">
                    <p className="text-xs font-bold text-foreground">Estrutura do Quiz</p>
                    <div className="h-16 bg-card rounded-md opacity-50"></div>
                    <div className="h-10 bg-card rounded-md opacity-50"></div>
                    <div className="h-10 bg-card rounded-md opacity-50"></div>
                    <div className="h-10 bg-card rounded-md opacity-50"></div>
                </div>
            </div>
        </div>
    </div>
)

export const HeroSection = () => {
  return (
    <section className="relative bg-background pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-7xl"
          >
            Create Intelligent Quizzes in Minutes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 max-w-md mx-auto text-lg text-muted-foreground sm:text-xl md:mt-8 md:max-w-3xl"
          >
            Leverage AI to build beautiful, interactive quizzes that engage your audience and capture valuable leads. No coding required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10"
          >
            <Button asChild size="lg" className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 rounded-full px-8 py-3 text-lg">
              <Link href="/dashboard">
                Create Your First Quiz
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16 md:mt-24 relative z-10"
      >
        <div className="relative max-w-5xl mx-auto px-4">
            <QuizBuilderVisual />
        </div>
      </motion.div>
    </section>
  );
};

