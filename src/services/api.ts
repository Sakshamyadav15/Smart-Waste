import type { ClassificationResult, FeedbackPayload } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function classifyWaste(
  image: File,
  city: string
): Promise<ClassificationResult> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('city', city);

  try {
    const response = await fetch(`${API_BASE_URL}/classify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Classification failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Backend returns { status: "ok", data: { label, confidence, action, ... } }
    return {
      label: data.data.label,
      confidence: data.data.confidence,
      action: data.data.action,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to classify waste. Please try again.');
  }
}

export async function reportIncorrect(
  feedback: FeedbackPayload
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }
  } catch (error) {
    console.error('Feedback submission error:', error);
    throw error;
  }
}
