import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";

/**
 * Public village directory of officials and front-line workers. Non-sensitive
 * contact info that helps villagers reach the right person, so it is readable
 * without auth and CDN-cached.
 */
export async function GET() {
  try {
    const snapshot = await adminDb.collection("directory").orderBy("order", "asc").get();
    const members = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        designation: data.designation,
        ward: data.ward || "",
        mobileNumber: data.mobileNumber || "",
        tenure: data.tenure || "",
        photoUrl: data.photoUrl || "",
      };
    });

    return NextResponse.json(
      { members },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("Public Directory Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
