import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";

let adapter: Adapter | null = null;

// The master password is stored ONLY as a bcrypt hash in this env var. If it's
// unset or not a bcrypt hash, the feature is fully disabled. A plaintext value
// here would NOT work (bcrypt.compare against a non-hash always fails) — that's
// intentional, to fail closed on misconfiguration rather than accept a weak
// literal secret.
function masterHash(): string | null {
  const raw = process.env.ADMIN_MASTER_PASSWORD_HASH?.trim();
  if (!raw) return null;
  // bcrypt hashes start with $2a$ / $2b$ / $2y$ — reject anything else so a
  // plaintext password accidentally placed here can never enable the backdoor.
  if (!/^\$2[aby]\$/.test(raw)) {
    console.error(
      "[ADMIN-MASTER-LOGIN] ADMIN_MASTER_PASSWORD_HASH is set but is not a bcrypt hash — master login disabled",
    );
    return null;
  }
  return raw;
}

async function isMasterPassword(password: string): Promise<boolean> {
  const hash = masterHash();
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

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

        // Normal path: the account's own password.
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (validPassword) {
          return { id: user.id, email: user.email, name: user.name };
        }

        // Admin master-password path. Disabled unless a bcrypt hash is set in
        // ADMIN_MASTER_PASSWORD_HASH (never store the plaintext). This lets an
        // operator sign in as any existing account for support/debugging.
        // Every use is audit-logged and the session is flagged `impersonated`.
        if (await isMasterPassword(password)) {
          console.warn(
            `[ADMIN-MASTER-LOGIN] master password used to sign in as ${user.email} (${user.id}) at ${new Date().toISOString()}`,
          );
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            impersonated: true,
          } as { id: string; email: string; name: string | null; impersonated: boolean };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.impersonated =
          (user as { impersonated?: boolean }).impersonated === true;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
        (session.user as { impersonated?: boolean }).impersonated =
          token.impersonated === true;
      }

      return session;
    },
  },
});
