import { getRuleSet } from '../config';
import { makeUrl } from '../utils/url-helpers';

export interface BreadcrumbItem {
  label: string;
  url?: string; // undefined = current page
  modes?: { label: string; url: string; current?: boolean }[]; // Optional mode links (Learn/Compute)
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

    // Add mode links if present
    if (item.modes && item.modes.length > 0) {
      const modeLinksHtml = item.modes.map(mode => {
        if (mode.current) {
          return `<span class="breadcrumb-mode-current">${escapeHtml(mode.label)}</span>`;
        } else {
          return `<a href="${makeUrl(mode.url)}" class="breadcrumb-mode-link">${escapeHtml(mode.label)}</a>`;
        }
      }).join('');
      itemHtml += `<span class="breadcrumb-modes">${modeLinksHtml}</span>`;
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
    { label: 'Home', url: '/' },
    { label: 'Rule Sets', url: '/rule-sets' },
    {
      label: ruleSetName,
      modes: [
        {
          label: 'Learn',
          url: `/learn/${ruleSetId}/`,
          current: mode === 'learn'
        },
        {
          label: 'Compute',
          url: `/compute/${ruleSetId}/`,
          current: mode === 'compute'
        }
      ]
    }
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
    { label: 'Home', url: '/' },
    { label: 'Rule Sets', url: '/rule-sets' },
    {
      label: ruleSetName,
      url: `/${mode}/${ruleSetId}/`,
      modes: [
        {
          label: 'Learn',
          url: `/learn/${ruleSetId}/`,
          current: mode === 'learn'
        },
        {
          label: 'Compute',
          url: `/compute/${ruleSetId}/`,
          current: mode === 'compute'
        }
      ]
    },
    {
      label: ruleName,
      modes: [
        {
          label: 'Learn',
          url: `/learn/${ruleSetId}/${ruleId}`,
          current: mode === 'learn'
        },
        {
          label: 'Compute',
          url: `/compute/${ruleSetId}/${ruleId}`,
          current: mode === 'compute'
        }
      ]
    }
  ];
}

// Build breadcrumbs for static pages (About, Contact, Credits)
export function buildStaticPageBreadcrumbs(pageName: string): BreadcrumbItem[] {
  return [
    { label: 'Home', url: '/' },
    { label: pageName } // Current page
  ];
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
