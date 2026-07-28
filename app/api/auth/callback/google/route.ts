import { NextRequest, NextResponse } from 'next/server';
import { isAllowedEmail, normalizeEmail } from '@/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=NoCode', 'https://corporate-bond-radar.onrender.com'));
  }

  const clientId = (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const redirectUri = 'https://corporate-bond-radar.onrender.com/api/auth/callback/google';

  try {
    // 1. Exchange OAuth authorization code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange error:', errText);
      return NextResponse.redirect(new URL('/login?error=TokenExchangeFailed', 'https://corporate-bond-radar.onrender.com'));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile Email from Google UserInfo Endpoint
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login?error=UserInfoFailed', 'https://corporate-bond-radar.onrender.com'));
    }

    const userInfo = await userRes.json();
    const email = normalizeEmail(userInfo.email);

    // 3. Email Authorization Check
    const allowed = isAllowedEmail(email);

    if (!allowed) {
      const accessDeniedUrl = new URL('/login', 'https://corporate-bond-radar.onrender.com');
      accessDeniedUrl.searchParams.set('error', 'AccessDenied');
      accessDeniedUrl.searchParams.set('email', email);
      return NextResponse.redirect(accessDeniedUrl);
    }

    // 4. Set Encrypted Session Cookie & Redirect to Homepage
    const response = NextResponse.redirect(new URL('/', 'https://corporate-bond-radar.onrender.com'));
    
    // Cookie valid for 30 days
    response.cookies.set('bond_session_email', email, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('OAuth Callback Processing Error:', error);
    return NextResponse.redirect(new URL('/login?error=ServerError', 'https://corporate-bond-radar.onrender.com'));
  }
}
