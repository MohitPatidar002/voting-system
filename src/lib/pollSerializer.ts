/**
 * Shapes a poll document for villager-facing responses.
 *
 * Two things are deliberately withheld here:
 *  - `createdBy` (internal admin uid) is never sent to villagers.
 *  - Live tallies (`results`, `totalVotes`) are only revealed once the caller
 *    has voted or the poll is over. Exposing a running count to people who
 *    haven't voted yet lets the tally influence their vote — the API must
 *    enforce this, not just the UI.
 */
export function serializePollForVillager(
  id: string,
  data: FirebaseFirestore.DocumentData,
  hasVoted: boolean
) {
  const now = new Date();
  const end = data.endDate?.toDate?.() ?? null;
  const isOver = data.status === "closed" || (end !== null && end < now);
  const showResults = hasVoted || isOver;

  return {
    id,
    title: data.title,
    description: data.description,
    status: data.status,
    type: data.type,
    options: data.options,
    allowMultiple: !!data.allowMultiple,
    totalVotes: showResults ? data.totalVotes || 0 : null,
    results: showResults ? data.results || {} : null,
    hasVoted,
    startDate: data.startDate?.toDate().toISOString(),
    endDate: data.endDate?.toDate().toISOString(),
    createdAt: data.createdAt?.toDate().toISOString(),
  };
}
