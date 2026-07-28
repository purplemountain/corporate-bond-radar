'use client';

import { signIn } from 'next-auth/react';

export default function GoogleLoginButton() {
  return (
    <button
      type="button"
      onClick={() => signIn('google', { callbackUrl: '/' })}
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
  );
}
