import './globals.css';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';

export const metadata = {
  title: 'SkillDNA AI — Your Living Technical Identity',
  description: 'AI-powered SaaS platform continuously creating dynamic technical profiles for software professionals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
