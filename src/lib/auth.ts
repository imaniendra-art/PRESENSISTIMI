import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'NIP & Password',
      credentials: {
        nip: { label: 'NIP', type: 'text', placeholder: 'Masukkan NIP' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          throw new Error('NIP dan password wajib diisi');
        }

        const user = await prisma.user.findUnique({
          where: { nip: credentials.nip.trim() },
        });

        if (!user) {
          throw new Error('NIP tidak terdaftar di sistem');
        }

        if (!user.isActive) {
          throw new Error('Akun dinonaktifkan. Silakan hubungi bagian SDM');
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordMatch) {
          throw new Error('Password yang dimasukkan salah');
        }

        return {
          id: user.id,
          nip: user.nip,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          jabatan: user.jabatan,
          unitKerja: user.unitKerja,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nip = (user as { nip: string }).nip;
        token.role = (user as { role: Role }).role;
        token.jabatan = (user as { jabatan: string }).jabatan;
        token.unitKerja = (user as { unitKerja: string }).unitKerja;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.nip = token.nip;
        session.user.role = token.role;
        session.user.jabatan = token.jabatan;
        session.user.unitKerja = token.unitKerja;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'presensistimi-secret-key-32-chars-long-secure-token',
};
