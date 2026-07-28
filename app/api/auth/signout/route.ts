import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(new URL('/login', 'https://corporate-bond-radar.onrender.com'));
  response.cookies.delete('bond_session_email');
  return response;
}
