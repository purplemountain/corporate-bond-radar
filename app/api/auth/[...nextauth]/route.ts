import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect('https://corporate-bond-radar.onrender.com/api/auth/google');
}

export async function POST() {
  return NextResponse.redirect('https://corporate-bond-radar.onrender.com/api/auth/google');
}
