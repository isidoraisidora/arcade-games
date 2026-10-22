import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDatabaseError } from "@/lib/database-errors";
import { prisma } from "@/lib/prisma";

const games = ["snake", "tetris", "breakout", "pong", "invaders"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestedGame = new URL(request.url).searchParams.get("game");
  if (requestedGame !== null && !games.includes(requestedGame)) {
    return NextResponse.json({ error: "That game is not valid." }, { status: 400 });
  }

  try {
    const scores = await prisma.gameScore.findMany({
      where: { game: requestedGame ?? { in: games } },
      orderBy: { points: "desc" },
      take: 10,
      select: {
        game: true,
        points: true,
        user: { select: { username: true } },
      },
    });

    return NextResponse.json(
      scores.map(({ game, points, user }) => ({
        game,
        points,
        username: user.username,
      })),
    );
  } catch (error) {
    const databaseError = getDatabaseError(error);
    if (databaseError) {
      return NextResponse.json(
        { error: databaseError.message },
        { status: databaseError.status },
      );
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to add a score to the all-time leaderboard." },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("game" in body) ||
    !("points" in body) ||
    typeof body.game !== "string" ||
    !games.includes(body.game) ||
    typeof body.points !== "number" ||
    !Number.isSafeInteger(body.points) ||
    body.points < 0 ||
    body.points > 1_000_000
  ) {
    return NextResponse.json({ error: "That score is not valid." }, { status: 400 });
  }

  try {
    const score = await prisma.gameScore.create({
      data: {
        game: body.game,
        points: body.points,
        userId: session.user.id,
      },
      select: { id: true, game: true, points: true, createdAt: true },
    });

    return NextResponse.json(score, { status: 201 });
  } catch (error) {
    const databaseError = getDatabaseError(error);
    if (databaseError) {
      return NextResponse.json(
        { error: databaseError.message },
        { status: databaseError.status },
      );
    }
    throw error;
  }
}
