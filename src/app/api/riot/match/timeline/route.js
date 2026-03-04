import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API_KEY is missing' }, { status: 500 });
  }

  if (!matchId) {
    return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
  }

  try {
    const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;

    console.log('=== Making API Request: Get Match Timeline ===');
    console.log('Match ID:', matchId);
    console.log('URL:', url);

    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': apiKey,
      },
      cache: 'no-store',
    });

    const data = await response.json();

    console.log('=== API Response: Match Timeline ===');
    console.log('Response:', data);
    console.log('==========================================');

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching match timeline:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
