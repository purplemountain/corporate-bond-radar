import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BondSpreadDashboardClient from './BondSpreadDashboardClient';

export const revalidate = 0;

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ color: '#38BDF8', fontSize: '0.85rem', fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', padding: '0.15rem 0.6rem', borderRadius: '12px' }}>
              🔒 Protected Corporate Bond Terminal
            </span>
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BigTech Corporate Bond Spreads & US 10Y Treasury Tracker
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
            ● Live Market Data
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Sign out ({session.user.email})
            </button>
          </form>
        </div>
      </header>

      {/* Dynamic Real-time Client Dashboard Component */}
      <BondSpreadDashboardClient userEmail={session.user.email} />

      <footer style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        Authorized Access Only for {session.user.email} | Live Render Terminal
      </footer>
    </main>
  );
}
