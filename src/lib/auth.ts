import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import argon2 from 'argon2';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import './env'; // Activate environment validation

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Simple rate limit on login attempts by email
          if (credentials?.email) {
            const isAllowed = await checkRateLimit(`login:${credentials.email}`, 5, 60000);
            if (!isAllowed) return null; // Too many login attempts
          }

          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;

          const user = await prisma.user.findUnique({
            where: { email },
            include: { wallet: true },
          });
          if (!user) return null;

          const valid = await argon2.verify(user.passwordHash, password);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            balance: user.wallet?.balance ?? 0,
          };
        } catch (error) {
          console.error('[NextAuth] Authorize Error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.balance = (user as any).balance;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).balance = token.balance as number;
      }
      return session;
    },
  },
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if ((session.user as any).role !== 'ADMIN') throw new Error('Forbidden');
  return session;
}
