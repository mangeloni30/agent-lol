import { redirect } from 'next/navigation';
import { auth } from 'auth';
import { HomeContent } from '@/components/HomeContent';

export default async function Home() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/');
  }

  return <HomeContent user={session.user} />;
}
