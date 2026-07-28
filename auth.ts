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
  
  // Clean dots for gmail matching if applicable
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
    
    // Check clean user matching for gmail
    const allowedUser = normAllowed.split('@')[0].replace(/\./g, '');
    const allowedDomain = normAllowed.split('@')[1] || '';

    return targetUser === allowedUser && targetDomain === allowedDomain;
  });
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
      if (account?.provider === 'google') {
        const email = normalizeEmail(profile?.email as string | undefined);
        return isAllowedEmail(email);
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.email) {
        token.email = normalizeEmail(profile.email as string);
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email) {
        if (!session.user) session.user = { email: token.email, id: token.sub || '' };
        else session.user.email = token.email as string;
      }
      return session;
    },
    async redirect({ url }) {
      const liveBaseUrl = 'https://corporate-bond-radar.onrender.com';
      if (url.startsWith('/')) return `${liveBaseUrl}${url}`;
      else if (url.includes('corporate-bond-radar.onrender.com')) return url;
      return liveBaseUrl;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      if (path.startsWith('/login') || path.startsWith('/api/auth')) return true;
      const userEmail = auth?.user?.email;
      return Boolean(userEmail && isAllowedEmail(userEmail));
    },
  },
});
