import { readFileSync, existsSync } from "node:fs";

export type AliasMap = Record<string, string>;

/** raw name (trimmed, as scraped) -> canonical name. Starts empty; edited by hand. */
export function loadAliases(path: string | URL): AliasMap {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function applyAlias(name: string, aliases: AliasMap): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return aliases[trimmed] ?? trimmed;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

export interface AliasSuggestion {
  a: string;
  b: string;
  distance: number;
}

/**
 * Suggests likely-same-person name pairs (typos, nickname vs. full name)
 * among names not already covered by an existing alias entry. Purely
 * advisory - never auto-applied. Human reviews and adds confirmed merges
 * to aliases.json.
 */
export function suggestAliases(names: string[], aliases: AliasMap): AliasSuggestion[] {
  const canonicalized = new Set(names.map((n) => applyAlias(n, aliases)));
  const distinct = Array.from(canonicalized).sort();
  const suggestions: AliasSuggestion[] = [];

  for (let i = 0; i < distinct.length; i++) {
    for (let j = i + 1; j < distinct.length; j++) {
      const a = distinct[i];
      const b = distinct[j];
      const lastA = a.split(" ").pop() ?? "";
      const lastB = b.split(" ").pop() ?? "";
      if (lastA.toLowerCase() !== lastB.toLowerCase()) continue; // only compare same-surname pairs
      const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
      if (distance > 0 && distance <= 2) {
        suggestions.push({ a, b, distance });
      }
    }
  }

  return suggestions;
}
