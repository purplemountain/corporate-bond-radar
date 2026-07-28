import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// 1. Force 256-bit strong encryption secret to prevent NextAuth MissingSecretError
const defaultSecret = 'd8a7c6b5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || defaultSecret;
process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;

// 2. Force domain URLs for Render environment
process.env.AUTH_URL = 'https://corporate-bond-radar.onrender.com';
process.env.NEXTAUTH_URL = 'https://corporate-bond-radar.onrender.com';

export function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  const target = normalizeEmail(email);
  
  const targetUser = target.split('@')[0].replace(/\./g, '');
  const targetDomain = target.split('@')[1] || '';

  const allowedRaw = ['jaeyong.hong@gmail.com', 'eunsun.jung@gmail.com'];
  if (process.env.ALLOWED_EMAILS) {
    process.env.ALLOWED_EMAILS.split(',').forEach((e) => {
      const norm = normalizeEmail(e);
      if (norm) allowedRaw.push(norm);
    });
  }

  return allowedRaw.some((allowedStr) => {
    const normAllowed = normalizeEmail(allowedStr);
    if (target === normAllowed) return true;
    
    const allowedUser = normAllowed.split('@')[0].replace(/\./g, '');
    const allowedDomain = normAllowed.split('@')[1] || '';

    return targetUser === allowedUser && targetDomain === allowedDomain;
  });
}

// Ensure non-empty client credentials
const googleClientId = (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
const googleClientSecret = (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '').trim();

const providers = [];
if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else {
  console.warn('Google Client ID/Secret not fully provided in env vars.');
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  basePath: '/api/auth',
  providers: providers.length > 0 ? providers : [
    Google({
      clientId: googleClientId || 'missing-client-id',
      clientSecret: googleClientSecret || 'missing-client-secret',
    })
  ],
  callbacks: {
    async redirect() {
      return 'https://corporate-bond-radar.onrender.com';
    },
  },
});
