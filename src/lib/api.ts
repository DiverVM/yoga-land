import { NextResponse } from "next/server";
import type { ErrorResponse } from "@/lib/types";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: string, status: number, details?: string) {
  const body: ErrorResponse = details ? { error, details } : { error };
  return NextResponse.json(body, { status });
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
