import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Check if user has admin role
    const token = req.nextauth.token;

    if (token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protect all dashboard routes
export const config = {
  matcher: ['/dashboard/:path*', '/organizations/:path*', '/payments/:path*', '/api-keys/:path*'],
};
