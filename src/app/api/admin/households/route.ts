import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase/admin";
import { errorResponse } from "../../../../lib/auth";
import { requireCapability } from "../../../../lib/permissions";
import { cleanText } from "../../../../lib/validate";

export async function POST(request: Request) {
  try {
    await requireCapability(request, "household:manage");
    const body = await request.json();

    const representativeName = cleanText(body.representativeName, "Name", { max: 150 });
    const address = cleanText(body.address, "Address", { max: 500 });

    if (typeof body.mobileNumber !== "string") {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    const formattedNumber = body.mobileNumber.startsWith("+")
      ? body.mobileNumber
      : `+91${body.mobileNumber}`;
    if (!/^\+91[0-9]{10}$/.test(formattedNumber)) {
      return NextResponse.json({ error: "Invalid mobile number format." }, { status: 400 });
    }

    // A number may belong to only one household, and never to an admin.
    const [existingHousehold, existingAdmin] = await Promise.all([
      adminDb.collection("households").where("mobileNumber", "==", formattedNumber).limit(1).get(),
      adminDb.collection("admins").where("mobileNumber", "==", formattedNumber).limit(1).get(),
    ]);
    if (!existingHousehold.empty || !existingAdmin.empty) {
      return NextResponse.json(
        { error: "Mobile number is already registered." },
        { status: 409 }
      );
    }

    const now = new Date();
    const docRef = await adminDb.collection("households").add({
      representativeName,
      mobileNumber: formattedNumber,
      address,
      isActive: true,
      registrationDate: now,
      updatedAt: now,
    });
    return NextResponse.json({ success: true, householdId: docRef.id });
  } catch (error) {
    return errorResponse(error, "Household Creation Error");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCapability(request, "household:manage");
    const body = await request.json();
    if (typeof body.householdId !== "string") {
      return NextResponse.json({ error: "householdId is required." }, { status: 400 });
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.representativeName !== undefined) {
      updates.representativeName = cleanText(body.representativeName, "Name", { max: 150 });
    }
    if (body.address !== undefined) {
      updates.address = cleanText(body.address, "Address", { max: 500 });
    }
    if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive;
    }
    await adminDb.collection("households").doc(body.householdId).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Household Update Error");
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCapability(request, "household:manage");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await adminDb.collection("households").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Household Delete Error");
  }
}

export async function GET(request: Request) {
  try {
    await requireCapability(request, "household:manage");
    const snapshot = await adminDb
      .collection("households")
      .orderBy("registrationDate", "desc")
      .get();
    const households = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        registrationDate: data.registrationDate?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    });
    return NextResponse.json({ households });
  } catch (error) {
    return errorResponse(error, "Households Fetch Error");
  }
}
