import type { RuleSummaryDetailed } from '../types';

/**
 * SubType ordering based on traditional Telugu poetry classification
 * (from legacy SortHelper2.cs and Helper.cs)
 */
const SUBTYPE_ORDER: Record<string, number> = {
  'Akkara': 1,
  'Divpada': 2,
  'Jati': 3,
  'Ragada': 4,
  'Ragada2': 5,
  'Shatpada': 6,
  'UpaJati': 7,
  'Sisamu': 8,
  'Vruttam': 9,
  'ArdhaVruttam': 10,
  'DaMDakamu': 11,
  'VishamaVruttam': 12,
  'GenricVruttam': 99,
  'Other': 100
};

/**
 * Telugu display names for PadyamSubTypes
 */
const SUBTYPE_TELUGU_NAMES: Record<string, string> = {
  'Akkara': 'జాతి(అక్కరలు)',
  'Divpada': 'జాతి(ద్విపదలు)',
  'Jati': 'జాతి',
  'Ragada': 'జాతి(రగడలు)',
  'Ragada2': 'జాతి(రగడలు)',
  'Shatpada': 'జాతి(షట్పదలు)',
  'UpaJati': 'ఉపజాతి',
  'Sisamu': 'ఉపజాతి(సీసములు)',
  'Vruttam': 'వృత్తం',
  'ArdhaVruttam': 'అర్ధ సమవృత్తం',
  'DaMDakamu': 'దండకము',
  'VishamaVruttam': 'విషమవృత్తం',
  'Other': 'ఇతర'
};

/**
 * Group rules by category for consistent organization
 * - Vruttams (subType=Vruttam): grouped by chandamName (e.g., "త్రిష్టుప్పు")
 * - Other subTypes: grouped by padyamSubType (e.g., "Jati", "UpaJati")
 * - Fallback: "Other" for rules with no grouping info
 */
export function groupRulesByCategory(rules: RuleSummaryDetailed[]): Map<string, RuleSummaryDetailed[]> {
  const grouped = new Map<string, RuleSummaryDetailed[]>();

  rules.forEach(rule => {
    let groupKey: string;

    // Vruttam subType: group by ChandamName
    if (rule.padyamType === 'Vruttam' && rule.padyamSubType === 'Vruttam' && rule.chandamName) {
      groupKey = `vruttam:${rule.chandamName}`;
    }
    // Non-Vruttam or special Vruttam subtypes: group by SubType
    else if (rule.padyamSubType) {
      groupKey = `subtype:${rule.padyamSubType}`;
    }
    // Fallback
    else {
      groupKey = 'subtype:Other';
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }

    grouped.get(groupKey)!.push(rule);
  });

  return grouped;
}

/**
 * Sort group keys by SubType order and character length for Vruttams
 * - SubTypes ordered by SUBTYPE_ORDER (Jati types, then UpaJati, then Vruttams, then special types)
 * - Vruttam ChandamName groups ordered by character length (gayatri=6 before trishtup=11)
 */
export function getSortedGroupKeys(grouped: Map<string, RuleSummaryDetailed[]>): string[] {
  return Array.from(grouped.keys()).sort((a, b) => {
    const [typeA, valueA] = a.split(':');
    const [typeB, valueB] = b.split(':');

    // Both are Vruttam ChandamName groups - sort by character length
    if (typeA === 'vruttam' && typeB === 'vruttam') {
      const rulesA = grouped.get(a)!;
      const rulesB = grouped.get(b)!;
      const charLengthA = rulesA[0]?.charLength ?? 999;
      const charLengthB = rulesB[0]?.charLength ?? 999;
      return charLengthA - charLengthB;
    }

    // Both are SubType groups - sort by SubType order
    if (typeA === 'subtype' && typeB === 'subtype') {
      const orderA = SUBTYPE_ORDER[valueA] ?? 100;
      const orderB = SUBTYPE_ORDER[valueB] ?? 100;
      return orderA - orderB;
    }

    // SubType groups come before Vruttam groups
    if (typeA === 'subtype') return -1;
    if (typeB === 'subtype') return 1;

    return 0;
  });
}

/**
 * Convert group key to Telugu display name
 * - For Vruttam groups: returns the ChandamName (already in Telugu)
 * - For SubType groups: returns the Telugu name from SUBTYPE_TELUGU_NAMES
 */
export function getGroupDisplayName(groupKey: string): string {
  const [type, value] = groupKey.split(':');

  if (type === 'vruttam') {
    return value; // ChandamName is already in Telugu
  }

  if (type === 'subtype') {
    return SUBTYPE_TELUGU_NAMES[value] || value;
  }

  return value;
}
