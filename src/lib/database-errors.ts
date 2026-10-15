import { Prisma } from "@prisma/client";

export function getDatabaseError(error: unknown) {
  const code =
    error instanceof Prisma.PrismaClientKnownRequestError
      ? error.code
      : error instanceof Prisma.PrismaClientInitializationError
        ? error.errorCode
        : null;

  if (!code) return null;

  switch (code) {
    case "P1000":
      return {
        status: 503,
        message:
          "PostgreSQL rejected the credentials in DATABASE_URL. Check that the username and password match your database.",
      };
    case "P1001":
      return {
        status: 503,
        message:
          "Can't reach PostgreSQL using DATABASE_URL. Check the host, port, network access, and connection settings.",
      };
    case "P2021":
    case "P2022":
      return {
        status: 503,
        message:
          "The database tables are missing or out of date. Run npm run db:push using the same DATABASE_URL.",
      };
    default:
      return null;
  }
}
