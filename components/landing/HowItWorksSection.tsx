'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation } from '@/lib/hooks/use-scroll-animation';
import { MessageSquare, Settings2, Share2 } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: 'Descreva seu quiz',
        description: 'Converse com a IA sobre o que você quer criar. Ela entende o contexto e monta a estrutura completa para você.',
        icon: <MessageSquare className="w-6 h-6 text-primary" />,
        videoPlaceholder: 'bg-blue-50/50',
    },
    {
        id: 2,
        title: 'Edite e personalize',
        description: 'Veja a estrutura surgir em tempo real. Ajuste perguntas, defina resultados e personalize o design com sua marca.',
        icon: <Settings2 className="w-6 h-6 text-primary" />,
        videoPlaceholder: 'bg-purple-50/50',
    },
    {
        id: 3,
        title: 'Publique e capture leads',
        description: 'Compartilhe o link do seu quiz. Cada pessoa que completa o quiz se torna um lead qualificado no seu painel.',
        icon: <Share2 className="w-6 h-6 text-primary" />,
        videoPlaceholder: 'bg-green-50/50',
    },
];

const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }
    }
};

export const HowItWorksSection = () => {
    const [ref, controls] = useScrollAnimation();

    return (
        <section id="how-it-works" className="py-24 bg-background overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                        Como funciona
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Transforme sua ideia em uma máquina de gerar leads em três passos simples.
                    </p>
                </div>

                <div ref={ref} className="space-y-24">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial="hidden"
                            animate={controls}
                            variants={itemVariants}
                            custom={index}
                            className={`flex flex-col gap-8 md:gap-16 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'
                                }`}
                        >
                            {/* Text Content */}
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                                    {step.icon}
                                </div>
                                <h3 className="text-2xl font-bold">{step.title}</h3>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {step.description}
                                </p>
                            </div>

                            {/* Visual/Video Placeholder */}
                            <div className="flex-1 w-full relative group">
                                <div className={`absolute -inset-4 rounded-3xl opacity-20 blur-2xl transition-opacity group-hover:opacity-30 ${step.videoPlaceholder}`} />
                                <div className="relative aspect-video rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-card/50 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                        <span className="text-2xl">🎥</span>
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Video Placeholder: {step.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground/70 mt-2">
                                        (Video showing: {step.description})
                                    </span>
                                    {/* 
                      TODO: Add video element here when files are ready
                      <video 
                        src={`/videos/step-${step.id}.mp4`}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        className="w-full h-full object-cover absolute inset-0"
                      /> 
                    */}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
