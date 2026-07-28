import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

if (process.env.NODE_ENV === 'production' || !process.env.AUTH_URL) {
  process.env.AUTH_URL = 'https://corporate-bond-radar.onrender.com';
  process.env.NEXTAUTH_URL = 'https://corporate-bond-radar.onrender.com';
}

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  const target = normalizeEmail(email);
  const allowed = ['jaeyong.hong@gmail.com', 'eunsun.jung@gmail.com'];
  if (process.env.ALLOWED_EMAILS) {
    process.env.ALLOWED_EMAILS.split(',').forEach(e => {
      const norm = normalizeEmail(e);
      if (norm) allowed.push(norm);
    });
  }
  return allowed.some(a => target === a || target.includes(a));
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
      if (account?.provider !== 'google') return true;
      const email = normalizeEmail(profile?.email as string | undefined);
      // Allow allowed emails
      return isAllowedEmail(email);
    },
    async session({ session }) {
      if (session.user?.email) {
        session.user.email = normalizeEmail(session.user.email);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const liveBaseUrl = 'https://corporate-bond-radar.onrender.com';
      if (url.startsWith('/')) return `${liveBaseUrl}${url}`;
      else if (new URL(url).origin === liveBaseUrl) return url;
      return liveBaseUrl;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      if (path.startsWith('/login') || path.startsWith('/api/auth')) return true;
      return isAllowedEmail(auth?.user?.email);
    },
  },
});
