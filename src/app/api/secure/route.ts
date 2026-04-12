import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/../lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json(
      { error: "Token missing" },
      { status: 401 }
    );
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      message: "Authorized",
      user: decoded,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 403 }
    );
  }
}