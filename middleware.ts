import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Middleware logic can be added here if needed
    // For example, role-based access control, etc.
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Return true if the user is authenticated, false otherwise
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (authentication pages)
     * - / (landing page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth|$).*)',
  ],
};