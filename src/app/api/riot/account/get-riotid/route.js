import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const puuid = searchParams.get('puuid');

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API_KEY is missing' }, { status: 500 });
  }

  if (!puuid) {
    return NextResponse.json({ error: 'puuid is required' }, { status: 400 });
  }

  try {
    const url = `https://americas.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': apiKey,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
