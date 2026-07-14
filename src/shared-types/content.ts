export interface ContentCommentCandidate {
  candidateId: string;
  text: string;
  context?: Record<string, unknown>;
}

export interface ContentCommentDecision {
  candidateId: string;
  text: string;
  decision: 'publish' | 'skip';
  reasonCode?: string;
}

export interface ContentCommentGenerationRequest {
  scenarioRef?: string;
  systemPrompt?: string;
  candidates: ContentCommentCandidate[];
}

export interface ContentCommentGenerationResult {
  decisions: ContentCommentDecision[];
  providerMetadata?: Record<string, unknown>;
}
