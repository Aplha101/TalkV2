import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/auth';
import { signInSchema } from '@/lib/schemas';

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Validate input
        const validation = signInSchema.safeParse(credentials);
        if (!validation.success) {
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim(),
              isActive: true,
            },
          });

          if (!user) {
            return null;
          }

          // Validate password
          const isPasswordValid = await validatePassword(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Update last seen and status
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastSeen: new Date(),
              status: 'ONLINE',
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            status: user.status,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist additional user info to token
      if (user) {
        token.username = user.username;
        token.avatarUrl = user.avatarUrl;
        token.bio = user.bio;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user info to session
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.username = token.username as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.bio = token.bio as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined,
      },
    },
  },
});