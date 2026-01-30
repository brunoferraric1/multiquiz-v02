import React from 'react';
import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-[#3d4454]">
      <div className="container mx-auto px-8 py-12">
        {/* Main Footer */}
        <div className="flex flex-col md:flex-row md:justify-between gap-8 pt-8 border-t border-[#3d4454]">
          {/* Left - Logo & Tagline */}
          <div className="flex flex-col gap-4 max-w-[320px]">
            <h3 className="text-lg font-semibold text-[#f8fafc]">MultiQuiz</h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed">
              A plataforma mais fácil para criar quizzes que geram leads qualificados em minutos.
            </p>
          </div>

          {/* Right - Links */}
          <div className="flex gap-16">
            {/* Produto Column */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold text-[#94a3b8] tracking-wider uppercase">
                PRODUTO
              </h4>
              <Link href="#features" className="text-sm text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
                Recursos
              </Link>
              <Link href="#how-it-works" className="text-sm text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
                Como Funciona
              </Link>
              <Link href="#pricing" className="text-sm text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
                Planos
              </Link>
            </div>

            {/* Sobre Column */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold text-[#94a3b8] tracking-wider uppercase">SOBRE</h4>
              <Link href="#" className="text-sm text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
                Contato
              </Link>
              <Link href="#" className="text-sm text-[#94a3b8] hover:text-[#f8fafc] transition-colors">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom - Copyright */}
        <div className="flex justify-center pt-8 mt-8 border-t border-[#3d4454]">
          <p className="text-sm text-[#94a3b8]">
            &copy; {new Date().getFullYear()} MultiQuiz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
