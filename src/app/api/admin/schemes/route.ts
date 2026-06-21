import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";
import { createBroadcast } from "../../../../lib/broadcast";

const CATEGORIES = [
  "housing", "agriculture", "health", "women",
  "pension", "education", "employment", "utility", "other",
];

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "scheme:manage");
    const body = await request.json();

    const name = cleanText(body.name, "Scheme name", { max: 200 });
    const description = cleanText(body.description, "Description", { max: 4000 });
    const benefits = cleanText(body.benefits, "Benefits", { max: 2000 });
    const eligibility = cleanText(body.eligibility, "Eligibility", { max: 2000 });

    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const start = parseDate(body.applicationStartDate) || new Date();
    const end = parseDate(body.applicationEndDate); // null = ongoing
    if (end && end <= start) {
      return NextResponse.json(
        { error: "Application end date must be after the start date." },
        { status: 400 }
      );
    }

    const requiredDocuments = Array.isArray(body.requiredDocuments)
      ? body.requiredDocuments
          .slice(0, 15)
          .map((d: unknown) => cleanText(d, "Document", { max: 120 }))
      : [];

    const isActive = body.isActive !== false;
    const acceptsInAppApplication = !!body.acceptsInAppApplication;

    const docRef = await adminDb.collection("schemes").add({
      name,
      nameHi: body.nameHi ? cleanText(body.nameHi, "Hindi name", { max: 200 }) : "",
      department: cleanText(body.department || "", "Department", { min: 0, max: 200 }),
      category: body.category,
      description,
      benefits,
      eligibility,
      requiredDocuments,
      applicationStartDate: start,
      applicationEndDate: end,
      isActive,
      externalUrl: typeof body.externalUrl === "string" ? body.externalUrl.slice(0, 500) : "",
      acceptsInAppApplication,
      createdAt: new Date(),
      createdBy: admin.uid,
    });

    // Tell the village a new scheme is open so applications aren't missed.
    if (isActive) {
      await createBroadcast({
        title: `New scheme: ${name}`,
        body: end
          ? `Apply before ${end.toLocaleDateString("en-IN")}. ${benefits}`
          : benefits,
        type: "scheme",
        link: "/schemes",
        createdBy: admin.uid,
      });
    }

    return NextResponse.json({ success: true, schemeId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Scheme Creation Error");
  }
}

export async function GET(request: Request) {
  try {
    await requireCapability(request, "scheme:manage");
    const snapshot = await adminDb
      .collection("schemes")
      .orderBy("createdAt", "desc")
      .get();
    const schemes = snapshot.docs.map((doc) => serializeScheme(doc.id, doc.data()));
    return NextResponse.json({ schemes });
  } catch (error) {
    return errorResponse(error, "Admin Schemes Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "scheme:manage");
    const body = await request.json();
    if (typeof body.schemeId !== "string") {
      return NextResponse.json({ error: "schemeId is required." }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;
    if (typeof body.acceptsInAppApplication === "boolean")
      updates.acceptsInAppApplication = body.acceptsInAppApplication;
    if (body.description !== undefined)
      updates.description = cleanText(body.description, "Description", { max: 4000 });
    if (body.applicationEndDate !== undefined)
      updates.applicationEndDate = parseDate(body.applicationEndDate);

    await adminDb.collection("schemes").doc(body.schemeId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Scheme Update Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "scheme:manage");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await adminDb.collection("schemes").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Scheme Delete Error");
  }
}

function serializeScheme(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    ...data,
    applicationStartDate: data.applicationStartDate?.toDate().toISOString() ?? null,
    applicationEndDate: data.applicationEndDate?.toDate?.().toISOString() ?? null,
    createdAt: data.createdAt?.toDate().toISOString() ?? null,
  };
}
