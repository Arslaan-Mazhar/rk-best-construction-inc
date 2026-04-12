import { NextRequest, NextResponse } from "next/server";
import admin from "@/../lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    return NextResponse.json({
      message: "Authorized",
      user: decoded,
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
}