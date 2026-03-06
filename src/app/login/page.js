'use client';

import { useActionState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

const MIN_GAME_NAME_LENGTH = 2;

function getFormString(formData, key) {
  return formData.get(key)?.toString()?.trim() ?? '';
}

const initialState = { error: null };

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  async function signInAction(prevState, formData) {
    const gameName = getFormString(formData, 'gameName');
    const tagLine = getFormString(formData, 'tagLine').replace(/^#/, '');
    const apiKey = getFormString(formData, 'apiKey');
    const redirectTo = getFormString(formData, 'callbackUrl') || '/';

    if (!gameName || gameName.length < MIN_GAME_NAME_LENGTH) {
      return { error: 'Game Name must be at least 2 characters.' };
    }
    if (!tagLine) {
      return { error: 'Tag Line is required.' };
    }
    if (!apiKey) {
      return { error: 'API Key is required.' };
    }

    try {
      const result = await signIn('riot-credentials', {
        gameName,
        tagLine,
        apiKey,
        redirect: false,
      });
      if (result?.error) {
        return { error: result.error };
      }
      if (result?.ok) {
        router.push(redirectTo);
        router.refresh();
        return { error: null };
      }
      return { error: 'Sign in failed. Please try again.' };
    } catch (err) {
      return { error: err?.message ?? 'Something went wrong.' };
    }
  }

  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans flex items-center justify-center px-4">
      <main className="w-full max-w-md">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 sm:p-8 shadow-lg">
          <header className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-amber-400/95">
              LoL Match Lookup
            </h1>
            <p className="mt-1 text-slate-400 text-sm">
              Sign in with your Riot account and API key
            </p>
          </header>

          <form action={formAction} className="space-y-4" noValidate>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-slate-300 mb-1">
                Game Name
              </label>
              <input
                id="gameName"
                name="gameName"
                type="text"
                autoComplete="username"
                placeholder="YourGameName"
                minLength={MIN_GAME_NAME_LENGTH}
                disabled={isPending}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-70"
              />
            </div>

            <div>
              <label htmlFor="tagLine" className="block text-sm font-medium text-slate-300 mb-1">
                Tag Line
              </label>
              <input
                id="tagLine"
                name="tagLine"
                type="text"
                placeholder="1234"
                disabled={isPending}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-70"
              />
              <p className="mt-1 text-xs text-slate-500">Without the # (e.g. 1234)</p>
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-1">
                API Key
              </label>
              <input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="off"
                placeholder="RGAPI-..."
                disabled={isPending}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-70"
              />
              <p className="mt-1 text-xs text-slate-500">
                From{' '}
                <a
                  href="https://developer.riotgames.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400/90 hover:underline"
                >
                  developer.riotgames.com
                </a>
                . Never shared with the client; used only on the server.
              </p>
            </div>

            {state.error && (
              <div className="rounded-lg bg-red-950/40 border border-red-800/60 px-4 py-3 text-red-200 text-sm">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-amber-500/90 px-4 py-2.5 font-medium text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
