import {
  scoreTenderMatch,
  type MatchProfile,
  type MatchTender,
  type TenderMatch,
} from "./score-tender";

export type ScoredAiCandidate<T> = {
  tender: T;
  deterministicMatch: TenderMatch;
};

export function selectAiMatchingCandidates<T extends MatchTender>(
  profile: MatchProfile,
  tenders: T[],
  limit = 10,
): ScoredAiCandidate<T>[] {
  const scored = tenders.map((tender) => ({
      tender,
      deterministicMatch: scoreTenderMatch(profile, tender),
    }));
  const positive = scored
    .filter(({ deterministicMatch }) => deterministicMatch.hasDirectScopeMatch)
    .sort(
      (left, right) =>
        right.deterministicMatch.score - left.deterministicMatch.score ||
        left.tender.titleArabic.localeCompare(right.tender.titleArabic),
    );
  const exploration = scored.filter(
    ({ deterministicMatch }) => !deterministicMatch.hasDirectScopeMatch,
  );

  return [...positive, ...exploration].slice(0, limit);
}
