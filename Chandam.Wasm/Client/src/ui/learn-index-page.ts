import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import type { RuleSummaryDetailed } from '../types';
import { groupRulesByCategory, getSortedGroupKeys } from '../utils/rule-grouping';
import { makeUrl } from '../utils/url-helpers';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';

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

  // Step 3: Group rules by category using shared utility
  const grouped = groupRulesByCategory(rules);

  // Step 4: Render page HTML
  renderLearnIndexPageHtml(ruleSetConfig.name, rules.length, ruleSet, grouped);
}


// Helper: Render page HTML
function renderLearnIndexPageHtml(
  ruleSetName: string,
  ruleCount: number,
  ruleSetId: string,
  grouped: Map<string, RuleSummaryDetailed[]>
) {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="learn-index-page">
      <h1>${t('learn_title_prefix')} ${ruleSetName}</h1>
      <div class="rule-count">${ruleCount} ${t('label_rules_count')}</div>

      <div class="page-links">
        <a href="${makeUrl(`/compute/${ruleSetId}/`)}" class="compute-link">${t('link_go_to_compute')}</a>
      </div>

      <div class="chandam-groups">
        ${renderChandamGroups(grouped, ruleSetId)}
      </div>
    </div>
  `;
}

// Helper: Render all chandam groups
function renderChandamGroups(
  grouped: Map<string, RuleSummaryDetailed[]>,
  ruleSetId: string
): string {
  const sortedKeys = getSortedGroupKeys(grouped);

  return sortedKeys.map(groupKey => {
    const rules = grouped.get(groupKey)!;
    return `
      <div class="chandam-group">
        <h2>${groupKey}</h2>
        ${rules.map(rule => renderRuleListItem(rule, ruleSetId)).join('')}
      </div>
    `;
  }).join('');
}


// Helper: Render a single rule list item
function renderRuleListItem(rule: RuleSummaryDetailed, ruleSetId: string): string {
  const metadata = [];

  // Show char length range (if available and not -1)
  if (rule.min && rule.max && rule.min !== -1 && rule.max !== -1) {
    if (rule.min === rule.max) {
      metadata.push(`${rule.min} ${t('metric_chars')}`);
    } else {
      metadata.push(`${rule.min}-${rule.max} ${t('metric_chars')}`);
    }
  } else if (rule.charLength && rule.charLength !== -1) {
    metadata.push(`${rule.charLength} ${t('metric_chars')}`);
  }

  // Show matra length (if available and not -1)
  if (rule.matraLength && rule.matraLength !== -1) {
    metadata.push(`${rule.matraLength} ${t('metric_matras')}`);
  }

  // Don't show frequency (removed per user request)

  return `
    <div class="rule-list-item">
      <div class="rule-name meter-name">${rule.name}</div>
      <div class="rule-meta">${metadata.join(' | ')}</div>
      <div class="rule-links">
        <a href="${makeUrl(`/learn/${ruleSetId}/${rule.identifier}`)}">${t('link_learn')}</a>
        <a href="${makeUrl(`/compute/${ruleSetId}/${rule.identifier}`)}">${t('link_try')}</a>
      </div>
    </div>
  `;
}
