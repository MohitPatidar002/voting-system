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
    const ref = adminDb.collection("polls").doc(body.pollId);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Poll not found." }, { status: 404 });
    }
    const current = doc.data()!;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    let announce = false;
    if (body.status !== undefined && body.status !== current.status) {
      if (!POLL_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      // A poll's life moves one way: draft → open → closed. Reopening a closed
      // poll or un-publishing an open one would let results be manipulated
      // after villagers voted, so those transitions are refused.
      const allowedNext: Record<string, string[]> = {
        draft: ["open"],
        open: ["closed"],
        closed: [],
      };
      if (!(allowedNext[current.status] || []).includes(body.status)) {
        return NextResponse.json(
          { error: `A ${current.status} poll cannot become ${body.status}.` },
          { status: 409 }
        );
      }
      updates.status = body.status;
      if (body.status === "open") {
        updates.publishedAt = new Date();
        announce = true;
      }
    }
    // Question and wording are frozen once villagers can see the poll —
    // editing a live ballot would invalidate votes already cast.
    if (body.title !== undefined || body.description !== undefined) {
      if (current.status !== "draft") {
        return NextResponse.json(
          { error: "Only draft polls can be edited." },
          { status: 409 }
        );
      }
      if (body.title !== undefined) updates.title = cleanText(body.title, "Title", { max: 200 });
      if (body.description !== undefined) updates.description = cleanText(body.description, "Description", { max: 2000 });
    }
    await ref.update(updates);

    if (announce) {
      await createBroadcast({
        title: `New poll: ${current.title}`,
        body: String(current.description || "A new poll is open for voting.").slice(0, 160),
        type: "poll",
        link: `/polls/${body.pollId}`,
        createdBy: admin.uid,
      });
    }
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

    const ref = adminDb.collection("polls").doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Poll not found." }, { status: 404 });
    }
    // Published polls are part of the village's voting record. Only drafts
    // (which villagers never saw and cannot have voted on) may be deleted;
    // finished polls are closed and kept, never erased.
    if (doc.data()!.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft polls can be deleted. Close the poll instead — published polls are kept as a permanent record." },
        { status: 409 }
      );
    }
    await ref.delete();
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
