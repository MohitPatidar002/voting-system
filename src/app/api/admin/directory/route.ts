import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText, validateImageUrls } from "../../../../lib/validate";

export async function POST(request: Request) {
  try {
    const admin = await requireCapability(request, "directory:manage");
    const body = await request.json();

    const name = cleanText(body.name, "Name", { max: 120 });
    const designation = cleanText(body.designation, "Designation", { max: 120 });

    let mobileNumber = "";
    if (body.mobileNumber) {
      const digits = String(body.mobileNumber).replace(/\D/g, "");
      if (digits.length !== 10) {
        return NextResponse.json({ error: "Mobile number must be 10 digits." }, { status: 400 });
      }
      mobileNumber = digits;
    }

    const photos = validateImageUrls(body.photoUrl ? [body.photoUrl] : [], 1);

    const docRef = await adminDb.collection("directory").add({
      name,
      designation,
      ward: body.ward ? cleanText(body.ward, "Ward", { min: 0, max: 60 }) : "",
      mobileNumber,
      tenure: body.tenure ? cleanText(body.tenure, "Tenure", { min: 0, max: 40 }) : "",
      photoUrl: photos[0] || "",
      order: Number.isFinite(Number(body.order)) ? Number(body.order) : 100,
      createdAt: new Date(),
      createdBy: admin.uid,
    });

    return NextResponse.json({ success: true, memberId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Directory Create Error");
  }
}

export async function GET(request: Request) {
  try {
    await requireCapability(request, "directory:manage");
    const snapshot = await adminDb.collection("directory").orderBy("order", "asc").get();
    const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ members });
  } catch (error) {
    return errorResponse(error, "Directory Fetch Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "directory:manage");
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (fields.name !== undefined) update.name = cleanText(fields.name, "Name", { max: 120 });
    if (fields.designation !== undefined) update.designation = cleanText(fields.designation, "Designation", { max: 120 });
    if (fields.ward !== undefined) update.ward = fields.ward ? cleanText(fields.ward, "Ward", { min: 0, max: 60 }) : "";
    if (fields.tenure !== undefined) update.tenure = fields.tenure ? cleanText(fields.tenure, "Tenure", { min: 0, max: 40 }) : "";
    if (fields.order !== undefined) update.order = Number.isFinite(Number(fields.order)) ? Number(fields.order) : 100;
    if (fields.photoUrl !== undefined) {
      const photos = validateImageUrls(fields.photoUrl ? [fields.photoUrl] : [], 1);
      update.photoUrl = photos[0] || "";
    }
    if (fields.mobileNumber !== undefined) {
      if (fields.mobileNumber === "") {
        update.mobileNumber = "";
      } else {
        const digits = String(fields.mobileNumber).replace(/\D/g, "");
        if (digits.length !== 10) return NextResponse.json({ error: "Mobile number must be 10 digits." }, { status: 400 });
        update.mobileNumber = digits;
      }
    }

    await adminDb.collection("directory").doc(id).update(update);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Directory Update Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "directory:manage");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await adminDb.collection("directory").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Directory Delete Error");
  }
}
