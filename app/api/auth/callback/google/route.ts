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
      const errJson = await tokenRes.json().catch(() => ({}));
      const detail = errJson.error_description || errJson.error || 'SecretMismatch';
      console.error('Google token exchange error:', detail);
      return NextResponse.redirect(new URL(`/login?error=TokenExchangeFailed_${detail}`, 'https://corporate-bond-radar.onrender.com'));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    let userEmailRaw = '';

    // Method 1: Decode ID Token (JWT) directly - 100% reliable as Google includes email in standard ID Token
    if (idToken) {
      try {
        const payloadBase64 = idToken.split('.')[1];
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        if (decoded && decoded.email) {
          userEmailRaw = decoded.email;
        }
      } catch (e) {
        console.warn('ID Token decode fallback used:', e);
      }
    }

    // Method 2: Fetch from OpenID Connect v1 UserInfo Endpoint if ID token parsing was insufficient
    if (!userEmailRaw && accessToken) {
      try {
        const oidcRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (oidcRes.ok) {
          const oidcData = await oidcRes.json();
          if (oidcData.email) userEmailRaw = oidcData.email;
        }
      } catch (e) {
        console.warn('OIDC userinfo fetch failed:', e);
      }
    }

    // Method 3: Fetch from Google OAuth2 v3 UserInfo Endpoint as secondary HTTP fallback
    if (!userEmailRaw && accessToken) {
      try {
        const v3Res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (v3Res.ok) {
          const v3Data = await v3Res.json();
          if (v3Data.email) userEmailRaw = v3Data.email;
        }
      } catch (e) {
        console.warn('OAuth2 v3 userinfo fetch failed:', e);
      }
    }

    if (!userEmailRaw) {
      return NextResponse.redirect(new URL('/login?error=UserInfoFailed', 'https://corporate-bond-radar.onrender.com'));
    }

    const email = normalizeEmail(userEmailRaw);
    const allowed = isAllowedEmail(email);

    if (!allowed) {
      const accessDeniedUrl = new URL('/login', 'https://corporate-bond-radar.onrender.com');
      accessDeniedUrl.searchParams.set('error', 'AccessDenied');
      accessDeniedUrl.searchParams.set('email', email);
      return NextResponse.redirect(accessDeniedUrl);
    }

    const response = NextResponse.redirect(new URL('/', 'https://corporate-bond-radar.onrender.com'));
    
    response.cookies.set('bond_session_email', email, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.redirect(new URL('/login?error=ServerError', 'https://corporate-bond-radar.onrender.com'));
  }
}
