import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading

    if (session) {
      // If authenticated, redirect to dashboard
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

  // If authenticated and still on this page (shouldn't happen due to redirect), show nothing
  if (session) {
    return null;
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-text mb-6">
              <span className="text-gradient">Welcome to Talkie</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
              Your new favorite place to connect, chat, and build communities.
              Experience real-time messaging, voice calls, and so much more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="btn btn-primary btn-lg px-8 py-4 text-lg"
              >
                Get Started Free
              </Link>
              <Link
                href="/auth/signin"
                className="btn btn-secondary btn-lg px-8 py-4 text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Everything you need to connect
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Built for communities, friends, and conversations that matter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-4">Real-time Messaging</h3>
              <p className="text-text-secondary">
                Instant messaging with read receipts, typing indicators, and message history.
              </p>
            </div>

            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-4">Voice & Video Calls</h3>
              <p className="text-text-secondary">
                High-quality voice and video calls with screen sharing and noise cancellation.
              </p>
            </div>

            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-4">Custom Servers</h3>
              <p className="text-text-secondary">
                Create and customize your own servers with channels, roles, and permissions.
              </p>
            </div>

            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-4">Secure & Private</h3>
              <p className="text-text-secondary">
                End-to-end encryption, two-factor authentication, and privacy controls.
              </p>
            </div>

            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-4">Cross-Platform</h3>
              <p className="text-text-secondary">
                Available on web, desktop, and mobile devices. Stay connected anywhere.
              </p>
            </div>

            <div className="card p-8 text-center card-hover">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-text mb-4">Customizable</h3>
              <p className="text-text-secondary">
                Themes, emojis, and integrations to make your experience unique.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
            Ready to start chatting?
          </h2>
          <p className="text-lg text-text-secondary mb-8">
            Join thousands of users who are already connecting on Talkie.
          </p>
          <Link
            href="/auth/signup"
            className="btn btn-primary btn-lg px-8 py-4 text-lg"
          >
            Create Your Account
          </Link>
          <p className="text-sm text-text-muted mt-4">
            No credit card required. Free forever for personal use.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">Talkie</h3>
              <p className="text-text-secondary text-sm">
                Connect, chat, and build communities.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-text mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="text-text-secondary hover:text-text">Features</Link></li>
                <li><Link href="/pricing" className="text-text-secondary hover:text-text">Pricing</Link></li>
                <li><Link href="/download" className="text-text-secondary hover:text-text">Download</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-text mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-text-secondary hover:text-text">About</Link></li>
                <li><Link href="/blog" className="text-text-secondary hover:text-text">Blog</Link></li>
                <li><Link href="/careers" className="text-text-secondary hover:text-text">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-text mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-text-secondary hover:text-text">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-text-secondary hover:text-text">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-text-secondary hover:text-text">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-text-muted">
            <p>&copy; 2024 Talkie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}