import { NextResponse } from 'next/server';
import { getRiotSessionOrFail } from '@/lib/auth-server';

export async function GET(request) {
  const { session, response } = await getRiotSessionOrFail(NextResponse, request);
  if (response) return response;
  return NextResponse.json({
    puuid: session.puuid,
    gameName: session.gameName,
    tagLine: session.tagLine,
  });
}
