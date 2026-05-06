import type { RuleSummaryDetailed } from '../types';

export interface GraphNode {
  id: string;
  label: string;
  type: 'root' | 'padyamType' | 'padyamSubType' | 'chandamName' | 'rule';
  childCount?: number;
  frequency?: string;
  charLength?: number;
  matraLength?: number;
  ruleId?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'taxonomy';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildTaxonomyGraph(rules: RuleSummaryDetailed[], ruleSetName: string): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  const rootId = 'root';
  nodes.push({ id: rootId, label: ruleSetName, type: 'root', childCount: rules.length });

  const byPadyamType = groupBy(rules, r => r.padyamType);

  for (const [padyamType, ptRules] of byPadyamType) {
    const ptId = `pt:${padyamType}`;
    if (!seen.has(ptId)) {
      seen.add(ptId);
      nodes.push({ id: ptId, label: padyamType, type: 'padyamType', childCount: ptRules.length });
      edges.push({ source: rootId, target: ptId, type: 'taxonomy' });
    }

    const bySubType = groupBy(ptRules, r => r.padyamSubType);

    for (const [subType, stRules] of bySubType) {
      const stId = `st:${padyamType}:${subType}`;
      if (!seen.has(stId)) {
        seen.add(stId);
        nodes.push({ id: stId, label: subType, type: 'padyamSubType', childCount: stRules.length });
        edges.push({ source: ptId, target: stId, type: 'taxonomy' });
      }

      const byChandam = groupBy(stRules, r => r.chandamName || '');

      for (const [chandamName, cnRules] of byChandam) {
        if (chandamName) {
          const cnId = `cn:${padyamType}:${subType}:${chandamName}`;
          if (!seen.has(cnId)) {
            seen.add(cnId);
            nodes.push({ id: cnId, label: chandamName, type: 'chandamName', childCount: cnRules.length });
            edges.push({ source: stId, target: cnId, type: 'taxonomy' });
          }

          for (const rule of cnRules) {
            const ruleId = `r:${rule.identifier}`;
            nodes.push({
              id: ruleId,
              label: rule.shortName || rule.name,
              type: 'rule',
              frequency: rule.frequency,
              charLength: rule.charLength,
              matraLength: rule.matraLength,
              ruleId: rule.identifier,
            });
            edges.push({ source: cnId, target: ruleId, type: 'taxonomy' });
          }
        } else {
          for (const rule of cnRules) {
            const ruleId = `r:${rule.identifier}`;
            nodes.push({
              id: ruleId,
              label: rule.shortName || rule.name,
              type: 'rule',
              frequency: rule.frequency,
              charLength: rule.charLength,
              matraLength: rule.matraLength,
              ruleId: rule.identifier,
            });
            edges.push({ source: stId, target: ruleId, type: 'taxonomy' });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k);
    if (arr) arr.push(item);
    else map.set(k, [item]);
  }
  return map;
}
