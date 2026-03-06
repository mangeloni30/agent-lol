import { auth } from 'auth';

const PUBLIC_PATHS = ['/login'];
const AUTH_API_PREFIX = '/api/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return;
  }
  if (pathname.startsWith('/api/')) {
    return;
  }
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (isLoggedIn && pathname === '/login') {
      return Response.redirect(new URL('/', req.url));
    }
    return;
  }
  if (!isLoggedIn) {
    const login = new URL('/login', req.url);
    login.searchParams.set('callbackUrl', pathname);
    return Response.redirect(login);
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|ico|webp)$).*)'],
};
