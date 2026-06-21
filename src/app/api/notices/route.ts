import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";
import { verifyToken, errorResponse } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    // Any authenticated villager or admin may read active notices.
    await verifyToken(request);

    const snapshot = await adminDb
      .collection("notices")
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    const notices = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
      };
    });

    return NextResponse.json(
      { notices },
      { headers: { "Cache-Control": "private, max-age=15" } }
    );
  } catch (error) {
    return errorResponse(error, "Notices Fetch Error");
  }
}
