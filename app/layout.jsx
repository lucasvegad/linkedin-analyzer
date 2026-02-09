import './globals.css';

export const metadata = {
  title: 'LinkedIn Trend Analyzer | Lucas Vega',
  description: 'Analiza tendencias LegalTech y genera contenido LinkedIn con IA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
