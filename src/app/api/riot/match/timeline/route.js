import { NextResponse } from 'next/server';
import { getRiotSessionOrFail } from '@/lib/auth-server';

export async function GET(request) {
  const { session, response } = await getRiotSessionOrFail(NextResponse, request);
  if (response) return response;

  const matchId = request.nextUrl.searchParams.get('matchId');
  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': session.apiKey },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
