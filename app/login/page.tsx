import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import GoogleLoginButton from './GoogleLoginButton';

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

        {/* Client-side OAuth trigger bypassing Chrome Safe Browsing POST form misdetection */}
        <GoogleLoginButton />

        <div style={{ marginTop: '2rem', fontSize: '0.78rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
          Allowed Access: <strong>jaeyong.hong@gmail.com</strong>, <strong>eunsun.jung@gmail.com</strong>
        </div>
      </div>
    </div>
  );
}
