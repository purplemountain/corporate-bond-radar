import { cookies } from 'next/headers';

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

export async function auth() {
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get('bond_session_email');
  if (emailCookie?.value) {
    return { user: { email: normalizeEmail(emailCookie.value) } };
  }
  return null;
}
