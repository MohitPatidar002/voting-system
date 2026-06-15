import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebase/admin";
import { Household } from "../../../../types";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(token);
  
  if (!decodedToken.phone_number) {
    throw new Error("Forbidden: No phone number associated with token");
  }
  const adminQuery = await adminDb.collection("admins").where("mobileNumber", "==", decodedToken.phone_number).get();
  if (adminQuery.empty) {
    throw new Error("Forbidden: Admin access required");
  }
  return decodedToken;
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const { representativeName, mobileNumber, address } = body;

    if (!representativeName || !mobileNumber || !address) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Format and validate mobile number
    const formattedNumber = mobileNumber.startsWith("+") ? mobileNumber : `+91${mobileNumber}`;
    if (!/^\+91[0-9]{10}$/.test(formattedNumber)) {
      return NextResponse.json({ error: "Invalid mobile number format." }, { status: 400 });
    }

    // Check if mobile number already exists in households or admins
    const existingHousehold = await adminDb.collection("households").where("mobileNumber", "==", formattedNumber).get();
    if (!existingHousehold.empty) {
      return NextResponse.json({ error: "Mobile number is already registered to another household." }, { status: 400 });
    }

    const newHousehold: Omit<Household, 'id'> = {
      representativeName,
      mobileNumber: formattedNumber,
      address,
      isActive: true,
      registrationDate: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection("households").add(newHousehold);
    return NextResponse.json({ success: true, householdId: docRef.id });

  } catch (error: any) {
    console.error("Household Creation Error:", error);
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);
    const snapshot = await adminDb.collection("households").orderBy("registrationDate", "desc").get();
    const households = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      registrationDate: doc.data().registrationDate?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));
    return NextResponse.json({ households });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
