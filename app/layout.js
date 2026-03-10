import './globals.css';

export const metadata = {
  title: 'RCX Locações e Serviços LTDA - Gestão de Frota',
  description: 'Sistema privado de gestão de frota com autenticação, RLS e trilha de auditoria completa.',
  manifest: '/manifest.json',
  themeColor: '#0b5fff',
  appleWebApp: {
    capable: true,
    title: 'RCX Frota',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
