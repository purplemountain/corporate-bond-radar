import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import GoogleLoginButton from './GoogleLoginButton';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

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
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          보안 터미널입니다. 구글 계정으로 로그인해 주세요.
        </p>

        {params?.error === 'AccessDenied' && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            접근 권한 거부: 허가된 구글 계정으로 다시 로그인해 주세요.
          </div>
        )}

        {params?.error && params.error !== 'AccessDenied' && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#FCD34D', padding: '0.75rem', borderRadius: '10px', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            로그인 상태: 구글 로그인 버튼을 눌러주세요. ({params.error})
          </div>
        )}

        <GoogleLoginButton />
      </div>
    </div>
  );
}
