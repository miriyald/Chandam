import { WasmBridge } from '../wasm-bridge';
import { getRuleSetAsync } from '../config';
import { renderBreadcrumbs, buildRuleSetBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { loadRuleSet } from '../utils/rule-loader';
import { buildTaxonomyGraph } from '../services/graph-data-service';
import { renderGraph } from './graph-renderer';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { makeUrl } from '../utils/url-helpers';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import type { GraphNode } from '../services/graph-data-service';

export async function renderExplorePage(ruleSet: string) {
  const ruleSetConfig = await getRuleSetAsync(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  setPageTitle(t('mode_explore') + ' ' + ruleSetConfig.name);

  if (ruleSetConfig.rulesFile) {
    await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);
  } else {
    await CustomRulesLoader.loadCustomRuleset(ruleSet);
  }

  const rules = await WasmBridge.getAllRulesDetailed();

  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildRuleSetBreadcrumbs(ruleSet, 'explore');

  content.innerHTML = `
    <div class="explore-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="page-header-controls">
        <h1>${ruleSetConfig.name}</h1>
        ${renderModeSwitcher({ ruleSetId: ruleSet, currentMode: 'explore' })}
      </div>
      <div class="page-subtitle">${rules.length} ${t('label_rules_count')} — ${t('mode_explore')}</div>

      <div class="graph-controls">
        <span class="graph-hint">${t('explore_graph_hint')}</span>
      </div>

      <div id="graph-container" class="graph-container"></div>
    </div>
  `;

  const graphContainer = document.getElementById('graph-container');
  if (!graphContainer) return;

  const graphData = buildTaxonomyGraph(rules, ruleSetConfig.name);

  const maxNodes = rules.length > 500 ? 300 : undefined;

  await renderGraph({
    container: graphContainer,
    data: graphData,
    maxNodes,
    onNodeClick: (node: GraphNode) => {
      if (node.ruleId) {
        window.location.href = makeUrl(`/learn/${ruleSet}/${node.ruleId}`);
      }
    },
  });
}
