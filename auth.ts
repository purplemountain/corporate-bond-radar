import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
    async redirect({ url, baseUrl }) {
      // Force correct protocol and domain redirect
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    authorized({ auth, request: { nextUrl } }) {
      const path = nextUrl.pathname;
      if (path.startsWith('/login') || path.startsWith('/api/auth')) return true;
      return isAllowedEmail(auth?.user?.email);
    },
  },
});
