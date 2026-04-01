import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import type { RuleSummaryDetailed } from '../types';

// Main function: Render learn index page
export async function renderLearnIndexPage(ruleSet: string) {
  // Step 1: Validate and load rule set
  const ruleSetConfig = getRuleSet(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);

  // Step 2: Get all rules with detailed metadata
  const rules = await WasmBridge.getAllRulesDetailed();

  // Step 3: Group rules by chandamName, then by padyamType
  const grouped = groupRules(rules);

  // Step 4: Render page HTML
  renderLearnIndexPageHtml(ruleSetConfig.name, rules.length, ruleSet, grouped);
}

// Helper: Load rule set if needed
async function loadRuleSet(rulesFile: string, examplesFile: string) {
  try {
    const result = await WasmBridge.reloadRules(rulesFile, examplesFile);
    if (!result.success) {
      console.error('Failed to load rules:', result.errorMessage);
    }
  } catch (err) {
    console.error('Failed to load rule set:', err);
  }
}

// Helper: Group rules by chandamName, then by padyamType
function groupRules(rules: RuleSummaryDetailed[]): Map<string, Map<string, RuleSummaryDetailed[]>> {
  const grouped = new Map<string, Map<string, RuleSummaryDetailed[]>>();

  rules.forEach(rule => {
    const chandamName = rule.chandamName || 'Unknown';
    const padyamType = rule.padyamType;

    if (!grouped.has(chandamName)) {
      grouped.set(chandamName, new Map());
    }

    const chandamGroup = grouped.get(chandamName)!;
    if (!chandamGroup.has(padyamType)) {
      chandamGroup.set(padyamType, []);
    }

    chandamGroup.get(padyamType)!.push(rule);
  });

  return grouped;
}

// Helper: Render page HTML
function renderLearnIndexPageHtml(
  ruleSetName: string,
  ruleCount: number,
  ruleSetId: string,
  grouped: Map<string, Map<string, RuleSummaryDetailed[]>>
) {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="learn-index-page">
      <h1>Learn: ${ruleSetName}</h1>
      <div class="rule-count">${ruleCount} Rules</div>

      <div class="page-links">
        <a href="/compute/${ruleSetId}/" class="compute-link">✏️ Go to Analyzer</a>
      </div>

      <div class="chandam-groups">
        ${renderChandamGroups(grouped, ruleSetId)}
      </div>
    </div>
  `;
}

// Helper: Render all chandamName groups
function renderChandamGroups(
  grouped: Map<string, Map<string, RuleSummaryDetailed[]>>,
  ruleSetId: string
): string {
  const sortedChandamNames = Array.from(grouped.keys()).sort();

  return sortedChandamNames.map(chandamName => {
    const typeGroups = grouped.get(chandamName)!;
    return `
      <div class="chandam-group">
        <h2>${chandamName}</h2>
        ${renderTypeGroups(typeGroups, ruleSetId)}
      </div>
    `;
  }).join('');
}

// Helper: Render type groups within a chandamName group
function renderTypeGroups(
  typeGroups: Map<string, RuleSummaryDetailed[]>,
  ruleSetId: string
): string {
  const sortedTypes = Array.from(typeGroups.keys()).sort();

  return sortedTypes.map(padyamType => {
    const rules = typeGroups.get(padyamType)!;
    return `
      <div class="type-group">
        <h3>${padyamType}</h3>
        ${rules.map(rule => renderRuleListItem(rule, ruleSetId)).join('')}
      </div>
    `;
  }).join('');
}

// Helper: Render a single rule list item
function renderRuleListItem(rule: RuleSummaryDetailed, ruleSetId: string): string {
  const metadata = [];
  if (rule.charLength) metadata.push(`${rule.charLength} chars`);
  if (rule.matraLength) metadata.push(`${rule.matraLength} matras`);
  if (rule.frequency) metadata.push(rule.frequency);

  return `
    <div class="rule-list-item">
      <div class="rule-name">${rule.name}</div>
      <div class="rule-meta">${metadata.join(' | ')}</div>
      <div class="rule-links">
        <a href="/learn/${ruleSetId}/${rule.identifier}" class="learn-more-link">Learn</a>
        <a href="/compute/${ruleSetId}/${rule.identifier}" class="try-link">Try</a>
      </div>
    </div>
  `;
}
