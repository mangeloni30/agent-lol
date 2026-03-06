import { NextResponse } from 'next/server';
import { getRiotSessionOrFail } from '@/lib/auth-server';

export async function GET(request) {
  const { session, response } = await getRiotSessionOrFail(NextResponse, request);
  if (response) return response;

  const puuid = request.nextUrl.searchParams.get('puuid') ?? session.puuid;
  if (puuid !== session.puuid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
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
