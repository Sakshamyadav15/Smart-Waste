export interface ClassificationResult {
  label: string;
  confidence: number;
  action: string;
}

export interface FeedbackPayload {
  predictionId?: number;
  originalLabel: string;
  correctLabel: string;
  city: string;
  notes?: string;
  userEmail?: string;
  confidence?: number;
}
