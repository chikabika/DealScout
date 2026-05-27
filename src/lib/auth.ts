import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";

let adapter: Adapter | null = null;

function getAdapter(): Adapter {
  adapter ??= DrizzleAdapter(getDb() as never, {
    usersTable: users,
  } as never);

  return adapter;
}

const lazyAdapter = new Proxy({} as Adapter, {
  get(_target, prop: keyof Adapter) {
    const value = getAdapter()[prop];

    if (typeof value === "function") {
      return value.bind(getAdapter());
    }

    return value;
  },
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: lazyAdapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        const [user] = await getDb()
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) {
          return null;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }

      return session;
    },
  },
});
