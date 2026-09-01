import {
  SimilarityAction,
  SimilarityCheckResult,
  SimilarityProjectInput,
  SimilarProjectResult,
} from './similarity.types';

export class SimilarityService {
  private readonly stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'in',
    'into',
    'is',
    'of',
    'on',
    'or',
    'the',
    'to',
    'with',
    'using',
    'use',
    'based',
    'system',
    'application',
    'project',
    'platform',
    'solution',
    'development',
  ]);

  /**
   * Common words/phrases that should be treated
   * as equivalent.
   */
  private readonly synonyms: Record<string, string> = {
    ai: 'artificialintelligence',
    artificialintelligence: 'artificialintelligence',
    ml: 'machinelearning',
    machinelearning: 'machinelearning',
    webapp: 'webapplication',
    webapplication: 'webapplication',
    app: 'application',
    portal: 'platform',
    management: 'manage',
    manager: 'manage',
    managing: 'manage',
    analytics: 'analysis',
    analyse: 'analysis',
    analyzing: 'analysis',
    monitoring: 'monitor',
    monitored: 'monitor',
  };

  /**
   * Normalize text before comparison.
   */
  private normalizeText(
    text?: string | null
  ): string {
    if (!text) {
      return '';
    }

    return text
      .toLowerCase()
      .replace(/artificial intelligence/g, 'artificialintelligence')
      .replace(/machine learning/g, 'machinelearning')
      .replace(/web application/g, 'webapplication')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize a token using synonym mappings.
   */
  private normalizeToken(
    token: string
  ): string {
    return this.synonyms[token] || token;
  }

  /**
   * Convert text into meaningful tokens.
   */
  private getTokens(
    text?: string | null
  ): Set<string> {
    const normalized =
      this.normalizeText(text);

    if (!normalized) {
      return new Set();
    }

    const tokens = normalized
      .split(' ')
      .map((word) =>
        this.normalizeToken(word)
      )
      .filter(
        (word) =>
          word.length > 2 &&
          !this.stopWords.has(word)
      );

    return new Set(tokens);
  }

  /**
   * Jaccard similarity.
   *
   * intersection / union
   */
  private calculateJaccardSimilarity(
    textA?: string | null,
    textB?: string | null
  ): number {
    const tokensA =
      this.getTokens(textA);

    const tokensB =
      this.getTokens(textB);

    if (
      tokensA.size === 0 ||
      tokensB.size === 0
    ) {
      return 0;
    }

    const intersection =
      [...tokensA].filter(
        (token) => tokensB.has(token)
      );

    const union = new Set([
      ...tokensA,
      ...tokensB,
    ]);

    return (
      intersection.length /
      union.size
    ) * 100;
  }

  /**
   * Containment similarity.
   *
   * Useful when one title contains most of
   * the meaningful words of another title.
   */
  private calculateContainmentSimilarity(
    textA?: string | null,
    textB?: string | null
  ): number {
    const tokensA =
      this.getTokens(textA);

    const tokensB =
      this.getTokens(textB);

    if (
      tokensA.size === 0 ||
      tokensB.size === 0
    ) {
      return 0;
    }

    const intersection =
      [...tokensA].filter(
        (token) => tokensB.has(token)
      ).length;

    const smallerSet =
      Math.min(
        tokensA.size,
        tokensB.size
      );

    return (
      intersection /
      smallerSet
    ) * 100;
  }

  /**
   * Calculate text similarity using both
   * Jaccard and containment similarity.
   */
  private calculateTextSimilarity(
    textA?: string | null,
    textB?: string | null
  ): number {
    const jaccard =
      this.calculateJaccardSimilarity(
        textA,
        textB
      );

    const containment =
      this.calculateContainmentSimilarity(
        textA,
        textB
      );

    return Math.round(
      jaccard * 0.7 +
      containment * 0.3
    );
  }

  /**
   * Convert similarity score into
   * system action.
   *
   * 0-49   -> ALLOW
   * 50-69  -> WARNING
   * 70-85  -> REVIEW_REQUIRED
   * 86-100 -> BLOCK
   */
  getSimilarityAction(
    score: number
  ): SimilarityAction {
    if (score > 85) {
      return 'BLOCK';
    }

    if (score >= 70) {
      return 'REVIEW_REQUIRED';
    }

    if (score >= 50) {
      return 'WARNING';
    }

    return 'ALLOW';
  }

  /**
   * Compare two projects.
   *
   * Weighting:
   *
   * Title       65%
   * Description 30%
   * Domain       5%
   */
  compareProjects(
    projectA: SimilarityProjectInput,
    projectB: SimilarityProjectInput
  ): {
    similarityScore: number;
    titleSimilarity: number;
    descriptionSimilarity: number;
    domainSimilarity: number;
    action: SimilarityAction;
  } {
    const titleSimilarity =
      this.calculateTextSimilarity(
        projectA.title,
        projectB.title
      );

    const descriptionSimilarity =
      this.calculateTextSimilarity(
        projectA.description,
        projectB.description
      );

    const domainSimilarity =
      this.calculateTextSimilarity(
        projectA.domain,
        projectB.domain
      );

    const score =
      titleSimilarity * 0.65 +
      descriptionSimilarity * 0.30 +
      domainSimilarity * 0.05;

    const similarityScore =
      Math.round(
        Math.min(
          Math.max(score, 0),
          100
        )
      );

    return {
      similarityScore,
      titleSimilarity,
      descriptionSimilarity,
      domainSimilarity,
      action:
        this.getSimilarityAction(
          similarityScore
        ),
    };
  }

  /**
   * Compare a proposal against all
   * existing proposals.
   */
  checkSimilarity(
    proposal: SimilarityProjectInput,
    existingProjects: SimilarityProjectInput[]
  ): SimilarityCheckResult {
    const similarProjects:
      SimilarProjectResult[] =
      existingProjects
        .filter(
          (project) =>
            project.id !== proposal.id
        )
        .map((project) => {
          const result =
            this.compareProjects(
              proposal,
              project
            );

          return {
            projectId: project.id!,
            title: project.title,
            similarityScore:
              result.similarityScore,
            titleSimilarity:
              result.titleSimilarity,
            descriptionSimilarity:
              result.descriptionSimilarity,
            domainSimilarity:
              result.domainSimilarity,
            action:
              result.action,
          };
        })
        .sort(
          (a, b) =>
            b.similarityScore -
            a.similarityScore
        );

    const highestSimilarity =
      similarProjects.length > 0
        ? similarProjects[0]
            .similarityScore
        : 0;

    return {
      highestSimilarity,
      action:
        this.getSimilarityAction(
          highestSimilarity
        ),
      similarProjects,
    };
  }
}

export const similarityService =
  new SimilarityService();