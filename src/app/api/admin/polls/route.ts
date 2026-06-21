import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";
import { createBroadcast } from "../../../../lib/broadcast";

const POLL_STATUSES = ["draft", "open", "closed"];

export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "poll:create");
    const body = await request.json();
    const { startDate, endDate, type, options, allowMultiple } = body;

    const title = cleanText(body.title, "Title", { max: 200 });
    const description = cleanText(body.description, "Description", { max: 2000 });

    if (!startDate || !endDate || !type || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "Missing required fields or insufficient options" },
        { status: 400 }
      );
    }
    if (!["yes_no", "multiple_choice"].includes(type)) {
      return NextResponse.json({ error: "Invalid poll type" }, { status: 400 });
    }

    // Validate option shape and cap count.
    if (options.length > 20) {
      return NextResponse.json({ error: "Too many options (max 20)." }, { status: 400 });
    }
    const cleanOptions = options.map((opt: { id?: string; text?: string }, i: number) => ({
      id: typeof opt.id === "string" && opt.id ? opt.id : `opt_${i}`,
      text: cleanText(opt.text, `Option ${i + 1}`, { max: 200 }),
    }));

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }
    if ((end.getTime() - start.getTime()) / 60000 < 30) {
      return NextResponse.json(
        { error: "Poll must be open for at least 30 minutes" },
        { status: 400 }
      );
    }

    const docRef = await adminDb.collection("polls").add({
      title,
      description,
      startDate: start,
      endDate: end,
      status: "draft",
      type,
      options: cleanOptions,
      allowMultiple: !!allowMultiple,
      totalVotes: 0,
      results: {},
      createdAt: new Date(),
      createdBy: admin.uid,
    });

    return NextResponse.json({ success: true, pollId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Poll Creation Error");
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireCapability(request, "poll:create");
    const body = await request.json();
    if (typeof body.pollId !== "string") {
      return NextResponse.json({ error: "pollId is required." }, { status: 400 });
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status !== undefined) {
      if (!POLL_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === "open") {
        const doc = await adminDb.collection("polls").doc(body.pollId).get();
        if (doc.exists) {
          const d = doc.data()!;
          await createBroadcast({
            title: `New poll: ${d.title}`,
            body: String(d.description || "A new poll is open for voting.").slice(0, 160),
            type: "poll",
            link: `/polls/${body.pollId}`,
            createdBy: admin.uid,
          });
        }
      }
    }
    if (body.title !== undefined) updates.title = cleanText(body.title, "Title", { max: 200 });
    if (body.description !== undefined) updates.description = cleanText(body.description, "Description", { max: 2000 });
    await adminDb.collection("polls").doc(body.pollId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Poll Update Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "poll:create");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await adminDb.collection("polls").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Poll Delete Error");
  }
}

export async function GET(request: Request) {
  try {
    await requireCapability(request, "poll:create");
    const snapshot = await adminDb.collection("polls").orderBy("createdAt", "desc").get();

    const polls = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        allowMultiple: data.allowMultiple || false,
        startDate: data.startDate?.toDate().toISOString(),
        endDate: data.endDate?.toDate().toISOString(),
        createdAt: data.createdAt?.toDate().toISOString(),
      };
    });

    return NextResponse.json({ polls });
  } catch (error) {
    return errorResponse(error, "Admin Polls Fetch Error");
  }
}
