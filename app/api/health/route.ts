import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$runCommandRaw({ ping: 1 });

    return NextResponse.json(
      {
        status: "UP",
        service: "mock-test-platform",
        database: "UP",
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: "DOWN",
        service: "mock-test-platform",
        database: "DOWN",
      },
      { status: 503 },
    );
  }
}
