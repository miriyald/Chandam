import { getRuleSet } from '../config';
import { makeUrl } from '../utils/url-helpers';

export interface BreadcrumbItem {
  label: string;
  url?: string; // undefined = current page
}

// Main function: Render breadcrumbs HTML
export function renderBreadcrumbs(items: BreadcrumbItem[]): string {
  if (!items?.length) return '';

  const breadcrumbHtml = items.map((item, index) => {
    const isLast = index === items.length - 1;
    let itemHtml = '';

    if (isLast || !item.url) {
      itemHtml = `<span class="breadcrumb-current">${escapeHtml(item.label)}</span>`;
    } else {
      itemHtml = `<a href="${makeUrl(item.url)}" class="breadcrumb-link">${escapeHtml(item.label)}</a>`;
    }

    return itemHtml;
  }).join('<span class="breadcrumb-separator">›</span>');

  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml}</nav>`;
}

// Build breadcrumbs for rule set pages (Learn/Compute index)
export function buildRuleSetBreadcrumbs(ruleSetId: string, mode: 'compute' | 'learn'): BreadcrumbItem[] {
  const ruleSet = getRuleSet(ruleSetId);
  const ruleSetName = ruleSet ? ruleSet.name : ruleSetId;

  return [
    { label: 'Rule Sets', url: '/rule-sets' },
    { label: ruleSetName } // Current page (no url)
  ];
}

// Build breadcrumbs for rule pages (Learn/Compute detail)
export function buildRuleBreadcrumbs(
  ruleSetId: string,
  ruleId: string,
  ruleName: string,
  mode: 'compute' | 'learn'
): BreadcrumbItem[] {
  const ruleSet = getRuleSet(ruleSetId);
  const ruleSetName = ruleSet ? ruleSet.name : ruleSetId;

  return [
    { label: 'Rule Sets', url: '/rule-sets' },
    { label: ruleSetName, url: `/${mode}/${ruleSetId}/` }, // Link to current mode
    { label: ruleName } // Current page (no url)
  ];
}

// Build breadcrumbs for static pages (About, Contact, Credits)
export function buildStaticPageBreadcrumbs(pageName: string): BreadcrumbItem[] {
  return [
    { label: pageName } // Current page
  ];
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
