import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase/admin";

/**
 * Public budget transparency. Returns the ledger for a financial year, plus
 * roll-ups by head and an overall receipt/expenditure summary so villagers can
 * see where the panchayat's money comes from and where it goes.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fy = searchParams.get("fy");

    let query: FirebaseFirestore.Query = adminDb.collection("budget");
    if (fy && /^\d{4}-\d{4}$/.test(fy)) {
      query = query.where("financialYear", "==", fy);
    }
    const snapshot = await query.get();

    let totalReceipts = 0;
    let totalExpenditure = 0;
    const byHead: Record<string, { receipt: number; expenditure: number }> = {};
    const years = new Set<string>();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      years.add(data.financialYear);
      if (data.category === "receipt") totalReceipts += amount;
      else totalExpenditure += amount;

      const head = data.head || "Other";
      byHead[head] = byHead[head] || { receipt: 0, expenditure: 0 };
      if (data.category === "receipt") byHead[head].receipt += amount;
      else byHead[head].expenditure += amount;

      return {
        id: doc.id,
        financialYear: data.financialYear,
        head,
        category: data.category,
        amount,
        description: data.description || "",
        date: data.date?.toDate().toISOString() ?? null,
      };
    });

    entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return NextResponse.json(
      {
        entries,
        summary: {
          totalReceipts,
          totalExpenditure,
          balance: totalReceipts - totalExpenditure,
          byHead,
          availableYears: [...years].sort().reverse(),
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180" } }
    );
  } catch (error) {
    console.error("Public Budget Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
