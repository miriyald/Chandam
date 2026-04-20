import type { RuleDto } from '../services/storage/rule-dto';
import { analyticsService } from '../services/analytics-service';

const GITHUB_REPO_URL = 'https://github.com/chandamu/chandam';

export interface CustomRulePayload {
  type: 'custom-rule';
  ruleName: string;
  ruleIdentifier: string;
  language: string;
  description: string;
  rule: RuleDto;
  examples: string[];
  exportedAt: string;
  version: string;
}

export interface ExamplePayload {
  type: 'new-example';
  ruleName: string;
  ruleSetId: string;
  ruleIdentifier: string;
  examples: string[];
  exportedAt: string;
  version: string;
}

export type SubmissionPayload = CustomRulePayload | ExamplePayload;

export function submitToGitHub(payload: SubmissionPayload, source: 'results' | 'learn_page'): void {
  downloadSubmissionFile(payload);
  analyticsService.trackEvent('submit_github_download', {
    ruleId: payload.ruleIdentifier,
    ruleSetId: payload.type === 'new-example' ? payload.ruleSetId : 'custom-rules',
    type: payload.type,
    source,
    exampleCount: payload.examples.length
  });

  openGitHubIssue(payload);
  analyticsService.trackEvent('submit_github_redirect', {
    ruleId: payload.ruleIdentifier,
    ruleSetId: payload.type === 'new-example' ? payload.ruleSetId : 'custom-rules',
    type: payload.type,
    source
  });
}

function downloadSubmissionFile(payload: SubmissionPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10);
  const typeLabel = payload.type === 'custom-rule' ? 'custom' : 'example';
  const filename = `chandam-${typeLabel}-${payload.ruleIdentifier}-${date}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openGitHubIssue(payload: SubmissionPayload): void {
  const url = new URL(`${GITHUB_REPO_URL}/issues/new`);

  if (payload.type === 'custom-rule') {
    url.searchParams.set('template', 'custom-rule-submission.md');
    url.searchParams.set('title', `[Custom Rule] ${payload.ruleName}`);
    url.searchParams.set('labels', 'custom-rule,community');
  } else {
    url.searchParams.set('template', 'new-examples.md');
    url.searchParams.set('title', `[New Example] ${payload.ruleName} (${payload.ruleSetId}/${payload.ruleIdentifier})`);
    url.searchParams.set('labels', 'examples,community');
  }

  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

export function buildCustomRulePayload(
  ruleName: string,
  ruleIdentifier: string,
  language: string,
  description: string,
  rule: RuleDto,
  examples: string[]
): CustomRulePayload {
  return {
    type: 'custom-rule',
    ruleName,
    ruleIdentifier,
    language,
    description,
    rule,
    examples,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
}

export function buildExamplePayload(
  ruleName: string,
  ruleSetId: string,
  ruleIdentifier: string,
  examples: string[]
): ExamplePayload {
  return {
    type: 'new-example',
    ruleName,
    ruleSetId,
    ruleIdentifier,
    examples,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
}

export function stripHtmlToText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}
