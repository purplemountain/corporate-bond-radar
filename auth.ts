import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// 1. Force robust encryption secret
const defaultSecret = 'd8a7c6b5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || defaultSecret;
process.env.NEXTAUTH_SECRET = process.env.AUTH_SECRET;

// 2. Force domain URLs
process.env.AUTH_URL = 'https://corporate-bond-radar.onrender.com';
process.env.NEXTAUTH_URL = 'https://corporate-bond-radar.onrender.com';

const googleClientId = (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
const googleClientSecret = (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '').trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async redirect({ baseUrl }) {
      return baseUrl || 'https://corporate-bond-radar.onrender.com';
    },
  },
});
