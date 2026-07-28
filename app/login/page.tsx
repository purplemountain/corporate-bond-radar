import { auth, signIn } from '@/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.email) {
    redirect('/');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0f19', padding: '1rem' }}>
      <div style={{ background: 'rgba(18, 26, 43, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: '#f1f5f9' }}>
          Corporate Bond Radar
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
          이 대시보드는 허가된 사용자만 접속할 수 있는 보안 터미널입니다. 구글 계정으로 로그인해 주세요.
        </p>

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.8rem 1.2rem',
              backgroundColor: '#4285F4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)'
            }}
          >
            <i className="fa-brands fa-google"></i> Google 계정으로 로그인
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.78rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
          Allowed Access: <strong>jaeyong.hong@gmail.com</strong>, <strong>eunsun.jung@gmail.com</strong>
        </div>
      </div>
    </div>
  );
}
