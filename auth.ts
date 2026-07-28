import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Force environment base URLs to eliminate localhost:10000 fallback permanently
if (process.env.NODE_ENV === 'production' || !process.env.AUTH_URL) {
  process.env.AUTH_URL = 'https://corporate-bond-radar.onrender.com';
  process.env.NEXTAUTH_URL = 'https://corporate-bond-radar.onrender.com';
}

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export function allowedEmailSet() {
  const envEmails = process.env.ALLOWED_EMAILS || 'jaeyong.hong@gmail.com,eunsun.jung@gmail.com';
  return new Set(
    envEmails
      .split(',')
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

export function isAllowedEmail(email?: string | null) {
  const allowed = allowedEmailSet();
  return allowed.size > 0 && allowed.has(normalizeEmail(email));
}

const googleClientId = (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
const googleClientSecret = (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '').trim();
const authSecret = (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'super-secret-bond-radar-key-2026-auth').trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  basePath: '/api/auth',
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return false;
      const email = normalizeEmail(profile?.email as string | undefined);
      const emailVerified = Boolean((profile as { email_verified?: boolean })?.email_verified);
      return emailVerified && isAllowedEmail(email);
    },
    async session({ session }) {
      if (session.user?.email) {
        session.user.email = normalizeEmail(session.user.email);
      }
      return session;
    },
    async redirect({ url }) {
      const targetDomain = 'https://corporate-bond-radar.onrender.com';
      if (url.startsWith('/')) {
        return `${targetDomain}${url}`;
      }
      return targetDomain;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      if (path.startsWith('/login') || path.startsWith('/api/auth')) return true;
      return isAllowedEmail(auth?.user?.email);
    },
  },
});
