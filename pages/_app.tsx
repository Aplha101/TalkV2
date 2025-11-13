import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import '@/styles/globals.css';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    // List of public routes that don't require authentication
    const publicRoutes = ['/', '/auth/signin', '/auth/signup'];
    const isPublicRoute = publicRoutes.includes(router.pathname);

    if (!session && !isPublicRoute) {
      // Redirect to signin if not authenticated and on a protected route
      router.push('/auth/signin');
    } else if (session && isPublicRoute && router.pathname !== '/') {
      // Redirect to dashboard if authenticated and on auth page (except landing)
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </SessionProvider>
  );
}

export default MyApp;