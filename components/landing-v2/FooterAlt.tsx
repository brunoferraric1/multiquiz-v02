import Link from 'next/link';

const footerLinks = [
  { href: '#features', label: 'Recursos' },
  { href: '#how-it-works', label: 'Como funciona' },
  { href: '#pricing', label: 'Planos' },
  { href: '#faq', label: 'Duvidas' },
];

export const FooterAlt = () => {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <h3 className="text-lg font-semibold">MultiQuiz</h3>
          <p className="max-w-xl text-sm text-background/70">
            Construa quizzes que geram leads qualificados com contexto real para sua equipe comercial.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-5 text-sm text-background/60">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-background">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-background/50">
            &copy; {new Date().getFullYear()} MultiQuiz. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
