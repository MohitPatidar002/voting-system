import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText, validateImageUrls } from "../../../../lib/validate";
import { createBroadcast } from "../../../../lib/broadcast";

const PROJECT_STATUSES = ["planned", "in_progress", "completed", "stalled"];

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return isFinite(n) && n >= 0 ? n : 0;
}

export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "project:manage");
    const body = await request.json();

    const name = cleanText(body.name, "Project name", { max: 200 });
    const description = cleanText(body.description, "Description", { max: 4000 });
    const type = cleanText(body.type, "Type", { max: 120 });
    const fundingSource = cleanText(body.fundingSource, "Funding source", { max: 200 });

    if (!PROJECT_STATUSES.includes(body.status || "planned")) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const docRef = await adminDb.collection("projects").add({
      name,
      description,
      type,
      contractor: body.contractor ? cleanText(body.contractor, "Contractor", { min: 0, max: 200 }) : "",
      budgetAllocated: toNumber(body.budgetAllocated),
      budgetSpent: toNumber(body.budgetSpent),
      fundingSource,
      startDate: parseDate(body.startDate) || new Date(),
      expectedCompletion: parseDate(body.expectedCompletion),
      status: body.status || "planned",
      progressPercent: Math.min(100, Math.max(0, toNumber(body.progressPercent))),
      images: validateImageUrls(body.images, 8),
      createdAt: new Date(),
      createdBy: admin.uid,
    });

    await createBroadcast({
      title: `New development work: ${name}`,
      body: `${type} — funded by ${fundingSource}.`,
      type: "project",
      link: "/projects",
      createdBy: admin.uid,
    });

    return NextResponse.json({ success: true, projectId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Project Creation Error");
  }
}

export async function GET(request: Request) {
  try {
    await requireCapability(request, "project:manage");
    const snapshot = await adminDb.collection("projects").orderBy("createdAt", "desc").get();
    const projects = snapshot.docs.map((doc) => serializeProject(doc.id, doc.data()));
    return NextResponse.json({ projects });
  } catch (error) {
    return errorResponse(error, "Admin Projects Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "project:manage");
    const body = await request.json();
    if (typeof body.projectId !== "string") {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status !== undefined) {
      if (!PROJECT_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.name !== undefined) updates.name = cleanText(body.name, "Project name", { max: 200 });
    if (body.description !== undefined) updates.description = cleanText(body.description, "Description", { max: 4000 });
    if (body.contractor !== undefined) updates.contractor = body.contractor ? cleanText(body.contractor, "Contractor", { min: 0, max: 200 }) : "";
    if (body.fundingSource !== undefined) updates.fundingSource = cleanText(body.fundingSource, "Funding source", { max: 200 });
    if (body.budgetAllocated !== undefined) updates.budgetAllocated = toNumber(body.budgetAllocated);
    if (body.progressPercent !== undefined)
      updates.progressPercent = Math.min(100, Math.max(0, toNumber(body.progressPercent)));
    if (body.budgetSpent !== undefined) updates.budgetSpent = toNumber(body.budgetSpent);
    if (body.startDate !== undefined) updates.startDate = parseDate(body.startDate) || new Date();
    if (body.expectedCompletion !== undefined)
      updates.expectedCompletion = parseDate(body.expectedCompletion);
    if (body.images !== undefined) updates.images = validateImageUrls(body.images, 8);

    await adminDb.collection("projects").doc(body.projectId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Project Update Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "project:manage");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await adminDb.collection("projects").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Project Delete Error");
  }
}

function serializeProject(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    ...data,
    startDate: data.startDate?.toDate().toISOString() ?? null,
    expectedCompletion: data.expectedCompletion?.toDate?.().toISOString() ?? null,
    createdAt: data.createdAt?.toDate().toISOString() ?? null,
  };
}
