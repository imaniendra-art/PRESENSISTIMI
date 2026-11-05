import { Role } from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string;
    nip: string;
    role: Role;
    jabatan: string;
    unitKerja: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      nip: string;
      role: Role;
      jabatan: string;
      unitKerja: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    nip: string;
    role: Role;
    jabatan: string;
    unitKerja: string;
  }
}
