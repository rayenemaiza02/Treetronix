import './globals.css';

export const metadata = {
  title: 'Treetronix Portal Manager',
  description: 'Plateforme SaaS intelligente de gestion et personnalisation de portails captifs Wi-Fi avec IA générative.',
  keywords: 'portail captif, Wi-Fi, SaaS, IA générative, GlobalNet, gestion réseau',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
