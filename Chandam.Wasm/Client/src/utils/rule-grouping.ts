import type { RuleSummaryDetailed } from '../types';

/**
 * Group rules by category for consistent organization
 * - Vruttams: grouped by chandamName (e.g., "త్రిష్టుప్పు")
 * - Others: grouped by chandamName if available, else padyamType
 * - Fallback: "Other" for rules with no grouping info
 */
export function groupRulesByCategory(rules: RuleSummaryDetailed[]): Map<string, RuleSummaryDetailed[]> {
  const grouped = new Map<string, RuleSummaryDetailed[]>();

  rules.forEach(rule => {
    let groupKey: string;

    if (rule.padyamType === 'Vruttam' && rule.chandamName) {
      // Vruttams: use chandamName only (NO suffix)
      groupKey = rule.chandamName;
    } else if (rule.chandamName) {
      // Has chandamName but not Vruttam: use chandamName
      groupKey = rule.chandamName;
    } else {
      // No chandamName: use padyamType or "Other"
      groupKey = rule.padyamType || 'Other';
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }

    grouped.get(groupKey)!.push(rule);
  });

  return grouped;
}

/**
 * Sort group keys alphabetically (Telugu script aware)
 */
export function getSortedGroupKeys(grouped: Map<string, RuleSummaryDetailed[]>): string[] {
  return Array.from(grouped.keys()).sort((a, b) => {
    return a.localeCompare(b, 'te');
  });
}
