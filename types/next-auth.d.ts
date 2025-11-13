import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      avatarUrl?: string;
      bio?: string;
      status: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
    status: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username: string;
    avatarUrl?: string;
    bio?: string;
    status: string;
  }
}