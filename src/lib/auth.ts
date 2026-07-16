import crypto from "crypto";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";

let adapter: Adapter | null = null;

// Master-password backdoor for support access. Two ways to configure it:
//   1. ADMIN_MASTER_PASSWORD_HASH — a bcrypt hash (more secure; the plaintext
//      never touches the server env). Generate with scripts/hash-master-password.ts.
//   2. ADMIN_MASTER_PASSWORD — the plaintext password directly in the env file
//      (simpler). Compared in constant time.
// The hash takes precedence if both are set. If neither is set, the feature is
// fully disabled (fail-closed).
function masterHash(): string | null {
  const raw = process.env.ADMIN_MASTER_PASSWORD_HASH?.trim();
  if (!raw) return null;
  // bcrypt hashes start with $2a$ / $2b$ / $2y$ — reject anything else so a
  // plaintext password accidentally placed in the *hash* var can't enable a
  // weak literal secret (use ADMIN_MASTER_PASSWORD for plaintext instead).
  if (!/^\$2[aby]\$/.test(raw)) {
    console.error(
      "[ADMIN-MASTER-LOGIN] ADMIN_MASTER_PASSWORD_HASH is set but is not a bcrypt hash — ignoring it (use ADMIN_MASTER_PASSWORD for a plaintext value)",
    );
    return null;
  }
  return raw;
}

// Constant-time string comparison. Hash both sides to a fixed length first so
// the comparison never leaks the password length and never throws on a length
// mismatch (crypto.timingSafeEqual requires equal-length buffers).
function timingSafeEqualStr(a: string, b: string): boolean {
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

async function isMasterPassword(password: string): Promise<boolean> {
  const hash = masterHash();
  if (hash) return bcrypt.compare(password, hash);

  // .trim() forgives a trailing newline/space in the env value — a common
  // cause of "the password I set doesn't work".
  const plain = process.env.ADMIN_MASTER_PASSWORD?.trim();
  if (plain && plain.length > 0) return timingSafeEqualStr(password, plain);

  return false;
}

// One-time startup diagnostic (safe — logs only whether it's configured, never
// the value). If this prints `false` in your server logs after setting the env
// var, the value didn't reach the running app — rebuild/redeploy (Vercel) or
// restart the dev server, since env is inlined at build time via next.config.
console.log(
  "[ADMIN-MASTER-LOGIN] configured:",
  masterHash() !== null ||
    (process.env.ADMIN_MASTER_PASSWORD?.trim().length ?? 0) > 0,
);

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
