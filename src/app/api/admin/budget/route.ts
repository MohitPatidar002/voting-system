import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";

function toNumber(value: unknown): number {
  const n = Number(value);
  return isFinite(n) && n >= 0 ? n : -1;
}

export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "budget:manage");
    const body = await request.json();

    const head = cleanText(body.head, "Budget head", { max: 200 });
    const financialYear = cleanText(body.financialYear, "Financial year", { max: 12 });
    if (!/^\d{4}-\d{4}$/.test(financialYear)) {
      return NextResponse.json(
        { error: "Financial year must look like 2025-2026." },
        { status: 400 }
      );
    }
    if (!["receipt", "expenditure"].includes(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    const amount = toNumber(body.amount);
    if (amount < 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }

    const date = body.date ? new Date(body.date) : new Date();
    const docRef = await adminDb.collection("budget").add({
      financialYear,
      head,
      category: body.category,
      amount,
      description: body.description ? cleanText(body.description, "Description", { min: 0, max: 1000 }) : "",
      date: isNaN(date.getTime()) ? new Date() : date,
      createdAt: new Date(),
      createdBy: admin.uid,
    });

    return NextResponse.json({ success: true, entryId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Budget Entry Error");
  }
}

export async function GET(request: Request) {
  try {
    await requireCapability(request, "budget:manage");
    const snapshot = await adminDb.collection("budget").orderBy("date", "desc").get();
    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate().toISOString() ?? null,
        createdAt: data.createdAt?.toDate().toISOString() ?? null,
      };
    });
    return NextResponse.json({ entries });
  } catch (error) {
    return errorResponse(error, "Admin Budget Fetch Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "budget:manage");
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");
    if (!entryId) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }
    await adminDb.collection("budget").doc(entryId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Budget Delete Error");
  }
}
