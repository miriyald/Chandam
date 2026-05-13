import type { RuleDto } from '../services/storage/rule-dto';
import { analyticsService } from '../services/analytics-service';
import { GITHUB_REPO_URL } from '../constants';

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

export function submitToGitHub(payload: SubmissionPayload, source: 'results' | 'learn_page' | 'rule_actions'): void {
  const doneDownload = analyticsService.startTimedEvent('submit_github_download', {
    ruleId: payload.ruleIdentifier,
    ruleSetId: payload.type === 'new-example' ? payload.ruleSetId : 'custom-rules',
    type: payload.type,
    source,
    exampleCount: payload.examples.length
  });
  const filename = downloadSubmissionFile(payload);
  doneDownload();

  const doneRedirect = analyticsService.startTimedEvent('submit_github_redirect', {
    ruleId: payload.ruleIdentifier,
    ruleSetId: payload.type === 'new-example' ? payload.ruleSetId : 'custom-rules',
    type: payload.type,
    source
  });
  openGitHubIssue(payload, filename);
  doneRedirect();
}

function buildSubmissionFilename(payload: SubmissionPayload): string {
  const date = new Date().toISOString().slice(0, 10);
  const typeLabel = payload.type === 'custom-rule' ? 'custom' : 'example';
  return `chandam-${typeLabel}-${payload.ruleIdentifier}-${date}.json`;
}

function downloadSubmissionFile(payload: SubmissionPayload): string {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = buildSubmissionFilename(payload);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

function buildIssueBody(payload: SubmissionPayload, filename: string): string {
  if (payload.type === 'custom-rule') {
    return [
      '## Custom Rule Submission',
      '',
      `**Rule Name**: ${payload.ruleName}`,
      `**Language**: ${payload.language}`,
      `**Rule Identifier**: ${payload.ruleIdentifier}`,
      '',
      '### Required Attachment',
      `Please upload the downloaded JSON file: \`${filename}\``,
      'Drag and drop it into this issue body before submitting.',
      '',
      '### Additional Context',
      '<!-- Add references, source texts, or notes about this meter -->'
    ].join('\n');
  }

  return [
    '## New Example Submission',
    '',
    `**Rule Name**: ${payload.ruleName}`,
    `**Rule Set**: ${payload.ruleSetId}`,
    `**Rule Identifier**: ${payload.ruleIdentifier}`,
    '',
    '### Required Attachment',
    `Please upload the downloaded JSON file: \`${filename}\``,
    'Drag and drop it into this issue body before submitting.',
    '',
    '### Source / Attribution',
    '- **Author**: ',
    '- **Source text**: '
  ].join('\n');
}

function openGitHubIssue(payload: SubmissionPayload, filename: string): void {
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

  url.searchParams.set('body', buildIssueBody(payload, filename));

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
