import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";
import { createBroadcast } from "../../../../lib/broadcast";

const NOTICE_TYPES = ["meeting", "emergency", "update", "general"];

export async function GET(request: Request) {
  try {
    await requireCapability(request, "notice:create");
    const snapshot = await adminDb.collection("notices").orderBy("createdAt", "desc").limit(50).get();
    const notices = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title,
        type: d.type,
        isActive: d.isActive,
        createdAt: d.createdAt?.toDate().toISOString() ?? null,
      };
    });
    return NextResponse.json({ notices });
  } catch (error) {
    return errorResponse(error, "Notices Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "notice:create");
    const body = await request.json();
    if (typeof body.noticeId !== "string") {
      return NextResponse.json({ error: "noticeId is required." }, { status: 400 });
    }
    const updates: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (body.title !== undefined) updates.title = cleanText(body.title, "Title", { max: 200 });
    if (body.content !== undefined) updates.content = cleanText(body.content, "Content", { max: 5000 });
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    await adminDb.collection("notices").doc(body.noticeId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Notice Update Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "notice:create");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await adminDb.collection("notices").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Notice Delete Error");
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "notice:create");
    const body = await request.json();

    const title = cleanText(body.title, "Title", { max: 200 });
    const content = cleanText(body.content, "Content", { max: 5000 });
    if (!NOTICE_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "Invalid notice type." }, { status: 400 });
    }

    const docRef = await adminDb.collection("notices").add({
      title,
      content,
      type: body.type,
      createdAt: new Date(),
      createdBy: admin.uid,
      isActive: true,
    });

    // Notify the village so nobody misses an announcement.
    await createBroadcast({
      title,
      body: content.slice(0, 160),
      type: body.type === "emergency" ? "general" : "notice",
      link: "/notices",
      createdBy: admin.uid,
    });

    return NextResponse.json({ success: true, noticeId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Notice Creation Error");
  }
}
