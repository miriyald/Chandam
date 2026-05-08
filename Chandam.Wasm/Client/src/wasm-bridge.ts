import type {
  RuleSummary,
  RuleSummaryDetailed,
  DetermineResponse,
  TryMatchResponse,
  ScoresResponse,
  RuleInfo,
  AvailableFilters
} from './types';

declare const DotNet: {
  invokeMethodAsync<T>(assemblyName: string, methodName: string, ...args: unknown[]): Promise<T>;
};

export class WasmBridge {
  private static readonly ASSEMBLY = 'Chandam.Wasm';

  static async getAllRules(language: string = 'te'): Promise<RuleSummary[]> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetAllRules',
      language
    );
    return JSON.parse(json);
  }

  static async getAllRulesDetailed(language: string = 'te'): Promise<RuleSummaryDetailed[]> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetAllRulesDetailed',
      language
    );
    return JSON.parse(json);
  }

  static async determine(
    poemText: string,
    matchYati: boolean,
    matchPrasa: boolean,
    language: string = 'te'
  ): Promise<DetermineResponse> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'Determine',
      poemText,
      matchYati,
      matchPrasa,
      language
    );
    return JSON.parse(json);
  }

  static async tryMatch(
    poemText: string,
    ruleId: string,
    matchYati: boolean,
    matchPrasa: boolean
  ): Promise<TryMatchResponse> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'TryMatch',
      poemText,
      ruleId,
      matchYati,
      matchPrasa
    );
    return JSON.parse(json);
  }

  static async getScores(
    poemText: string,
    matchYati: boolean,
    matchPrasa: boolean,
    minPercentage: number = 50
  ): Promise<ScoresResponse> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetScores',
      poemText,
      matchYati,
      matchPrasa,
      minPercentage
    );
    return JSON.parse(json);
  }

  static async getRuleInfo(ruleId: string): Promise<RuleInfo> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetRuleInfo',
      ruleId
    );
    return JSON.parse(json);
  }

  static async getRuleDto(ruleId: string): Promise<any> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetRuleDto',
      ruleId
    );
    return JSON.parse(json);
  }

  static async getRandomPoem(ruleId: string): Promise<string> {
    return await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetRandomPoem',
      ruleId
    );
  }

  static async getRandomPoemFromRuleSet(language: string = 'te'): Promise<string> {
    return await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetRandomPoemFromRuleSet',
      language
    );
  }

  static async reloadRules(rulesFile: string, examplesFile: string): Promise<{ success: boolean; message?: string; errorMessage?: string }> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'ReloadRules',
      rulesFile,
      examplesFile
    );
    return JSON.parse(json);
  }

  static async searchRules(filters: {
    query?: string;
    categories?: string[];
    chandamNames?: string[];
    frequencies?: string[];
    matraLengthMin?: number;
    matraLengthMax?: number;
    hasExamples?: boolean | null;
    maxResults?: number;
  }, language: string = 'te'): Promise<RuleSummaryDetailed[]> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'SearchRules',
      filters.query || null,
      filters.categories?.join(',') || null,
      filters.chandamNames?.join(',') || null,
      filters.frequencies?.join(',') || null,
      filters.matraLengthMin || null,
      filters.matraLengthMax || null,
      filters.hasExamples,
      filters.maxResults || 0,
      language
    );
    return JSON.parse(json);
  }

  static async getVersion(): Promise<string> {
    return await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetVersion'
    );
  }

  static async getBuildDate(): Promise<string> {
    return await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetBuildDate'
    );
  }

  static async getAvailableFilters(language: string = 'te'): Promise<AvailableFilters> {
    const json = await DotNet.invokeMethodAsync<string>(
      this.ASSEMBLY,
      'GetAvailableFilters',
      language
    );
    return JSON.parse(json);
  }
}
