import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";
import { createBroadcast } from "../../../../lib/broadcast";

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "meeting:manage");
    const body = await request.json();

    const title = cleanText(body.title, "Title", { max: 200 });
    const agenda = cleanText(body.agenda, "Agenda", { max: 5000 });
    const date = parseDate(body.date);
    if (!date) return NextResponse.json({ error: "A valid meeting date is required." }, { status: 400 });

    const status = body.status === "completed" ? "completed" : "scheduled";

    const docRef = await adminDb.collection("meetings").add({
      title,
      date,
      status,
      agenda,
      decisions: body.decisions ? cleanText(body.decisions, "Decisions", { min: 0, max: 5000 }) : "",
      attendanceCount: Number.isFinite(Number(body.attendanceCount)) ? Math.max(0, Number(body.attendanceCount)) : 0,
      nextSteps: body.nextSteps ? cleanText(body.nextSteps, "Next steps", { min: 0, max: 2000 }) : "",
      createdAt: new Date(),
      createdBy: admin.uid,
    });

    // Announce upcoming Gram Sabha meetings so villagers can attend.
    if (status === "scheduled" && date.getTime() >= Date.now()) {
      await createBroadcast({
        title: `Gram Sabha: ${title}`,
        body: `Meeting on ${date.toLocaleDateString("en-IN")}. Tap to see the agenda.`,
        type: "meeting",
        link: "/meetings",
        createdBy: admin.uid,
      });
    }

    return NextResponse.json({ success: true, meetingId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Meeting Create Error");
  }
}

export async function GET(request: Request) {
  try {
    await requireCapability(request, "meeting:manage");
    const snapshot = await adminDb.collection("meetings").orderBy("date", "desc").get();
    const meetings = snapshot.docs.map((doc) => serializeMeeting(doc.id, doc.data()));
    return NextResponse.json({ meetings });
  } catch (error) {
    return errorResponse(error, "Admin Meetings Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "meeting:manage");
    const body = await request.json();
    if (typeof body.meetingId !== "string") {
      return NextResponse.json({ error: "meetingId is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status !== undefined) updates.status = body.status === "completed" ? "completed" : "scheduled";
    if (body.title !== undefined) updates.title = cleanText(body.title, "Title", { max: 200 });
    if (body.agenda !== undefined) updates.agenda = cleanText(body.agenda, "Agenda", { max: 5000 });
    if (body.date !== undefined) {
      const d = parseDate(body.date);
      if (!d) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
      updates.date = d;
    }
    if (body.decisions !== undefined) updates.decisions = cleanText(body.decisions, "Decisions", { min: 0, max: 5000 });
    if (body.nextSteps !== undefined) updates.nextSteps = cleanText(body.nextSteps, "Next steps", { min: 0, max: 2000 });
    if (body.attendanceCount !== undefined)
      updates.attendanceCount = Math.max(0, Number(body.attendanceCount) || 0);

    await adminDb.collection("meetings").doc(body.meetingId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Meeting Update Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "meeting:manage");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await adminDb.collection("meetings").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Meeting Delete Error");
  }
}

function serializeMeeting(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    title: data.title,
    date: data.date?.toDate().toISOString() ?? null,
    status: data.status,
    agenda: data.agenda,
    decisions: data.decisions || "",
    attendanceCount: data.attendanceCount || 0,
    nextSteps: data.nextSteps || "",
  };
}
