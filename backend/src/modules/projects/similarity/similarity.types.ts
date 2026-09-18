export type SimilarityAction =
  | 'ALLOW'
  | 'WARNING'
  | 'REVIEW_REQUIRED'
  | 'BLOCK';

export interface SimilarityProjectInput {
  id?: string;
  title: string;
  description: string;
  domain?: string | null;
}

export interface SimilarProjectResult {
  projectId: string;
  title: string;
  similarityScore: number;
  titleSimilarity: number;
  descriptionSimilarity: number;
  domainSimilarity: number;
  action: SimilarityAction;
}

export interface SimilarityCheckResult {
  highestSimilarity: number;
  action: SimilarityAction;
  similarProjects: SimilarProjectResult[];
}