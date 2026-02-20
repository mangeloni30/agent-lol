import { NextResponse } from 'next/server';
import { DATA_DRAGON_VERSIONS_URL } from '@/constants/ddragon';

export async function GET() {
  try {
    const res = await fetch(DATA_DRAGON_VERSIONS_URL, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    const versions = await res.json();
    if (!Array.isArray(versions) || versions.length === 0) {
      return NextResponse.json({ error: 'No versions' }, { status: 502 });
    }
    return NextResponse.json({ version: versions[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
