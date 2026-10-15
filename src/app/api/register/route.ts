import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getDatabaseError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body: unknown = await request.json();

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    !("username" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.username !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const username = body.username.trim();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    username.length < 3 ||
    username.length > 20 ||
    !/^[a-zA-Z0-9_]+$/.test(username) ||
    body.password.length < 8 ||
    Buffer.byteLength(body.password, "utf8") > 72
  ) {
    return NextResponse.json(
      {
        error:
          "Use a valid email, a 3–20 character username, and an 8–72 character password.",
      },
      { status: 400 },
    );
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "That email or username is already in use." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(body.password, 12);
    await prisma.user.create({
      data: { email, username, name: username, passwordHash },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "That email or username is already in use." },
        { status: 409 },
      );
    }
    const databaseError = getDatabaseError(error);
    if (databaseError) {
      return NextResponse.json(
        { error: databaseError.message },
        { status: databaseError.status },
      );
    }
    throw error;
  }

  return NextResponse.json({ created: true }, { status: 201 });
}
