import React from 'react';
import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mt-8 border-t border-border pt-8 md:flex md:items-center md:justify-between">
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-semibold text-foreground">MultiQuiz</h3>
            <p className="text-muted-foreground max-w-xs">A plataforma mais fácil para criar quizzes que geram leads qualificados em minutos.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mt-8 md:mt-0">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Produto</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="#features" className="text-base text-muted-foreground hover:text-foreground">Recursos</Link></li>
                <li><Link href="#how-it-works" className="text-base text-muted-foreground hover:text-foreground">Como Funciona</Link></li>
                <li><Link href="#pricing" className="text-base text-muted-foreground hover:text-foreground">Planos</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Sobre</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="#" className="text-base text-muted-foreground hover:text-foreground">Contato</Link></li>
                <li><Link href="#" className="text-base text-muted-foreground hover:text-foreground">Termos de Uso</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MultiQuiz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
