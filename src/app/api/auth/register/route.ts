import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { users } from "@/lib/schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  const password =
    typeof body?.password === "string" ? body.password.trim() : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const [existingUser] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await getDb()
    .insert(users)
    .values({
      email,
      name: name || null,
      passwordHash,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  await sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => {});

  return NextResponse.json({ user }, { status: 201 });
}
